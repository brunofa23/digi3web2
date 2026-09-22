import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import DriveDeletionBatch from './DriveDeletionBatch'

export default class DriveDeletionItem extends BaseModel {
  public static table = 'drive_deletion_items'

  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'batch_id' })
  public batchId: number

  @column({ columnName: 'companies_id' })
  public companiesId: number

  @column({ columnName: 'typebooks_id' })
  public typebooksId: number

  @column({ columnName: 'bookrecords_id' })
  public bookrecordsId: number

  @column()
  public seq: number

  @column({ columnName: 'drive_file_id' })
  public driveFileId: string | null

  @column({ columnName: 'file_name' })
  public fileName: string | null

  @column()
  public status: string

  @column()
  public attempts: number

  @column({ columnName: 'last_error' })
  public lastError: string | null

  @column.dateTime({ columnName: 'processed_at' })
  public processedAt: DateTime | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  public updatedAt: DateTime

  @belongsTo(() => DriveDeletionBatch, { foreignKey: 'batchId' })
  public batch: BelongsTo<typeof DriveDeletionBatch>
}
