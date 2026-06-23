import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { DateTime } from 'luxon'
import AuditLog from 'App/Models/AuditLog'
import User from 'App/Models/User'
import Company from 'App/Models/Company'

export default class AuditLogsController {
  public async index({ auth, request, response }: HttpContextContract) {
    try {
      const authenticate = await auth.use('api').authenticate()
      const {
        companies_id,
        user_id,
        action,
        entity_table,
        dateStart,
        dateEnd,
        search,
        limit,
      } = request.only([
        'companies_id',
        'user_id',
        'action',
        'entity_table',
        'dateStart',
        'dateEnd',
        'search',
        'limit',
      ])

      const maxLimit = Math.min(Number(limit) || 200, 500)
      const effectiveCompanyId = authenticate.superuser && companies_id
        ? companies_id
        : authenticate.companies_id
      const query = AuditLog.query()
        .orderBy('created_at', 'desc')
        .limit(maxLimit)

      query.where('companies_id', effectiveCompanyId)

      if (user_id) {
        const user = await User.query()
          .where('id', user_id)
          .andWhere('companies_id', effectiveCompanyId)
          .first()

        if (!user) return response.status(200).send([])

        query.andWhere('user_id', user_id)
      }

      if (action) query.andWhere('action', action)
      if (entity_table) query.andWhere('entity_table', entity_table)

      if (dateStart) {
        const dateStartSql = DateTime.fromISO(dateStart).startOf('day').toFormat('yyyy-MM-dd HH:mm:ss')
        query.andWhere('created_at', '>=', dateStartSql)
      }

      if (dateEnd) {
        const dateEndSql = DateTime.fromISO(dateEnd).endOf('day').toFormat('yyyy-MM-dd HH:mm:ss')
        query.andWhere('created_at', '<=', dateEndSql)
      }

      if (search) {
        query.andWhere((builder) => {
          builder
            .where('description', 'like', `%${search}%`)
            .orWhere('resource_key', 'like', `%${search}%`)
        })
      }

      const data = await query
      const userIds = Array.from(new Set(data.map((item) => item.userId).filter(Boolean)))
      const companyIds = Array.from(new Set(data.map((item) => item.companiesId).filter(Boolean)))

      const users = userIds.length
        ? await User.query().whereIn('id', userIds as number[]).select('id', 'name', 'username')
        : []
      const companies = companyIds.length
        ? await Company.query().whereIn('id', companyIds as number[]).select('id', 'name', 'shortname')
        : []

      const usersById = new Map(users.map((user) => [user.id, user]))
      const companiesById = new Map(companies.map((company) => [company.id, company]))

      return response.status(200).send(data.map((item) => ({
        id: item.id,
        companies_id: item.companiesId,
        user_id: item.userId,
        action: item.action,
        entity_table: item.entityTable,
        entity_id: item.entityId,
        resource_key: item.resourceKey,
        entity_key: item.entityKey,
        description: item.description,
        metadata: item.metadata,
        changed_fields: item.changedFields,
        before_data: item.beforeData,
        after_data: item.afterData,
        occurrence_count: item.occurrenceCount,
        first_at: item.firstAt?.toISO(),
        last_at: item.lastAt?.toISO(),
        ip: item.ip,
        created_at: item.createdAt?.toISO(),
        updated_at: item.updatedAt?.toISO(),
        user: item.userId ? usersById.get(item.userId) : null,
        company: item.companiesId ? companiesById.get(item.companiesId) : null,
      })))
    } catch (error) {
      console.error('Erro ao consultar auditoria:', error)
      return response.status(500).send({
        message: 'Erro ao consultar auditoria.',
        error: error.message || String(error),
        code: error.code,
      })
    }
  }
}
