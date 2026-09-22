import { DateTime } from 'luxon'
import { BaseModel, belongsTo, BelongsTo, column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import Company from './Company'
import SalesStage from './SalesStage'
import SalesOpportunityActivity from './SalesOpportunityActivity'
import User from './User'

export default class SalesOpportunity extends BaseModel {
  public static table = 'sales_opportunities'
  public static fillable = ['companies_id', 'company_id', 'sales_stage_id', 'name', 'city', 'state', 'contact_name', 'phone', 'email', 'whatsapp', 'source', 'interest', 'notes', 'last_contact_date', 'next_contact_date', 'next_action', 'assigned_user_id', 'proposal_value']

  @belongsTo(() => Company, { foreignKey: 'company_id' }) public company: BelongsTo<typeof Company>
  @belongsTo(() => SalesStage, { foreignKey: 'sales_stage_id' }) public stage: BelongsTo<typeof SalesStage>
  @belongsTo(() => User, { foreignKey: 'assigned_user_id' }) public assignedUser: BelongsTo<typeof User>
  @hasMany(() => SalesOpportunityActivity, { foreignKey: 'sales_opportunity_id' }) public activities: HasMany<typeof SalesOpportunityActivity>

  @column({ isPrimary: true }) public id: number
  @column() public companies_id: number
  @column() public company_id: number | null
  @column() public sales_stage_id: number
  @column() public name: string
  @column() public city: string | null
  @column() public state: string | null
  @column() public contact_name: string | null
  @column() public phone: string | null
  @column() public email: string | null
  @column() public whatsapp: string | null
  @column() public source: string | null
  @column() public interest: string | null
  @column() public notes: string | null
  @column.date() public last_contact_date: DateTime | null
  @column.date() public next_contact_date: DateTime | null
  @column() public next_action: string | null
  @column() public assigned_user_id: number | null
  @column() public proposal_value: number | null
  @column.dateTime({ autoCreate: true }) public createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true }) public updatedAt: DateTime
}
