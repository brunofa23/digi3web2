import { DateTime } from 'luxon'
import { BaseModel, column, HasMany, hasMany } from '@ioc:Adonis/Lucid/Orm'
import DriveDeletionItem from './DriveDeletionItem'

export default class DriveDeletionBatch extends BaseModel {
  public static table = 'drive_deletion_batches'

  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'companies_id' })
  public companiesId: number

  @column({ columnName: 'typebooks_id' })
  public typebooksId: number

  @column({ columnName: 'user_id' })
  public userId: number | null

  @column()
  public action: string

  @column()
  public status: string

  @column()
  public book: number

  @column({ columnName: 'start_cod' })
  public startCod: number

  @column({ columnName: 'end_cod' })
  public endCod: number

  @column({ columnName: 'total_items' })
  public totalItems: number

  @column({ columnName: 'processed_items' })
  public processedItems: number

  @column({ columnName: 'failed_items' })
  public failedItems: number

  @column({ columnName: 'last_error' })
  public lastError: string | null

  @column.dateTime({ columnName: 'started_at' })
  public startedAt: DateTime | null

  @column.dateTime({ columnName: 'finished_at' })
  public finishedAt: DateTime | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  public updatedAt: DateTime

  @hasMany(() => DriveDeletionItem, { foreignKey: 'batchId' })
  public items: HasMany<typeof DriveDeletionItem>
}
