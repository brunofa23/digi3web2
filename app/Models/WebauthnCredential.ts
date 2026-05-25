import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class WebauthnCredential extends BaseModel {
  public static table = 'webauthn_credentials'

  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'authorized_device_id' })
  public authorizedDeviceId: number

  @column({ columnName: 'company_id' })
  public companyId: number

  @column({ columnName: 'user_id' })
  public userId: number | null

  @column({ columnName: 'credential_id' })
  public credentialId: string

  @column({ columnName: 'public_key' })
  public publicKey: string

  @column()
  public counter: number

  @column()
  public transports: string | null

  @column({ columnName: 'device_type' })
  public deviceType: string | null

  @column({ columnName: 'backed_up' })
  public backedUp: boolean

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  public updatedAt: DateTime
}
