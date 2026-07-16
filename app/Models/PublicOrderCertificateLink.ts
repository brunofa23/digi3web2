import { DateTime } from 'luxon'
import {
  BaseModel,
  belongsTo,
  BelongsTo,
  column,
} from '@ioc:Adonis/Lucid/Orm'

import Company from 'App/Models/Company'

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

  @belongsTo(() => Company, {
    foreignKey: 'companiesId',
  })
  public company: BelongsTo<typeof Company>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
