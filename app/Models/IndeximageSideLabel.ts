import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class IndeximageSideLabel extends BaseModel {
  public static table = 'indeximage_side_labels'

  @column({ isPrimary: true })
  public id: number

  @column()
  public companies_id: number

  @column()
  public typebooks_id: number

  @column()
  public bookrecords_id: number

  @column()
  public seq: number

  @column()
  public position: number

  @column()
  public drive_file_id: string

  @column()
  public file_name: string

  @column()
  public label: string | null

  @column()
  public reviewed_by: number | null

  @column.dateTime()
  public reviewed_at: DateTime | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
