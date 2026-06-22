import { DateTime } from 'luxon'
import {
  BaseModel,
  BelongsTo,
  belongsTo,
  column,
} from '@ioc:Adonis/Lucid/Orm'
import Company from './Company'
import User from './User'

function parseJson(value: any) {
  if (!value) return null
  if (typeof value === 'string') return JSON.parse(value)
  return value
}

export default class AuditLog extends BaseModel {
  public static table = 'audit_logs'

  @column({ isPrimary: true })
  public id: number

  @column()
  public companiesId: number | null

  @column()
  public userId: number | null

  @column()
  public action: string

  @column()
  public entityTable: string | null

  @column()
  public entityId: number | null

  @column()
  public resourceKey: string | null

  @column({
    prepare: (value: any) => value === undefined ? null : JSON.stringify(value),
    consume: parseJson,
  })
  public entityKey: any

  @column()
  public description: string | null

  @column({
    prepare: (value: any) => value === undefined ? null : JSON.stringify(value),
    consume: parseJson,
  })
  public metadata: any

  @column({
    prepare: (value: any) => value === undefined ? null : JSON.stringify(value),
    consume: parseJson,
  })
  public changedFields: any

  @column({
    prepare: (value: any) => value === undefined ? null : JSON.stringify(value),
    consume: parseJson,
  })
  public beforeData: any

  @column({
    prepare: (value: any) => value === undefined ? null : JSON.stringify(value),
    consume: parseJson,
  })
  public afterData: any

  @column()
  public occurrenceCount: number

  @column.dateTime()
  public firstAt: DateTime | null

  @column.dateTime()
  public lastAt: DateTime | null

  @column()
  public ip: string | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Company, {
    foreignKey: 'companiesId',
  })
  public company: BelongsTo<typeof Company>

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  public user: BelongsTo<typeof User>
}
