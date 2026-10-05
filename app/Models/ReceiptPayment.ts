import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import Receipt from './Receipt'
import FinPaymentMethod from './FinPaymentMethod'

export default class ReceiptPayment extends BaseModel {
  public static table = 'receipt_payments'

  @column({ isPrimary: true })
  public id: number
  @column()
  public companiesId: number
  @column()
  public receiptId: number
  @column()
  public finPaymentmethodId: number
  @column()
  public paymentGroup: number
  @column()
  public installmentNumber: number
  @column()
  public installmentCount: number
  @column()
  public amount: number
  @column.date()
  public dueDate: DateTime
  @column.dateTime()
  public receivedAt: DateTime | null
  @column()
  public receivedBy: number | null
  @column.dateTime()
  public canceledAt: DateTime | null
  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Receipt, { foreignKey: 'receiptId' })
  public receipt: BelongsTo<typeof Receipt>
  @belongsTo(() => FinPaymentMethod, { foreignKey: 'finPaymentmethodId' })
  public paymentMethod: BelongsTo<typeof FinPaymentMethod>
}
