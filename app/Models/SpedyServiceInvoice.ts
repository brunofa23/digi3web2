import { DateTime } from 'luxon'
import { BaseModel, belongsTo, BelongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Company from './Company'
import Receipt from './Receipt'

function parseJson(value: any) {
  if (!value) return null
  if (typeof value === 'string') return JSON.parse(value)
  return value
}

export default class SpedyServiceInvoice extends BaseModel {
  public static table = 'spedy_service_invoices'

  @column({ isPrimary: true })
  public id: number

  @column()
  public companiesId: number

  @column()
  public receiptId?: number | null

  @column()
  public environment: 'sandbox' | 'production'

  @column()
  public spedyCompanyId?: string | null

  @column()
  public spedyInvoiceId?: string | null

  @column()
  public integrationId: string

  @column()
  public status?: string | null

  @column()
  public number?: string | null

  @column()
  public amount: number

  @column()
  public receiverName?: string | null

  @column()
  public receiverFederalTaxNumber?: string | null

  @column()
  public description?: string | null

  @column.dateTime()
  public effectiveDate?: DateTime | null

  @column({
    prepare: (value: any) => value === undefined ? null : JSON.stringify(value),
    consume: parseJson,
  })
  public requestPayload?: any

  @column({
    prepare: (value: any) => value === undefined ? null : JSON.stringify(value),
    consume: parseJson,
  })
  public responsePayload?: any

  @column({
    prepare: (value: any) => value === undefined ? null : JSON.stringify(value),
    consume: parseJson,
  })
  public processingDetail?: any

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Company, { foreignKey: 'companiesId' })
  public company: BelongsTo<typeof Company>

  @belongsTo(() => Receipt, { foreignKey: 'receiptId' })
  public receipt: BelongsTo<typeof Receipt>
}
