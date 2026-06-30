import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class FinEntityDocumentEmail extends BaseModel {
  public static table = 'fin_entity_document_emails'

  public static get fillable() {
    return [
      'id',
      'companies_id',
      'fin_entity_id',
      'email',
      'subject',
      'body',
      'file_name',
      'file_size',
      'status',
      'error_message',
      'sent_at',
    ]
  }

  @column({ isPrimary: true })
  public id: number

  @column()
  public companies_id: number

  @column()
  public fin_entity_id: number

  @column()
  public email: string

  @column()
  public subject: string

  @column()
  public body: string

  @column()
  public file_name: string

  @column()
  public file_size: number

  @column()
  public status: string

  @column()
  public error_message: string

  @column.dateTime()
  public sent_at: DateTime

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
