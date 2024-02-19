import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Event extends BaseModel {

  public static get fillable() {
    return [
      'id',
      'companies_id',
      'user_id',
      'eventtype_id',
      'delivery_date',
      'description',
      'response',
    ]
  }

  @column({ isPrimary: true })
  public id: number

  @column()
  public companies_id: number

  @column()
  public user_id: number

  @column()
  public eventtype_id: number

  @column()
  public delivery_date: DateTime

  @column()
  public description: string

  @column()
  public response: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
