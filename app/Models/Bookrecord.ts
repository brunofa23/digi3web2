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
    //console.log("PASSEI PELO AFTER UPDATE", bookRecord.companies_id)

    try {
      const _indexImage = await Indeximage.query()
        .preload('typebooks', (query) => {
          query.where('id', bookRecord.typebooks_id)
            .andWhere('companies_id', bookRecord.companies_id)
        })
        .where('indeximages.bookrecords_id', bookRecord.id)
        .andWhere('indeximages.typebooks_id', bookRecord.typebooks_id)
        .andWhere('indeximages.companies_id', bookRecord.companies_id)

      if (_indexImage.length > 0) {
        for (const data of _indexImage) {
          const oldFileName = data.file_name
          const newFileName = await fileRename.mountNameFile(bookRecord, data?.seq, data.file_name)
          //console.log("INDEX IMAGES 1288>>>", oldFileName, newFileName)
          await Indeximage.query()
            .where('bookrecords_id', '=', data.bookrecords_id)
            .andWhere('typebooks_id', '=', data.typebooks_id)
            .andWhere('companies_id', '=', data.companies_id)
            .andWhere('seq', '=', data.seq).update({ file_name: newFileName })
          //console.log("ARQUIVO RENOMEADO NO INDEXIMAGE 5666", newFileName)
          fileRename.renameFileGoogle(oldFileName, data.typebooks.path, newFileName)
        }
      }


    } catch (error) {

    }


  }

}
