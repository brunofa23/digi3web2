import { DateTime } from 'luxon'
import {
  afterSave,
  BaseModel,
  column,
  HasMany,
  hasMany,
  hasOne,
  HasOne,
} from '@ioc:Adonis/Lucid/Orm'

import Indeximage from './Indeximage'
import Book from './Book'
import Company from './Company'
import Bookrecord from './Bookrecord'

export default class Typebook extends BaseModel {
  public static get fillable() {
    return [
      'id',
      'name',
      'status',
      'path',
      'books_id',
      'companies_id',
      'createdAt',
      'updatedAt',
    ]
  }

  @hasMany(() => Bookrecord, {
    foreignKey: 'typebooks_id',
    localKey: 'id'
  })
  public bookrecords: HasMany<typeof Bookrecord>

  @hasMany(() => Indeximage, {
    foreignKey: 'typebooks_id',
    localKey: 'id'
  })
  public typebooks: HasMany<typeof Indeximage>

  @hasOne(() => Book,{
    foreignKey: 'id',
    localKey: 'books_id'
  })
  public book: HasOne<typeof Book>

  @hasOne(() => Company,{
    foreignKey: 'id',
    localKey: 'companies_id'
  })
  public company: HasOne<typeof Company>


  @column({ isPrimary: true })
  public id: number

  @column()
  public companies_id: number

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

  @afterSave()
  public static async afterSaveHook(typebook: Typebook) {
    const book = await Book.find(typebook.books_id)
    typebook.path = `Client_${typebook.companies_id}.Book_${typebook.id}.${book?.namefolder}`
    await typebook.save()

  }




  /**
   * Relatioship
   */
  //  @belongsTo(() => Book, {
  //   foreignKey: 'books_id'
  // })
  // public books: BelongsTo<typeof Book>
}
