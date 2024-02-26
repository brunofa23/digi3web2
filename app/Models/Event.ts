import { DateTime } from 'luxon'
import { BaseModel, column, hasOne, HasOne } from '@ioc:Adonis/Lucid/Orm'
import Company from "./Company"
import User from './User'
import Eventtype from './Eventtype'
export default class Event extends BaseModel {

  public static get fillable() {
    return [
      'id',
      'companies_id',
      'user_id',
      'eventtype_id',
      'delivery_date',
      'description',
      'response',
    ]
  }

  @hasOne(() => Company, {
    foreignKey: 'id',
    localKey: 'companies_id'
  })
  public company: HasOne<typeof Company>


  @hasOne(() => User, {
    foreignKey: 'id',
    localKey: 'user_id'
  })
  public user: HasOne<typeof User>

  @hasOne(() => Eventtype, {
    foreignKey: 'id',
    localKey: 'eventtype_id'
  })
  public eventtype: HasOne<typeof Eventtype>


  @column({ isPrimary: true })
  public id: number

  @column()
  public companies_id: number

  @column()
  public user_id: number

  @column()
  public eventtype_id: number

  @column()
  public delivery_date: DateTime

  @column()
  public description: string

  @column()
  public response: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
