import { DateTime } from 'luxon'
import { BaseModel, beforeSave, afterFind, belongsTo, BelongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Encryption from '@ioc:Adonis/Core/Encryption'
import { types } from '@ioc:Adonis/Core/Helpers'
import Company from 'App/Models/Company'

export default class CompanyFiscalIntegration extends BaseModel {
  public static table = 'company_fiscal_integrations'

  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'companies_id' })
  public companiesId: number

  @column()
  public provider: string

  @column()
  public environment: string

  @column()
  public spedyCompanyId?: string | null

  @column({ serializeAs: null })
  public spedyApiKey?: string | null

  @column()
  public taxRegime?: string | null

  @column()
  public stateTaxNumber?: string | null

  @column()
  public cityTaxNumber?: string | null

  @column()
  public economicActivityCode?: string | null

  @column()
  public cityIbgeCode?: string | null

  @column()
  public defaultFederalServiceCode?: string | null

  @column()
  public defaultCityServiceCode?: string | null

  @column()
  public defaultNbsCode?: string | null

  @column()
  public defaultIssRate?: number | null

  @column()
  public defaultTaxationType?: string | null

  @column()
  public enabled: boolean

  @belongsTo(() => Company, { foreignKey: 'companiesId' })
  public company: BelongsTo<typeof Company>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeSave()
  public static async encryptApiKey(config: CompanyFiscalIntegration) {
    if (config.$dirty.spedyApiKey && config.spedyApiKey) {
      config.spedyApiKey = await Encryption.encrypt(config.spedyApiKey)
    }
  }

  @afterFind()
  public static decryptApiKey(config: CompanyFiscalIntegration) {
    if (!types.isNull(config.spedyApiKey) && config.spedyApiKey) {
      config.spedyApiKey = Encryption.decrypt(config.spedyApiKey)
    }
  }
}
