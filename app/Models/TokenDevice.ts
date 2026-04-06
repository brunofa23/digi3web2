// app/Models/TokenDevice.ts
import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class TokenDevice extends BaseModel {
  public static table = 'tokens_devices'

  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'company_id' })
  public companyId: number

  @column({ columnName: 'created_by_user_id' })
  public createdByUserId: number

  @column()
  public token: string

  @column.dateTime({ columnName: 'expires_at' })
  public expiresAt: DateTime

  @column.dateTime({ columnName: 'used_at' })
  public usedAt: DateTime | null

  @column()
  public active: boolean

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  public updatedAt: DateTime
}
