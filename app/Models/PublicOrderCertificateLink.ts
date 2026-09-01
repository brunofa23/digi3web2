import { DateTime } from 'luxon'
import {
  BaseModel,
  belongsTo,
  BelongsTo,
  column,
} from '@ioc:Adonis/Lucid/Orm'

import Company from 'App/Models/Company'

function parseJson(value: any) {
  if (!value) return null
  if (typeof value === 'string') return JSON.parse(value)
  return value
}

export default class PublicOrderCertificateLink extends BaseModel {
  public static table = 'public_order_certificate_links'

  @column({ isPrimary: true })
  public id: number

  @column({
    columnName: 'companies_id',
    serializeAs: 'companiesId',
  })
  public companiesId: number

  @column()
  public type: string

  @column()
  public token: string

  @column()
  public active: boolean

  @column({
    columnName: 'form_settings',
    serializeAs: 'formSettings',
    prepare: (value: any) => value === undefined ? null : JSON.stringify(value),
    consume: parseJson,
  })
  public formSettings?: any

  @belongsTo(() => Company, {
    foreignKey: 'companiesId',
  })
  public company: BelongsTo<typeof Company>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
