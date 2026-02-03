// app/Models/Stamp.ts
import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import Company from 'App/Models/Company'

export default class Stamp extends BaseModel {
  public static table = 'stamps'

  @column({ isPrimary: true })
  public id: number

  @column()
  public companies_id: number

  @column()
  public serial: string

  @column()
  public start: number

  @column()
  public end?: number | null

  @column()
  public current?: number | null

  @column()
  public finished: boolean

  @column()
  public inactive: boolean

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  public updatedAt: DateTime

  @belongsTo(() => Company, {
    foreignKey: 'companies_id',
  })
  public company: BelongsTo<typeof Company>
}
