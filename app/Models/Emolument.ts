// app/Models/Emolument.ts
import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  belongsTo,
  BelongsTo,
} from '@ioc:Adonis/Lucid/Orm'

import Company from 'App/Models/Company'

export default class Emolument extends BaseModel {
  public static table = 'emoluments'

  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'companies_id' })
  public companiesId: number

  @belongsTo(() => Company, { foreignKey: 'companiesId' })
  public company: BelongsTo<typeof Company>

  @column()
  public name: string

  @column()
  public description: string | null

  // decimal(10,2) pode vir como string (ex: MySQL). Mantendo como string evita perda de precisão.
  @column()
  public price: string | null

  @column()
  public code: string | null

  @column()
  public type: string

  @column()
  public inactive:boolean

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
