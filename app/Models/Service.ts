// app/Models/Service.ts
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
import Emolument from 'App/Models/Emolument'

export default class Service extends BaseModel {
  public static table = 'services'

  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'companies_id' })
  public companiesId: number

  @column()
  public name: string

  @column()
  public description?: string | null

  @column()
  public free:boolean

  @column()
  public inactive: boolean

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  public updatedAt: DateTime

  @belongsTo(() => Company, { foreignKey: 'companiesId' })
  public company: BelongsTo<typeof Company>

  @manyToMany(() => Emolument, {
    pivotTable: 'emolument_service',
    pivotForeignKey: 'service_id',
    pivotRelatedForeignKey: 'emolument_id',
    pivotColumns: ['companies_id'],
    pivotTimestamps: true,
  })
  public emoluments: ManyToMany<typeof Emolument>
}
