import { DateTime } from 'luxon'
import { BaseModel, column, HasMany, hasMany } from '@ioc:Adonis/Lucid/Orm'

import Typebook from './Typebook'
import Bookrecord from './Bookrecord'

export default class Book extends BaseModel {

  public static get fillable(){
    return[
      'id',
      'name',
      'status',
      'createdAt',
      'updatedAt'
    ]
  }


  @hasMany(()=>Typebook, {
    foreignKey: 'books_id',
    localKey:'id'
  })
  public typebooks: HasMany<typeof Typebook>

  @hasMany(()=>Bookrecord, {
    foreignKey: 'books_id',
    localKey:'id'
  })
  public bookrecords: HasMany<typeof Bookrecord>



  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @column()
  public status: Boolean

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
