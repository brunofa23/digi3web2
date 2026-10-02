import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import ReceiptPayment from './ReceiptPayment'

export default class ReceiptCashEntry extends BaseModel {
  public static table = 'receipt_cash_entries'

  @column({ isPrimary: true })
  public id: number
  @column()
  public companiesId: number
  @column()
  public receiptPaymentId: number
  @column()
  public amount: number
  @column.dateTime()
  public receivedAt: DateTime
  @column()
  public userId: number
  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => ReceiptPayment, { foreignKey: 'receiptPaymentId' })
  public receiptPayment: BelongsTo<typeof ReceiptPayment>
}
