import { DateTime } from 'luxon'
import { BaseModel, column, HasMany, hasMany, HasOne, hasOne } from '@ioc:Adonis/Lucid/Orm'
import Bookrecord from './Bookrecord'
import Documenttype from './Documenttype'

export default class Document extends BaseModel {

  public static get fillable() {
    return [
      'id',
      'bookrecords_id',
      'typebooks_id',
      'books_id',
      'companies_id',
      'box2',
      'prot',
      'month',
      'yeardoc',
      'documenttype_id',
      'free',
      'averb_anot',
      'book_name',
      'book_number',
      'sheet_number',
      'intfield1',
      'stringfield1',
      'datefield1',
      'intfield2',
      'stringfield2',
      'datefield2',
      'intfield3',
      'stringfield3',
      'datefield3',
      'intfield4',
      'stringfield4',
      'datefield4',
      'intfield5',
      'stringfield5',
      'datefield5',
      'intfield6',
      'stringfield6',
      'datefield6',
      'intfield7',
      'stringfield7',
      'datefield7',
      'intfield8',
      'stringfield8',
      'datefield8',
      'intfield9',
      'stringfield9',
      'datefield9',
      'intfield10',
      'stringfield10',
      'datefield10',
      'intfield11',
      'stringfield11',
      'datefield11',
      'intfield12',
      'stringfield12',
      'datefield12',
      'intfield13',
      'stringfield13',
      'datefield13',


    ]
  }

  @hasOne(() => Bookrecord, {
    foreignKey: 'id',
    localKey: 'bookrecords_id'
  })
  public bookrecord: HasOne<typeof Bookrecord>

  @hasOne(() => Documenttype, {
    foreignKey: 'id',
    localKey: 'documenttype_id'
  })
  public documenttype: HasOne<typeof Documenttype>



  @column({ isPrimary: true })
  public id: number
  @column()
  public bookrecords_id: number
  @column()
  public typebooks_id: number
  @column()
  public books_id: number
  @column()
  public companies_id: number
  @column()
  public box2: number
  @column()
  public month: number
  @column()
  public yeardoc: number
  @column()
  public documenttype_id: number
  @column()
  public free: boolean
  @column()
  public averb_anot: boolean
  @column()
  public book_name: string
  @column()
  public book_number: number
  @column()
  public sheet_number: number
  @column()
  public prot: number
  @column()
  public intfield1: number
  @column()
  public stringfield1: string
  @column.dateTime()
  public datefield1: DateTime
  @column()
  public intfield2: number
  @column()
  public stringfield2: string
  @column.dateTime()
  public datefield2: DateTime
  @column()
  public intfield3: number
  @column()
  public stringfield3: string
  @column.dateTime()
  public datefield3: DateTime
  @column()
  public intfield4: number
  @column()
  public stringfield4: string
  @column.dateTime()
  public datefield4: DateTime
  @column()
  public intfield5: number
  @column()
  public stringfield5: string
  @column.dateTime()
  public datefield5: DateTime
  @column()
  public intfield6: number
  @column()
  public stringfield6: string
  @column.dateTime()
  public datefield6: DateTime
  @column()
  public intfield7: number
  @column()
  public stringfield7: string
  @column.dateTime()
  public datefield7: DateTime
  @column()
  public intfield8: number
  @column()
  public stringfield8: string
  @column.dateTime()
  public datefield8: DateTime
  @column()
  public intfield9: number
  @column()
  public stringfield9: string
  @column.dateTime()
  public datefield9: DateTime
  @column()
  public intfield10: number
  @column()
  public stringfield10: string
  @column.dateTime()
  public datefield10: DateTime
  @column()
  public intfield11: number
  @column()
  public stringfield11: string
  @column.dateTime()
  public datefield11: DateTime
  @column()
  public intfield12: number
  @column()
  public stringfield12: string
  @column.dateTime()
  public datefield12: DateTime
  @column()
  public intfield13: number
  @column()
  public stringfield13: string
  @column.dateTime()
  public datefield13: DateTime


  //************************************************ */
  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime


  @hasMany(() => Indeximage, {
    foreignKey: 'documents_id',
    localKey: 'id'
  })
  public bookrecords: HasMany<typeof Indeximage>

  @hasMany(() => Indeximage, {
    foreignKey: 'documents_id',
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


}
