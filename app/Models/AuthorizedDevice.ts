// app/Models/AuthorizedDevice.ts
import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class AuthorizedDevice extends BaseModel {
  public static table = 'authorized_devices'

  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'company_id' })
  public companyId: number

  @column({ columnName: 'user_id' })
  public userId: number | null

  @column({ columnName: 'device_name' })
  public deviceName: string

  @column({ columnName: 'device_identifier' })
  public deviceIdentifier: string

  @column()
  public active: boolean

  @column.dateTime({ columnName: 'last_used_at' })
  public lastUsedAt: DateTime | null

  @column.dateTime({ columnName: 'revoked_at' })
  public revokedAt: DateTime | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  public updatedAt: DateTime
}
