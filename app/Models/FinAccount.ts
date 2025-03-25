import { DateTime } from 'luxon'
import { BaseModel, column, HasOne, hasOne } from '@ioc:Adonis/Lucid/Orm'
import FinClass from './FinClass'

export default class FinAccount extends BaseModel {

  public static get fillable() {
    return [
      'id',
      'companies_id',
      'fin_emp_id',
      'fin_class_id',
      'description',
      'amount',
      'data_billing',
      'excluded',
      'debit_credit'
    ]
  }

  @hasOne(() => FinClass, {
      foreignKey: 'id',
      localKey: 'fin_class_id'
    })
  public finclass: HasOne<typeof FinClass>

  @column({ isPrimary: true })
  public id: number

  @column()
  public companies_id: number

  @column()
  public fin_emp_id: number

  @column()
  public fin_class_id: number

  @column()
  public description: string

  @column()
  public amount: number

  @column.dateTime()
  public data_billing: DateTime

  @column()
  public excluded: boolean

  @column()
  public debit_credit:string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
