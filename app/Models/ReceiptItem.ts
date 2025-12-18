// app/Models/ReceiptItem.ts
import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  belongsTo,
  BelongsTo,
} from '@ioc:Adonis/Lucid/Orm'

import Company from 'App/Models/Company'
import Receipt from 'App/Models/Receipt'
import Service from 'App/Models/Service'
import Emolument from 'App/Models/Emolument'

export default class ReceiptItem extends BaseModel {
  public static table = 'receipt_items'

  @column({ isPrimary: true })
  public id: number

  @column()
  public companiesId: number

  @column()
  public receiptId: number

  @column()
  public serviceId: number

  @column()
  public emolumentId: number

  @column()
  public qtde: number

  @column()
  public amount: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  // Relationships
  @belongsTo(() => Company, { foreignKey: 'companiesId' })
  public company: BelongsTo<typeof Company>

  @belongsTo(() => Receipt, { foreignKey: 'receiptId' })
  public receipt: BelongsTo<typeof Receipt>

  @belongsTo(() => Service, { foreignKey: 'serviceId' })
  public service: BelongsTo<typeof Service>

  @belongsTo(() => Emolument, { foreignKey: 'emolumentId' })
  public emolument: BelongsTo<typeof Emolument>
}
