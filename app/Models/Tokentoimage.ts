import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Tokentoimage extends BaseModel {

  public static get fillable() {
    return [
      'id',
      'companies_id',
      'token',
      'users_id',
      'expires_at'
    ]
  }


  @column({ isPrimary: true })
  public id: number

  @column()
  public companies_id:number

  @column()
  public token:string

  @column()
  public users_id:number


  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public expires_at: DateTime
}
