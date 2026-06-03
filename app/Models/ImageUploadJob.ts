import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class ImageUploadJob extends BaseModel {
  public static table = 'image_upload_jobs'

  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'companies_id' })
  public companiesId: number

  @column({ columnName: 'typebooks_id' })
  public typebooksId: number | null

  @column()
  public status: string

  @column()
  public source: string | null

  @column({ columnName: 'file_names' })
  public fileNames: string | null

  @column({ columnName: 'data_images' })
  public dataImages: string | null

  @column({ columnName: 'result_files' })
  public resultFiles: string | null

  @column({ columnName: 'error_message' })
  public errorMessage: string | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  public updatedAt: DateTime
}
