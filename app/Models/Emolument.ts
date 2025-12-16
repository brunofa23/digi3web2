// app/Models/Emolument.ts
import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Emolument extends BaseModel {
  public static table = 'emoluments'

  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @column()
  public description: string | null

  // decimal(10,2) normalmente vem como string em alguns drivers (ex: MySQL),
  // então deixo como string | null para evitar perda de precisão.
  @column()
  public price: string | null

  @column()
  public code: string | null

  @column()
  public type: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
