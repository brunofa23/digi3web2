import { DateTime } from 'luxon'
import { BaseModel, column, HasMany, hasMany } from '@ioc:Adonis/Lucid/Orm'

import Typebook from './Typebook'

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


  @hasMany(()=>Typebook)
  public typebooks: HasMany<typeof Typebook>

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
