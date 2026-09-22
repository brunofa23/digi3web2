import { DateTime } from 'luxon'
import { BaseModel, belongsTo, BelongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import SalesOpportunity from './SalesOpportunity'
import User from './User'

export default class SalesOpportunityActivity extends BaseModel {
  public static table = 'sales_opportunity_activities'
  public static fillable = ['sales_opportunity_id', 'type', 'description', 'activity_date', 'user_id']

  @column({ isPrimary: true }) public id: number
  @column() public sales_opportunity_id: number
  @column() public type: string
  @column() public description: string
  @column.dateTime() public activity_date: DateTime
  @column() public user_id: number | null

  @belongsTo(() => SalesOpportunity, { foreignKey: 'sales_opportunity_id' }) public opportunity: BelongsTo<typeof SalesOpportunity>
  @belongsTo(() => User, { foreignKey: 'user_id' }) public user: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true }) public createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true }) public updatedAt: DateTime
}
