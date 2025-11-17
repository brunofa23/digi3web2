import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  belongsTo,
  BelongsTo,
} from '@ioc:Adonis/Lucid/Orm'

import Company from 'App/Models/Company'
import MarriedCertificate from './MarriedCertificate'

export default class OrderCertificate extends BaseModel {
  public static table = 'order_certificates'

  @column({ isPrimary: true })
  public id: number

  @column()
  public companiesId: number

  @column()
  public typeCertificate: number

  @column()
  public certificateId: number

  @belongsTo(() => Company, {
    foreignKey: 'companiesId',
  })
  public company: BelongsTo<typeof Company>

  @belongsTo(() => MarriedCertificate, {
    foreignKey: 'certificateId',
  })
  public marriedCertificate: BelongsTo<typeof MarriedCertificate>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
