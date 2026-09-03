import { DateTime } from 'luxon'
import {
  BaseModel,
  HasMany,
  column,
  hasMany,
} from '@ioc:Adonis/Lucid/Orm'
import BackupCompanyStatus from './BackupCompanyStatus'

function parseJson(value: any) {
  if (!value) return null
  if (typeof value === 'string') return JSON.parse(value)
  return value
}

export default class BackupRun extends BaseModel {
  public static table = 'backup_runs'

  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'run_id' })
  public runId: string

  @column()
  public kind: string

  @column()
  public status: string

  @column({ columnName: 'expected_companies' })
  public expectedCompanies: number

  @column({ columnName: 'success_companies' })
  public successCompanies: number

  @column({ columnName: 'error_companies' })
  public errorCompanies: number

  @column({ columnName: 'pending_companies' })
  public pendingCompanies: number

  @column.dateTime({ columnName: 'started_at' })
  public startedAt: DateTime | null

  @column.dateTime({ columnName: 'finished_at' })
  public finishedAt: DateTime | null

  @column.dateTime({ columnName: 'last_heartbeat_at' })
  public lastHeartbeatAt: DateTime | null

  @column({ columnName: 'error_message' })
  public errorMessage: string | null

  @column({
    prepare: (value: any) => value === undefined ? null : JSON.stringify(value),
    consume: parseJson,
  })
  public metadata: any

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  public updatedAt: DateTime

  @hasMany(() => BackupCompanyStatus, {
    foreignKey: 'backupRunId',
  })
  public companies: HasMany<typeof BackupCompanyStatus>
}
