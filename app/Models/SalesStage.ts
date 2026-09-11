import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import SalesOpportunity from './SalesOpportunity'

export default class SalesStage extends BaseModel {
  public static table = 'sales_stages'
  public static fillable = ['name', 'position', 'color', 'is_final', 'final_result', 'active']

  @hasMany(() => SalesOpportunity, { foreignKey: 'sales_stage_id' })
  public opportunities: HasMany<typeof SalesOpportunity>

  @column({ isPrimary: true }) public id: number
  @column() public name: string
  @column() public position: number
  @column() public color: string
  @column() public is_final: boolean
  @column() public final_result: 'won' | 'lost' | null
  @column() public active: boolean
  @column.dateTime({ autoCreate: true }) public createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true }) public updatedAt: DateTime
}
