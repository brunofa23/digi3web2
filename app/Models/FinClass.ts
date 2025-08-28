import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class FinClass extends BaseModel {

  public static get fillable() {
    return [
      'id',
      'companies_id',
      'fin_emp_id',
      'description',
      'excluded',
      'inactive',
      'debit_credit',
      'cost',
      'allocation',
      'limit_amount',
    ]
  }


  @column({ isPrimary: true })
  public id: number

  @column()
  public companies_id: number

  @column()
  public fin_emp_id: number

  @column()
  public description: string

  @column()
  public excluded: boolean

  @column()
  public inactive:boolean

  @column()
  public debit_credit: string

  @column()
  public cost: string
  @column()
  public allocation: string
  @column()
  public limit_amount: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
