import { DateTime } from 'luxon'
import {
  BaseModel,
  BelongsTo,
  belongsTo,
  column,
} from '@ioc:Adonis/Lucid/Orm'
import BackupRun from './BackupRun'

function parseJson(value: any) {
  if (!value) return null
  if (typeof value === 'string') return JSON.parse(value)
  return value
}

export default class BackupCompanyStatus extends BaseModel {
  public static table = 'backup_company_statuses'

  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'backup_run_id' })
  public backupRunId: number

  @column({ columnName: 'companies_id' })
  public companiesId: number

  @column({ columnName: 'company_name' })
  public companyName: string | null

  @column()
  public status: string

  @column.dateTime({ columnName: 'started_at' })
  public startedAt: DateTime | null

  @column.dateTime({ columnName: 'finished_at' })
  public finishedAt: DateTime | null

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

  @belongsTo(() => BackupRun, {
    foreignKey: 'backupRunId',
  })
  public backupRun: BelongsTo<typeof BackupRun>
}
