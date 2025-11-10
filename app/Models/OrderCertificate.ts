import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class OrderCertificate extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public typeCertificate: number | null

  @column()
  public certificateId: number | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
