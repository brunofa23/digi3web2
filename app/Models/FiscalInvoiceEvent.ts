import { DateTime } from 'luxon'
import { BaseModel, belongsTo, BelongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Company from 'App/Models/Company'
import FiscalInvoice from 'App/Models/FiscalInvoice'

export default class FiscalInvoiceEvent extends BaseModel {
  public static table = 'fiscal_invoice_events'

  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'companies_id' })
  public companiesId: number

  @column()
  public fiscalInvoiceId?: number | null

  @column()
  public event: string

  @column()
  public oldStatus?: string | null

  @column()
  public newStatus?: string | null

  @column()
  public message?: string | null

  @column()
  public payloadJson?: any

  @belongsTo(() => Company, { foreignKey: 'companiesId' })
  public company: BelongsTo<typeof Company>

  @belongsTo(() => FiscalInvoice, { foreignKey: 'fiscalInvoiceId' })
  public fiscalInvoice: BelongsTo<typeof FiscalInvoice>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
