import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Env from '@ioc:Adonis/Core/Env'
import { DateTime } from 'luxon'
import { timingSafeEqual } from 'crypto'
import BackupRun from 'App/Models/BackupRun'
import BackupCompanyStatus from 'App/Models/BackupCompanyStatus'

type ExpectedCompany = {
  companies_id: number
  company_name?: string | null
}

export default class BackupRunsController {
  private databaseKind = 'DATABASE_ACERVO'
  private rcloneKind = 'GDRIVE_RCLONE'

  private getNow() {
    return DateTime.now()
  }

  private secureEquals(value: string, expected: string) {
    const valueBuffer = Buffer.from(value)
    const expectedBuffer = Buffer.from(expected)

    if (valueBuffer.length !== expectedBuffer.length) return false

    return timingSafeEqual(valueBuffer, expectedBuffer)
  }

  private verifyWebhook({ request, response }: HttpContextContract) {
    const secret = Env.get('BACKUP_WEBHOOK_SECRET', '')

    if (!secret) {
      response.status(503).send({ message: 'Webhook de backup não configurado.' })
      return false
    }

    const authorization = request.header('authorization') || ''
    const token = authorization.startsWith('Bearer ')
      ? authorization.substring(7)
      : request.header('x-backup-webhook-secret') || ''

    if (!token || !this.secureEquals(token, secret)) {
      response.status(401).send({ message: 'Webhook de backup não autorizado.' })
      return false
    }

    return true
  }

  private async authorize({ auth, response }: HttpContextContract) {
    const user = await auth.use('api').authenticate()

    if (!user.superuser) {
      response.status(403).send({
        message: 'Usuário sem permissão para consultar backups.',
      })
      return null
    }

    return user
  }

  private getRunId(value: any) {
    const runId = String(value || '').trim()
    return runId.length > 0 && runId.length <= 80 ? runId : null
  }

  private getEvent(value: any) {
    const event = String(value || '').trim().toUpperCase()
    const allowedEvents = [
      'RUN_STARTED',
      'HEARTBEAT',
      'COMPANY_STARTED',
      'COMPANY_SUCCESS',
      'COMPANY_ERROR',
      'RUN_SUCCESS',
      'RUN_ERROR',
    ]

    return allowedEvents.includes(event) ? event : null
  }

  private getKind(value: any) {
    const kind = String(value || this.databaseKind).trim().toUpperCase()
    const allowedKinds = [this.databaseKind, this.rcloneKind]

    return allowedKinds.includes(kind) ? kind : null
  }

  private normalizeCompanies(value: any): ExpectedCompany[] {
    if (!Array.isArray(value)) return []

    return value
      .map((item) => {
        const companiesId = Number(typeof item === 'object' ? item.companies_id : item)
        const companyName = typeof item === 'object' ? String(item.company_name || '').trim() : ''

        return {
          companies_id: Number.isInteger(companiesId) && companiesId > 0 ? companiesId : 0,
          company_name: companyName || null,
        }
      })
      .filter((item) => item.companies_id > 0)
  }

  private async findOrCreateRun(runId: string, kind: string) {
    const existing = await BackupRun.query()
      .where('run_id', runId)
      .andWhere('kind', kind)
      .first()

    if (existing) return existing

    return BackupRun.create({
      runId,
      kind,
      status: 'RUNNING',
      startedAt: this.getNow(),
      lastHeartbeatAt: this.getNow(),
      expectedCompanies: 0,
      successCompanies: 0,
      errorCompanies: 0,
      pendingCompanies: 0,
    })
  }

  private async syncExpectedCompanies(run: BackupRun, companies: ExpectedCompany[]) {
    for (const company of companies) {
      const item = await BackupCompanyStatus.query()
        .where('backup_run_id', run.id)
        .andWhere('companies_id', company.companies_id)
        .first()

      if (item) {
        if (company.company_name && item.companyName !== company.company_name) {
          item.companyName = company.company_name
          await item.save()
        }
        continue
      }

      await BackupCompanyStatus.create({
        backupRunId: run.id,
        companiesId: company.companies_id,
        companyName: company.company_name || null,
        status: 'PENDING',
      })
    }
  }

  private async findOrCreateCompanyStatus(run: BackupRun, companiesId: number, companyName?: string) {
    const item = await BackupCompanyStatus.query()
      .where('backup_run_id', run.id)
      .andWhere('companies_id', companiesId)
      .first()

    if (item) return item

    return BackupCompanyStatus.create({
      backupRunId: run.id,
      companiesId,
      companyName: companyName || null,
      status: 'PENDING',
    })
  }

  private async updateCompanyStatus(run: BackupRun, payload: any, status: string) {
    const companiesId = Number(payload.companies_id)

    if (!Number.isInteger(companiesId) || companiesId <= 0) {
      throw new Error('Empresa obrigatória para evento de empresa.')
    }

    const item = await this.findOrCreateCompanyStatus(
      run,
      companiesId,
      String(payload.company_name || '').trim()
    )
    const now = this.getNow()

    item.status = status
    item.companyName = String(payload.company_name || item.companyName || '').trim() || null
    item.errorMessage = status === 'ERROR' ? String(payload.error_message || '').slice(0, 5000) : null
    item.metadata = payload.metadata || item.metadata || null

    if (!item.startedAt || status === 'RUNNING') {
      item.startedAt = now
    }

    if (['SUCCESS', 'ERROR'].includes(status)) {
      item.finishedAt = now
    }

    await item.save()
  }

  private async updateCounters(run: BackupRun) {
    const companies = await BackupCompanyStatus.query().where('backup_run_id', run.id)
    const success = companies.filter((company) => company.status === 'SUCCESS').length
    const error = companies.filter((company) => company.status === 'ERROR').length
    const pending = companies.filter((company) => ['PENDING', 'RUNNING'].includes(company.status)).length

    run.expectedCompanies = companies.length
    run.successCompanies = success
    run.errorCompanies = error
    run.pendingCompanies = pending
    await run.save()
  }

  private getEffectiveStatus(run: BackupRun) {
    if (run.status !== 'RUNNING') return run.status
    if (!run.lastHeartbeatAt) return 'NOT_RUNNING'

    const timeoutMinutes = Number(Env.get('BACKUP_HEARTBEAT_TIMEOUT_MINUTES', 30))
    const minutesSinceHeartbeat = this.getNow().diff(run.lastHeartbeatAt, 'minutes').minutes

    return minutesSinceHeartbeat > timeoutMinutes ? 'NOT_RUNNING' : 'RUNNING'
  }

  private serializeCompany(company: BackupCompanyStatus) {
    return {
      id: company.id,
      companies_id: company.companiesId,
      company_name: company.companyName,
      status: company.status,
      started_at: company.startedAt?.toISO() || null,
      finished_at: company.finishedAt?.toISO() || null,
      error_message: company.errorMessage,
      metadata: company.metadata,
    }
  }

  private serializeRun(run: BackupRun) {
    const companies = run.companies || []

    return {
      id: run.id,
      run_id: run.runId,
      kind: run.kind,
      status: this.getEffectiveStatus(run),
      stored_status: run.status,
      expected_companies: run.expectedCompanies,
      success_companies: run.successCompanies,
      error_companies: run.errorCompanies,
      pending_companies: run.pendingCompanies,
      started_at: run.startedAt?.toISO() || null,
      finished_at: run.finishedAt?.toISO() || null,
      last_heartbeat_at: run.lastHeartbeatAt?.toISO() || null,
      error_message: run.errorMessage,
      metadata: run.metadata,
      companies: {
        success: companies.filter((company) => company.status === 'SUCCESS').map((company) => this.serializeCompany(company)),
        error: companies.filter((company) => company.status === 'ERROR').map((company) => this.serializeCompany(company)),
        pending: companies.filter((company) => company.status === 'PENDING').map((company) => this.serializeCompany(company)),
        running: companies.filter((company) => company.status === 'RUNNING').map((company) => this.serializeCompany(company)),
      },
      created_at: run.createdAt?.toISO() || null,
      updated_at: run.updatedAt?.toISO() || null,
    }
  }

  public async event(ctx: HttpContextContract) {
    try {
      if (!this.verifyWebhook(ctx)) return

      const payload = ctx.request.body()
      const runId = this.getRunId(payload?.run_id)
      const event = this.getEvent(payload?.event)
      const kind = this.getKind(payload?.kind)

      if (!runId) {
        return ctx.response.status(400).send({ message: 'run_id obrigatório.' })
      }

      if (!event) {
        return ctx.response.status(400).send({ message: 'Evento de backup inválido.' })
      }

      if (!kind) {
        return ctx.response.status(400).send({ message: 'Tipo de backup inválido.' })
      }

      const run = await this.findOrCreateRun(runId, kind)
      const now = this.getNow()

      run.lastHeartbeatAt = now

      if (event === 'RUN_STARTED') {
        run.status = 'RUNNING'
        run.startedAt = run.startedAt || now
        run.finishedAt = null
        run.errorMessage = null
        run.metadata = payload.metadata || run.metadata || null
        await run.save()
        if (kind === this.databaseKind) {
          await this.syncExpectedCompanies(run, this.normalizeCompanies(payload.expected_companies))
        }
      }

      if (event === 'HEARTBEAT') {
        await run.save()
      }

      if (kind === this.databaseKind && event === 'COMPANY_STARTED') {
        await this.updateCompanyStatus(run, payload, 'RUNNING')
      }

      if (kind === this.databaseKind && event === 'COMPANY_SUCCESS') {
        await this.updateCompanyStatus(run, payload, 'SUCCESS')
      }

      if (kind === this.databaseKind && event === 'COMPANY_ERROR') {
        await this.updateCompanyStatus(run, payload, 'ERROR')
      }

      if (event === 'RUN_SUCCESS') {
        run.status = 'SUCCESS'
        run.finishedAt = now
        run.errorMessage = null
        run.metadata = payload.metadata || run.metadata || null
      }

      if (event === 'RUN_ERROR') {
        run.status = 'ERROR'
        run.finishedAt = now
        run.errorMessage = String(payload.error_message || 'Backup finalizado com erro.').slice(0, 5000)
        run.metadata = payload.metadata || run.metadata || null
      }

      await this.updateCounters(run)

      if (kind === this.databaseKind && event === 'RUN_SUCCESS') {
        run.status = run.errorCompanies === 0 && run.pendingCompanies === 0 ? 'SUCCESS' : 'ERROR'
        run.errorMessage = run.status === 'SUCCESS' ? null : 'Backup finalizado com empresas pendentes ou com erro.'
        await run.save()
      }

      return ctx.response.status(200).send({
        ok: true,
        run_id: run.runId,
        status: run.status,
      })
    } catch (error) {
      console.error('Erro ao receber evento de backup:', error)
      return ctx.response.status(500).send({
        message: 'Erro ao receber evento de backup.',
        error: error.message || String(error),
      })
    }
  }

  private async latestByKind(ctx: HttpContextContract, kind: string) {
    try {
      const user = await this.authorize(ctx)
      if (!user) return

      const run = await BackupRun.query()
        .where('kind', kind)
        .orderBy('started_at', 'desc')
        .preload('companies', (query) => query.orderBy('company_name', 'asc'))
        .first()

      return ctx.response.status(200).send({
        data: run ? this.serializeRun(run) : null,
      })
    } catch (error) {
      console.error('Erro ao consultar último backup do banco:', error)
      return ctx.response.status(500).send({
        message: 'Erro ao consultar último backup do banco.',
        error: error.message || String(error),
      })
    }
  }

  public async latestDatabase(ctx: HttpContextContract) {
    return this.latestByKind(ctx, this.databaseKind)
  }

  public async latestRclone(ctx: HttpContextContract) {
    return this.latestByKind(ctx, this.rcloneKind)
  }
}
