import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Documenttype extends BaseModel {

  public static get fillable() {
    return [
      'id',
      'name',
      'description',
      'status',
    ]
  }


  @column({ isPrimary: true })
  public id: number

  @column()
  public name:string

  @column()
  public descrition:string

  @column()
  public status:boolean

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
