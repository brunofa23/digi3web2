import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Entity extends BaseModel {
public static table = 'fin_entities'  // Define a tabela correta

  public static get fillable() {
    return [
      'id',
      'companies_id',
      'description',
      'responsible',
      'phone',
      'limit_amount',
      'obs',
      'inactive',
      'excluded',
    ]
  }



  @column({ isPrimary: true })
  public id: number
  @column()
  public companies_id:number
  @column()
  public description: string
  @column()
  public responsible: string
  @column()
  public phone: string
  @column()
  public limit_amount:number
  @column()
  public obs: string
  @column()
  public inactive:boolean
  @column()
  public excluded:boolean

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
