import { DateTime } from 'luxon'
import { BaseModel, belongsTo, BelongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Company from 'App/Models/Company'
import Service from 'App/Models/Service'

export default class ServiceFiscalConfig extends BaseModel {
  public static table = 'service_fiscal_configs'

  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'companies_id' })
  public companiesId: number

  @column()
  public serviceId: number

  @column()
  public federalServiceCode?: string | null

  @column()
  public cityServiceCode?: string | null

  @column()
  public nbsCode?: string | null

  @column()
  public taxationType?: string | null

  @column()
  public issRate?: number | null

  @column()
  public issWithheld: boolean

  @column()
  public descriptionTemplate?: string | null

  @column()
  public enabled: boolean

  @belongsTo(() => Company, { foreignKey: 'companiesId' })
  public company: BelongsTo<typeof Company>

  @belongsTo(() => Service, { foreignKey: 'serviceId' })
  public service: BelongsTo<typeof Service>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
