import { DateTime } from 'luxon'
import Encryption from '@ioc:Adonis/Core/Encryption'
import { afterFetch, afterFind, BaseModel, beforeSave, belongsTo, BelongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import { types } from '@ioc:Adonis/Core/Helpers'
import Company from './Company'

function parseJson(value: any) {
  if (!value) return null
  if (typeof value === 'string') return JSON.parse(value)
  return value
}

export default class CompanySpedyIntegration extends BaseModel {
  public static table = 'company_spedy_integrations'

  @column({ isPrimary: true })
  public id: number

  @column()
  public companiesId: number

  @column()
  public environment: 'sandbox' | 'production'

  @column()
  public spedyCompanyId?: string | null

  @column({ serializeAs: null })
  public spedyApiKey?: string | null

  @column()
  public isOwner: boolean

  @column()
  public active: boolean

  @column.dateTime()
  public lastSyncAt?: DateTime | null

  @column({
    prepare: (value: any) => value === undefined ? null : JSON.stringify(value),
    consume: parseJson,
  })
  public lastCompanySnapshot?: any

  @column({
    prepare: (value: any) => value === undefined ? null : JSON.stringify(value),
    consume: parseJson,
  })
  public serviceInvoiceDefaults?: any

  @belongsTo(() => Company, {
    foreignKey: 'companiesId',
  })
  public company: BelongsTo<typeof Company>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeSave()
  public static async encryptApiKey(integration: CompanySpedyIntegration) {
    if (integration.$dirty.spedyApiKey && integration.spedyApiKey) {
      integration.spedyApiKey = await Encryption.encrypt(integration.spedyApiKey)
    }
  }

  @afterFind()
  public static decryptApiKey(integration: CompanySpedyIntegration) {
    if (!types.isNull(integration.spedyApiKey) && integration.spedyApiKey) {
      integration.spedyApiKey = Encryption.decrypt(integration.spedyApiKey)
    }
  }

  @afterFetch()
  public static decryptApiKeys(integrations: CompanySpedyIntegration[]) {
    integrations.forEach((integration) => this.decryptApiKey(integration))
  }
}
