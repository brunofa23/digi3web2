// app/Models/Receipt.ts
import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  belongsTo,
  BelongsTo,
  hasMany, HasMany
} from '@ioc:Adonis/Lucid/Orm'

import Company from 'App/Models/Company'
import OrderCertificate from 'App/Models/OrderCertificate'
import Service from 'App/Models/Service'
import User from 'App/Models/User'
import Typebook from 'App/Models/Typebook'
import ReceiptItem from './ReceiptItem'

export default class Receipt extends BaseModel {
  public static table = 'receipts'

  @column({ isPrimary: true })
  public id: number

  @column()
  public companiesId: number

  @column()
  public orderCertificateId: number

  @column()
  public serviceId: number

  @column()
  public userId: number

  @column()
  public applicant?: string | null

  @column()
  public cpfApplicant?: string | null

  @column()
  public registered1?: string | null

  @column()
  public cpfRegistered1?: string | null

  @column()
  public registered2?: string | null

  @column()
  public cpfRegistered2?: string | null

  @column()
  public typebookId?: number | null

  @column()
  public book?: number | null

  @column()
  public sheet?: number | null

  @column()
  public side?: string | null

  @column.date()
  public datePrevision?: DateTime | null

  @column.date()
  public dateStamp?: DateTime | null

  @column.dateTime()
  public dateMarriage?: DateTime | null

  @column()
  public securitySheet?: string | null

  @column()
  public habilitationProccess?: string | null

  @column()
  public status?: string | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Company, { foreignKey: 'companiesId' })
  public company: BelongsTo<typeof Company>

  @belongsTo(() => OrderCertificate, { foreignKey: 'orderCertificateId' })
  public orderCertificate: BelongsTo<typeof OrderCertificate>

  @belongsTo(() => Service, { foreignKey: 'serviceId' })
  public service: BelongsTo<typeof Service>

  @belongsTo(() => User, { foreignKey: 'userId' })
  public user: BelongsTo<typeof User>

  @belongsTo(() => Typebook, { foreignKey: 'typebookId' })
  public typebook: BelongsTo<typeof Typebook>

  @hasMany(() => ReceiptItem, { foreignKey: 'receiptId' })
  public items: HasMany<typeof ReceiptItem>
}
