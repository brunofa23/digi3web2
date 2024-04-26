import { DateTime, string } from 'luxon'
import { BaseModel, HasOne, column, hasOne } from '@ioc:Adonis/Lucid/Orm'
import Document from './Document'

export default class DocumentConfig extends BaseModel {

  public static get fillable() {
    return [
      'cod',
      'typebooks_id',
      'companies_id',
      'box2',
      'prot',
      'month',
      'yeardoc',
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
      'datefield13'

    ]
  }

  @column({ isPrimary: true })
  public id: number

  @column()
  public typebooks_id: number

  @column()
  public companies_id: number

  @column()
  public prot: string

  @column()
  public box2: string

  @column()
  public month: string

  @column()
  public yeardoc: string

  @column()
  public intfield1: string
  @column()
  public stringfield1: string
  @column()
  public datefield1: string

  @column()
  public intfield2: string
  @column()
  public stringfield2: string
  @column()
  public datefield2: string

  @column()
  public intfield3: string
  @column()
  public stringfield3: string
  @column()
  public datefield3: string

  @column()
  public intfield4: string
  @column()
  public stringfield4: string
  @column()
  public datefield4: string

  @column()
  public intfield5: string
  @column()
  public stringfield5: string
  @column()
  public datefield5: string

  @column()
  public intfield6: string
  @column()
  public stringfield6: string
  @column()
  public datefield6: string

  @column()
  public intfield7: string
  @column()
  public stringfield7: string
  @column()
  public datefield7: string

  @column()
  public intfield8: string
  @column()
  public stringfield8: string
  @column()
  public datefield8: string

  @column()
  public intfield9: string
  @column()
  public stringfield9: string
  @column()
  public datefield9: string

  @column()
  public intfield10: string
  @column()
  public stringfield10: string
  @column()
  public datefield10: string

  @column()
  public intfield11: string
  @column()
  public stringfield11: string
  @column()
  public datefield11: string

  @column()
  public intfield12: string
  @column()
  public stringfield12: string
  @column()
  public datefield12: string

  @column()
  public intfield13: string
  @column()
  public stringfield13: string
  @column()
  public datefield13: string

  //******************************* */
  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  //***************************************************** */

  @hasOne(() => Document)
  public document: HasOne<typeof Document>

}
