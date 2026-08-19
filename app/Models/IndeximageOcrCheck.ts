import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class IndeximageOcrCheck extends BaseModel {
  public static table = 'indeximage_ocr_checks'

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
  public layout_profile: string

  @column()
  public expected_sheet: number | null

  @column()
  public detected_sheet: number | null

  @column()
  public expected_term: string | null

  @column()
  public detected_term: string | null

  @column()
  public sheet_status: string

  @column()
  public term_status: string

  @column()
  public confidence: number | null

  @column()
  public confidence_level: string | null

  @column()
  public evidence_text: string | null

  @column()
  public source: string | null

  @column()
  public auto_applied: boolean

  @column()
  public review_status: string

  @column.dateTime()
  public processed_at: DateTime | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
