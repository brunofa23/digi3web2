import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Indeximage extends BaseModel {

  public static get fillable() {
    return [
      'id',
      'bookrecords_id',
      'typebooks_id',
      'seq',
      'ext',
      'file_name',
      'previous_file_name',
      'created_at',
      'updated_at'
    ]
  }


  @column({ isPrimary: true })
  public id: number

  @column()
  public bookrecords_id: number

  @column()
  public typebooks_id:number

  @column()
  public seq:string

  @column()
  public ext:string

  @column()
  public file_name:string

  @column()
  public previous_file_name:string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
