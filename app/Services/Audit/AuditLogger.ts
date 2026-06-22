import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { DateTime } from 'luxon'
import AuditLog from 'App/Models/AuditLog'

type AuditPayload = {
  companiesId?: number | null
  userId?: number | null
  action: string
  entityTable?: string | null
  entityId?: number | null
  entityKey?: any
  resourceKey?: string | null
  description?: string | null
  metadata?: any
  beforeData?: any
  afterData?: any
  changedFields?: string[] | null
}

const hiddenFields = [
  'password',
  'remember_me_token',
  'token',
  'credentials',
  'public_key',
  'device_cookie_hash',
  'credential_id',
  'imageBase64',
  'imageCaptureBase64',
  'fileDownload',
  'index_text',
]

function toPlain(value: any) {
  if (!value) return null
  if (typeof value.serialize === 'function') return value.serialize()
  if (value.$attributes) return { ...value.$attributes }
  if (typeof value === 'object') return { ...value }
  return value
}

function sanitize(value: any) {
  const plain = toPlain(value)
  if (!plain || typeof plain !== 'object') return plain

  const sanitized: any = {}

  for (const [key, rawValue] of Object.entries(plain)) {
    if (hiddenFields.includes(key)) continue

    if (typeof rawValue === 'string' && rawValue.length > 500) {
      sanitized[key] = `${rawValue.slice(0, 500)}...`
      continue
    }

    sanitized[key] = rawValue
  }

  return sanitized
}

function buildDiff(beforeData: any, afterData: any) {
  const before = sanitize(beforeData) || {}
  const after = sanitize(afterData) || {}
  const changedFields: string[] = []
  const beforeDiff: any = {}
  const afterDiff: any = {}

  for (const key of Object.keys(after)) {
    if (['created_at', 'updated_at', 'createdAt', 'updatedAt'].includes(key)) continue

    const beforeValue = before[key]
    const afterValue = after[key]

    if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
      changedFields.push(key)
      beforeDiff[key] = beforeValue
      afterDiff[key] = afterValue
    }
  }

  return { changedFields, beforeDiff, afterDiff }
}

export default class AuditLogger {
  private static getRequestIp(ctx?: HttpContextContract) {
    if (!ctx) return null

    return ctx.request.header('x-forwarded-for')?.split(',')?.[0]?.trim() || ctx.request.ip()
  }

  public static async record(ctx: HttpContextContract | undefined, payload: AuditPayload) {
    try {
      const now = DateTime.now()

      return await AuditLog.create({
        companiesId: payload.companiesId || null,
        userId: payload.userId || null,
        action: payload.action,
        entityTable: payload.entityTable || null,
        entityId: payload.entityId || null,
        resourceKey: payload.resourceKey || null,
        entityKey: payload.entityKey || null,
        description: payload.description || null,
        metadata: sanitize(payload.metadata),
        changedFields: payload.changedFields || null,
        beforeData: sanitize(payload.beforeData),
        afterData: sanitize(payload.afterData),
        occurrenceCount: 1,
        firstAt: now,
        lastAt: now,
        ip: this.getRequestIp(ctx),
      })
    } catch (error) {
      console.error('Erro ao registrar auditoria:', error)
      return null
    }
  }

  public static async login(ctx: HttpContextContract, user: any) {
    return this.record(ctx, {
      companiesId: user.companies_id,
      userId: user.id,
      action: 'login',
      entityTable: 'users',
      entityId: user.id,
      resourceKey: `users:${user.id}`,
      description: `Usuário ${user.name || user.username} fez login`,
      metadata: {
        username: user.username,
      },
    })
  }

  public static async imageView(ctx: HttpContextContract, payload: AuditPayload) {
    try {
      const now = DateTime.now()
      const compactAfter = now.minus({ minutes: 5 })

      const existent = await AuditLog.query()
        .where('companies_id', payload.companiesId || 0)
        .andWhere('user_id', payload.userId || 0)
        .andWhere('action', 'image_view')
        .andWhere('resource_key', payload.resourceKey || '')
        .andWhere('last_at', '>=', compactAfter.toFormat('yyyy-MM-dd HH:mm:ss'))
        .first()

      if (existent) {
        existent.occurrenceCount = Number(existent.occurrenceCount || 1) + 1
        existent.lastAt = now
        await existent.save()
        return existent
      }

      return this.record(ctx, {
        ...payload,
        action: 'image_view',
      })
    } catch (error) {
      console.error('Erro ao registrar visualização de imagem:', error)
      return null
    }
  }

  public static async imageUpload(ctx: HttpContextContract, payload: AuditPayload) {
    return this.record(ctx, {
      ...payload,
      action: 'image_upload',
    })
  }

  public static async created(ctx: HttpContextContract, payload: AuditPayload) {
    return this.record(ctx, {
      ...payload,
      afterData: payload.afterData,
    })
  }

  public static async updated(ctx: HttpContextContract, payload: AuditPayload) {
    const diff = buildDiff(payload.beforeData, payload.afterData)

    if (!diff.changedFields.length) return null

    return this.record(ctx, {
      ...payload,
      changedFields: diff.changedFields,
      beforeData: diff.beforeDiff,
      afterData: diff.afterDiff,
    })
  }

  public static async deleted(ctx: HttpContextContract, payload: AuditPayload) {
    return this.record(ctx, {
      ...payload,
      beforeData: payload.beforeData,
    })
  }
}
