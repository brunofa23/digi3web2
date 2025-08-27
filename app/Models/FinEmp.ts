import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class FinEmp extends BaseModel {

  public static get fillable() {
    return [
      'id',
      'companies_id',
      'name',
      'excluded',
      'inactive'
    ]
  }


  @column({ isPrimary: true })
  public id: number

  @column()
  public companies_id: number

  @column()
  public name: string

  @column()
  public excluded: boolean

  @column()
  public inactive:boolean

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
