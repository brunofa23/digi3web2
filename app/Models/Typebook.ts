import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo, HasMany, hasMany } from '@ioc:Adonis/Lucid/Orm'

import Book from './Book'
import Bookrecord from './Bookrecord'

export default class Typebook extends BaseModel {
  public static get fillable() {
    return ['id', 'name', 'status', 'path', 'books_id','createdAt', 'updatedAt']
  }

  @hasMany(()=>Bookrecord, {
    foreignKey: 'typebooks_id',
    localKey:'id'
  })
  public bookrecords: HasMany<typeof Bookrecord>



  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @column()
  public status: Boolean

  @column()
  public path: string

  @column()
  public books_id: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime


/**
 * Relatioship
 */
//  @belongsTo(() => Book, {
//   foreignKey: 'books_id'
// })
// public books: BelongsTo<typeof Book>



}
