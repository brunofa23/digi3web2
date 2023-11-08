import { DateTime } from 'luxon'
import { BaseModel, column, HasMany, hasMany, HasOne, hasOne, afterUpdate } from '@ioc:Adonis/Lucid/Orm'
import Indeximage from './Indeximage'
import Typebook from './Typebook'
import Company from './Company'
const fileRename = require('../Services/fileRename/fileRename')

export default class Bookrecord extends BaseModel {
  public static get fillable() {
    return [
      'id',
      'typebooks_id',
      'books_id',
      'companies_id',
      'cod',
      'book',
      'sheet',
      'side',
      'approximate_term',
      'indexbook',
      'obs',
      'letter',
      'year',
      'model',
      'userid',
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

  @hasOne(() => Typebook, {
    foreignKey: 'id',
    localKey: 'typebooks_id'
  })
  public typebooks: HasOne<typeof Typebook>

  @hasOne(() => Company, {
    foreignKey: 'id',
    localKey: 'companies_id'
  })
  public companies: HasOne<typeof Company>


  @column({ isPrimary: true })
  public id: number

  @column()
  public typebooks_id: number

  @column()
  public companies_id: number

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
  public indexbook: number

  @column()
  public obs: string

  //letra
  @column()
  public letter: string

  @column()
  public year: string

  @column()
  public model: string

  @column()
  public userid: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @afterUpdate()
  public static async verifyUpdate(bookRecord: Bookrecord) {
    const fileName = fileRename.mountNameFile(bookRecord, 1, '.jpg')

    console.log("EXECUTEI UPDATE...", fileName)
    // if (bookR.$dirty.password) {
    //   user.password = await Hash.make(user.password)
    // }
  }

}
