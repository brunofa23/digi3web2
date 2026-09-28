import { DateTime } from 'luxon'
import { isDeepStrictEqual } from 'util'
import Database from '@ioc:Adonis/Lucid/Database'
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

  @column({
    serializeAs: null,
    prepare: (value: any) => value == null ? null : JSON.stringify(value),
    consume: parseJson,
  })
  public processingHistory?: any[] | null

  public getProcessingHistory() {
    if (this.processingHistory?.length) return [...this.processingHistory]
    if (!this.$isPersisted || (!this.status && !this.processingDetail)) return []

    return [this.historyEntry('previous', this.updatedAt?.toISO() || null)]
  }

  private historyEntry(source: string, recordedAt: string | null) {
    return {
      source,
      recordedAt,
      status: this.status || null,
      number: this.number || null,
      processingDetail: this.processingDetail || null,
    }
  }

  public applyWithHistory(values: any, source: string) {
    const history = this.getProcessingHistory()
    this.merge(values)
    const entry = this.historyEntry(source, DateTime.utc().toISO())
    const last = history[history.length - 1]

    // O MySQL pode reordenar as chaves JSON. Comparar os objetos evita
    // duplicar acontecimentos ao consultar novamente o mesmo retorno.
    if (source !== 'sync' || !last || last.status !== entry.status
      || last.number !== entry.number || !isDeepStrictEqual(last.processingDetail, entry.processingDetail)) {
      history.push(entry)
    }
    this.processingHistory = history
  }

  public static async saveWithHistory(values: any, source: string, invoiceId?: number) {
    return Database.transaction(async (trx) => {
      const invoice = invoiceId
        ? await this.query({ client: trx }).where('id', invoiceId).forUpdate().firstOrFail()
        : new SpedyServiceInvoice()
      invoice.useTransaction(trx)
      invoice.applyWithHistory(values, source)
      await invoice.save()
      return invoice
    })
  }

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Company, { foreignKey: 'companiesId' })
  public company: BelongsTo<typeof Company>

  @belongsTo(() => Receipt, { foreignKey: 'receiptId' })
  public receipt: BelongsTo<typeof Receipt>
}
