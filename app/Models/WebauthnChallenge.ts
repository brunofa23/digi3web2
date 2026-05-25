import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class WebauthnChallenge extends BaseModel {
  public static table = 'webauthn_challenges'

  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'company_id' })
  public companyId: number

  @column({ columnName: 'user_id' })
  public userId: number | null

  @column({ columnName: 'token_device_id' })
  public tokenDeviceId: number | null

  @column()
  public type: string

  @column()
  public challenge: string

  @column({ columnName: 'device_name' })
  public deviceName: string | null

  @column.dateTime({ columnName: 'expires_at' })
  public expiresAt: DateTime

  @column.dateTime({ columnName: 'used_at' })
  public usedAt: DateTime | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  public updatedAt: DateTime
}
