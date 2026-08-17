import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Company from './Company'

export default class CompanyAttachment extends BaseModel {
  public static get table() {
    return 'company_attachments'
  }

  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'companies_id' })
  public companiesId: number

  @column()
  public description: string

  @column({ columnName: 'original_name' })
  public originalName: string

  @column({ columnName: 'file_name' })
  public fileName: string

  @column({ columnName: 'mime_type' })
  public mimeType: string | null

  @column()
  public extension: string

  @column()
  public size: number | null

  @column({ columnName: 'drive_file_id' })
  public driveFileId: string

  @column({ columnName: 'drive_folder_id' })
  public driveFolderId: string

  @column({ columnName: 'uploaded_by' })
  public uploadedBy: number | null

  @column.dateTime({ columnName: 'deleted_at' })
  public deletedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Company, {
    foreignKey: 'companiesId',
  })
  public company: BelongsTo<typeof Company>
}
