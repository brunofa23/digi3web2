import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class FinPaymentMethod extends BaseModel {

  public static get fillable() {
    return [
      'id',
      'companies_id',
      'description',
      'excluded',]
  }

  @column({ isPrimary: true })
  public id: number

  @column()
  public companies_id:number

  @column()
  public description: string
  @column()
  public excluded: boolean

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
