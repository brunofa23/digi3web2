import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class FinImage extends BaseModel {

  public static get fillable() {
    return [
      'id',
      'companies_id',
      'fin_account_id',
      'seq',
      'ext',
      'file_name',
      'path'

    ]
  }

  @column({ isPrimary: true })
  public id: number

  @column()
  public companies_id: number

  @column()
  public fin_account_id: number

  @column()
  public seq: number

  @column()
  public ext: string

  @column()
  public file_name: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
