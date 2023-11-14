import { DateTime } from 'luxon'
import {
  BaseModel, column, HasOne, hasOne
  , belongsTo, BelongsTo
} from '@ioc:Adonis/Lucid/Orm'
import Bookrecord from './Bookrecord'
import Typebook from './Typebook'
import Company from './Company'

export default class Indeximage extends BaseModel {

  public static get fillable() {
    return [
      'bookrecords_id',
      'typebooks_id',
      'companies_id',
      'seq',
      'ext',
      'file_name',
      'previous_file_name',
      'created_at',
      'updated_at'
    ]
  }

  // @belongsTo(() => Bookrecord, {
  //   foreignKey: 'id',
  //   localKey: 'bookrecords_id'
  // })
  // public bookrecord: BelongsTo<typeof Bookrecord>


  // @belongsTo(() => Typebook, {
  //   foreignKey: 'typebooks_id',
  //   localKey: 'id'
  // })
  // public typebooks: BelongsTo<typeof Typebook>

  // @belongsTo(() => Bookrecord, {
  //   foreignKey: 'bookrecords_id',
  //   localKey: 'id'
  // })
  // public bookrecord: BelongsTo<typeof Bookrecord>

  // @belongsTo(() => Company, {
  //   foreignKey: 'companies_id',
  //   localKey: 'id'
  // })
  // public company: BelongsTo<typeof Company>


  @hasOne(() => Bookrecord, {
    foreignKey: 'bookrecords_id',
    localKey: 'id'
  })
  public bookrecord: HasOne<typeof Bookrecord>

  @hasOne(() => Typebook, {
    foreignKey: 'typebooks_id',
    localKey: 'typebooks_id'
  })
  public typebooks: HasOne<typeof Typebook>

  @hasOne(() => Company, {
    foreignKey: 'companies_id',
    localKey: 'id'
  })
  public company: HasOne<typeof Company>




  @column({ isPrimary: true })
  public bookrecords_id: number

  @column({ isPrimary: true })
  public typebooks_id: number

  @column({ isPrimary: true })
  public companies_id: number

  @column({ isPrimary: true })
  public seq: number

  @column()
  public ext: string

  @column()
  public file_name: string

  @column()
  public previous_file_name: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
