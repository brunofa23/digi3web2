import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  belongsTo,
  BelongsTo
} from '@ioc:Adonis/Lucid/Orm'
import Company from 'App/Models/Company'

export default class Occupation extends BaseModel {
  public static table = 'occupations'

  @column({ isPrimary: true })
  public id: number

  @column()
  public companiesId: number

  @column()
  public description: string

  @column()
  public inactive: boolean

  @belongsTo(() => Company, {
    foreignKey: 'companiesId',
  })
  public company: BelongsTo<typeof Company>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
