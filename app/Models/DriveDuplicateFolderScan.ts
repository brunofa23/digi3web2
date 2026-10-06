import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'

export default class DriveDuplicateFolderScan extends BaseModel {
  public static table = 'drive_duplicate_folder_scans'

  @column({ isPrimary: true })
  public id: number

  @column()
  public status: string

  @column({ columnName: 'run_token' })
  public runToken: string | null

  @column({ prepare: (value) => value == null ? null : JSON.stringify(value), consume: (value) => typeof value === 'string' ? JSON.parse(value) : value })
  public result: any

  @column({ columnName: 'error_message' })
  public errorMessage: string | null

  @column.dateTime({ columnName: 'started_at' })
  public startedAt: DateTime | null

  @column.dateTime({ columnName: 'finished_at' })
  public finishedAt: DateTime | null

  @column.dateTime({ columnName: 'heartbeat_at' })
  public heartbeatAt: DateTime | null
}
