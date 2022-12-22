import { DateTime } from 'luxon'
import { BaseModel, column, HasMany, hasMany, HasOne, hasOne } from '@ioc:Adonis/Lucid/Orm'
import Indeximage from './Indeximage'
import Typebook from './Typebook'

export default class Bookrecord extends BaseModel {
  public static get fillable() {
    return [
      'id',
      'typebooks_id',
      'books_id',
      'cod',
      'book',
      'sheet',
      'side',
      'approximate_term',
      'index',
      'obs',
      'letter',
      'year',
      'model',
      'createdAt',
      'updatedAt',
    ]
  }

  @hasMany(() => Indeximage, {
    foreignKey: 'bookrecords_id',
    localKey: 'id'
  })
  public bookrecords: HasMany<typeof Indeximage>

  @hasMany(() => Indeximage, {
    foreignKey: 'bookrecords_id',
    localKey: 'id'
  })
  public indeximage: HasMany<typeof Indeximage>


  @hasOne(() => Typebook,{
    foreignKey: 'id',
    localKey: 'typebooks_id'
  })
  public typebooks: HasOne<typeof Typebook>


  @column({ isPrimary: true })
  public id: number

  @column()
  public typebooks_id: number

  @column()
  public books_id: number

  @column()
  public cod: number

  @column()
  public book: number

  @column()
  public sheet: number

  @column()
  public side: string

  @column()
  public approximate_term: string

  @column()
  public index: number

  @column()
  public obs: string

  //letra
  @column()
  public letter: string

  @column()
  public year: number

  @column()
  public model: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
