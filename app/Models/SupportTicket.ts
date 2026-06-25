import { DateTime } from 'luxon'
import {
  BaseModel,
  BelongsTo,
  belongsTo,
  column,
} from '@ioc:Adonis/Lucid/Orm'
import Company from './Company'
import User from './User'

export default class SupportTicket extends BaseModel {
  public static table = 'support_tickets'

  @column({ isPrimary: true })
  public id: number

  @column()
  public companiesId: number

  @column()
  public usersId: number

  @column()
  public assignedUsersId: number | null

  @column()
  public requestType: string

  @column()
  public contact: string | null

  @column()
  public status: string

  @column()
  public pendingResponseFrom: string | null

  @column()
  public lastInteractionBy: string | null

  @column.dateTime()
  public lastInteractionAt: DateTime | null

  @column()
  public description: string

  @column()
  public history: string | null

  @column()
  public privateNotes: string | null

  @column.dateTime()
  public openedAt: DateTime

  @column.dateTime()
  public resolvedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Company, {
    foreignKey: 'companiesId',
  })
  public company: BelongsTo<typeof Company>

  @belongsTo(() => User, {
    foreignKey: 'usersId',
  })
  public user: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'assignedUsersId',
  })
  public assignedUser: BelongsTo<typeof User>
}
