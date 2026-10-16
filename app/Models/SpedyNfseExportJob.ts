import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class SpedyNfseExportJob extends BaseModel {
  public static table = 'spedy_nfse_export_jobs'

  @column({ isPrimary: true }) public id: number
  @column() public companiesId: number
  @column() public userId: number
  @column() public format: 'xml' | 'pdf'
  @column() public status: string
  @column() public total: number
  @column() public processed: number
  @column() public invoiceIds: string
  @column() public failures: string | null
  @column() public fileName: string | null
  @column() public errorMessage: string | null
  @column.dateTime({ autoCreate: true }) public createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true }) public updatedAt: DateTime
}
