import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class IndeximageOcrEntity extends BaseModel {
  public static table = 'indeximage_ocr_entities'

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
  public entity_type: string

  @column()
  public value: string

  @column()
  public normalized_value: string

  @column()
  public confidence: number | null

  @column()
  public source: string | null

  @column()
  public evidence_text: string | null

  @column()
  public position_json: any

  @column()
  public review_status: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
