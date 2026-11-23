import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'

export default class SupportTicketSetting extends BaseModel {
  public static table = 'support_ticket_settings'

  @column({ isPrimary: true })
  public id: number

  @column()
  public supportEmails: string | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
