import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { DateTime } from 'luxon'
import ImageUploadJob from 'App/Models/ImageUploadJob'
import User from 'App/Models/User'
import Company from 'App/Models/Company'
import Typebook from 'App/Models/Typebook'
import { verifyPermission } from 'App/Services/util'
import {
  cleanupOldImageUploadJobs,
  getUploadJobRetentionStart,
  RETENTION_DAYS,
} from 'App/Services/imageUploadJobs'

export default class ImageUploadJobsController {
  private permissiongroupId = 45

  private parseJson(value: string | null, fallback: any) {
    if (!value) return fallback

    try {
      return JSON.parse(value)
    } catch (error) {
      return fallback
    }
  }

  private getSummary(job: ImageUploadJob) {
    const resultFiles = this.parseJson(job.resultFiles, {})
    const summary = resultFiles?.summary || {}

    return {
      total: Number(summary.total || 0),
      uploaded: Number(summary.uploaded || 0),
      skipped: Number(summary.skipped || 0),
    }
  }

  private getUploadStatus(job: ImageUploadJob) {
    if (job.status === 'FAILED') return 'failed'
    if (job.status !== 'COMPLETED') return 'processing'

    const summary = this.getSummary(job)

    if (summary.uploaded > 0 && summary.skipped > 0) return 'partial'
    if (summary.uploaded > 0) return 'uploaded'
    if (summary.skipped > 0) return 'not_uploaded'

    return 'completed'
  }

  private shouldShowJob(job: ImageUploadJob) {
    const summary = this.getSummary(job)

    return !(job.status === 'COMPLETED' && summary.total === 0 && summary.uploaded === 0 && summary.skipped === 0)
  }

  private getDateStart(dateStart: string | undefined) {
    const retentionStart = getUploadJobRetentionStart()
    if (!dateStart) return retentionStart

    const parsed = DateTime.fromISO(dateStart).startOf('day')
    if (!parsed.isValid || parsed < retentionStart) return retentionStart

    return parsed
  }

  public async index({ auth, request, response }: HttpContextContract) {
    try {
      const authenticate = await auth.use('api').authenticate()
      const permissions = auth.use('api').token?.meta.payload.permissions || []

      if (!verifyPermission(Boolean(authenticate.superuser), permissions, this.permissiongroupId)) {
        return response.status(403).send({
          message: 'Usuário sem permissão para acessar histórico de uploads de imagens.',
        })
      }

      await cleanupOldImageUploadJobs()

      const {
        companies_id,
        typebooks_id,
        user_id,
        dateStart,
        dateEnd,
        status,
        search,
        limit,
      } = request.only([
        'companies_id',
        'typebooks_id',
        'user_id',
        'dateStart',
        'dateEnd',
        'status',
        'search',
        'limit',
      ])

      const maxLimit = Math.min(Number(limit) || 200, 500)
      const effectiveCompanyId = authenticate.superuser && companies_id
        ? companies_id
        : authenticate.companies_id
      const start = this.getDateStart(dateStart)
      const end = dateEnd && DateTime.fromISO(dateEnd).isValid
        ? DateTime.fromISO(dateEnd).endOf('day')
        : DateTime.local().endOf('day')

      const query = ImageUploadJob.query()
        .where('companies_id', effectiveCompanyId)
        .andWhere('created_at', '>=', start.toFormat('yyyy-MM-dd HH:mm:ss'))
        .andWhere('created_at', '<=', end.toFormat('yyyy-MM-dd HH:mm:ss'))
        .orderBy('created_at', 'desc')
        .limit(Math.min(maxLimit * 3, 1000))

      if (typebooks_id) query.andWhere('typebooks_id', typebooks_id)
      if (user_id) query.andWhere('user_id', user_id)

      if (search) {
        query.andWhere((builder) => {
          builder
            .where('file_names', 'like', `%${search}%`)
            .orWhere('result_files', 'like', `%${search}%`)
            .orWhere('error_message', 'like', `%${search}%`)
        })
      }

      const jobs = await query
      const visibleJobs = jobs.filter((job) => this.shouldShowJob(job))
      const filteredJobs = status
        ? visibleJobs.filter((job) => this.getUploadStatus(job) === status)
        : visibleJobs
      const limitedJobs = filteredJobs.slice(0, maxLimit)
      const userIds = Array.from(new Set(limitedJobs.map((item) => item.userId).filter(Boolean)))
      const typebookIds = Array.from(new Set(limitedJobs.map((item) => item.typebooksId).filter(Boolean)))

      const users = userIds.length
        ? await User.query().whereIn('id', userIds as number[]).select('id', 'name', 'username')
        : []
      const company = await Company.query().where('id', effectiveCompanyId).select('id', 'name', 'shortname').first()
      const typebooks = typebookIds.length
        ? await Typebook.query()
          .where('companies_id', effectiveCompanyId)
          .whereIn('id', typebookIds as number[])
          .select('id', 'name')
        : []

      const usersById = new Map(users.map((user) => [user.id, user]))
      const typebooksById = new Map(typebooks.map((typebook) => [typebook.id, typebook]))

      return response.status(200).send({
        retentionDays: RETENTION_DAYS,
        data: limitedJobs.map((job) => {
          const resultFiles = this.parseJson(job.resultFiles, {})
          const fileNames = this.parseJson(job.fileNames, [])
          const dataImages = this.parseJson(job.dataImages, {})

          return {
            id: job.id,
            companies_id: job.companiesId,
            typebooks_id: job.typebooksId,
            user_id: job.userId,
            status: job.status,
            upload_status: this.getUploadStatus(job),
            source: job.source,
            file_names: fileNames,
            data_images: dataImages,
            summary: this.getSummary(job),
            uploaded_files: resultFiles?.uploadedFiles || [],
            skipped_files: resultFiles?.skippedFiles || [],
            error_message: job.errorMessage,
            created_at: job.createdAt?.toISO(),
            updated_at: job.updatedAt?.toISO(),
            user: job.userId ? usersById.get(job.userId) : null,
            company,
            typebook: job.typebooksId ? typebooksById.get(job.typebooksId) : null,
          }
        }),
      })
    } catch (error) {
      console.error('Erro ao consultar histórico de uploads de imagens:', error)
      return response.status(500).send({
        message: 'Erro ao consultar histórico de uploads de imagens.',
        error: error.message || String(error),
        code: error.code,
      })
    }
  }
}
