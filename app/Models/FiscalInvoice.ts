import { DateTime } from 'luxon'
import { BaseModel, belongsTo, BelongsTo, column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import Company from 'App/Models/Company'
import Receipt from 'App/Models/Receipt'
import FiscalInvoiceEvent from 'App/Models/FiscalInvoiceEvent'

export default class FiscalInvoice extends BaseModel {
  public static table = 'fiscal_invoices'

  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'companies_id' })
  public companiesId: number

  @column()
  public receiptId?: number | null

  @column()
  public sourceType: string

  @column()
  public provider: string

  @column()
  public model: string

  @column()
  public integrationId: string

  @column()
  public spedyInvoiceId?: string | null

  @column()
  public status: string

  @column()
  public number?: string | null

  @column()
  public series?: string | null

  @column()
  public rpsNumber?: string | null

  @column()
  public amount: number

  @column()
  public description?: string | null

  @column()
  public receiverName?: string | null

  @column()
  public receiverDocument?: string | null

  @column()
  public receiverEmail?: string | null

  @column()
  public processingStatus?: string | null

  @column()
  public processingCode?: string | null

  @column()
  public processingMessage?: string | null

  @column()
  public payloadJson?: any

  @column()
  public responseJson?: any

  @column.dateTime()
  public issuedAt?: DateTime | null

  @column.dateTime()
  public canceledAt?: DateTime | null

  @belongsTo(() => Company, { foreignKey: 'companiesId' })
  public company: BelongsTo<typeof Company>

  @belongsTo(() => Receipt, { foreignKey: 'receiptId' })
  public receipt: BelongsTo<typeof Receipt>

  @hasMany(() => FiscalInvoiceEvent, { foreignKey: 'fiscalInvoiceId' })
  public events: HasMany<typeof FiscalInvoiceEvent>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
