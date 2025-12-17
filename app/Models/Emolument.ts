// app/Models/Emolument.ts
import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  belongsTo,
  BelongsTo,
  manyToMany,
  ManyToMany,
} from '@ioc:Adonis/Lucid/Orm'

import Company from 'App/Models/Company'
import Service from 'App/Models/Service'

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

  @column()
  public price: string | null

  @column()
  public code: string | null

  @column()
  public type: string

  @column()
  public inactive: boolean

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @manyToMany(() => Service, {
    pivotTable: 'emolument_service',
    pivotForeignKey: 'emolument_id',
    pivotRelatedForeignKey: 'service_id',
    pivotColumns: ['companies_id'],
    pivotTimestamps: true,
  })
  public services: ManyToMany<typeof Service>
}
