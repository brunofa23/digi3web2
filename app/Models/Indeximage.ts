import { DateTime } from 'luxon'
import { BaseModel, column, HasOne, hasOne } from '@ioc:Adonis/Lucid/Orm'
import Bookrecord from './Bookrecord'

export default class Indeximage extends BaseModel {

  public static get fillable() {
    return [
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

  @hasOne(() => Bookrecord,{
    foreignKey: 'id',
    localKey: 'bookrecords_id'
  })
  public bookrecord: HasOne<typeof Bookrecord>


  @column({isPrimary:true})
  public bookrecords_id: number

  @column({isPrimary:true})
  public typebooks_id:number

  @column({isPrimary:true})
  public seq:number

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
