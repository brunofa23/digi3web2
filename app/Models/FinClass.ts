import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class FinClass extends BaseModel {

  public static get fillable() {
    return [
      'id',
      'companies_id',
      'description',
      'excluded',
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
  public description: string

  @column()
  public excluded: boolean

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
