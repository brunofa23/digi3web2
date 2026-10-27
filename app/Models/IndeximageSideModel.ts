import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'
import type { BookSideVisualModel } from 'App/Services/ocr/bookSideVisualModel'

export type SideTrainingSample = {
  label_id: number
  bookrecords_id: number
  seq: number
  sheet: number
  label: string
  drive_file_id: string
  file_name: string
}

const jsonColumn = {
  prepare: (value: any) => value === null ? null : JSON.stringify(value),
  consume: (value: any) => typeof value === 'string' ? JSON.parse(value) : value,
}

export default class IndeximageSideModel extends BaseModel {
  public static table = 'indeximage_side_models'

  @column({ isPrimary: true }) public id: number
  @column() public companies_id: number
  @column() public typebooks_id: number
  @column() public book: number
  @column() public version: string
  @column() public status: string
  @column() public phase: string
  @column() public processed: number
  @column() public total: number
  @column(jsonColumn) public training_samples: SideTrainingSample[]
  @column(jsonColumn) public validation_label_ids: number[]
  @column({ ...jsonColumn, serializeAs: null }) public model_data: BookSideVisualModel | null
  @column() public requested_by: number
  @column() public active_slot: number | null
  @column() public error_message: string | null
  @column({ serializeAs: null }) public lease_token: string | null
  @column.dateTime({ serializeAs: null }) public lease_expires_at: DateTime | null
  @column.dateTime() public started_at: DateTime | null
  @column.dateTime() public finished_at: DateTime | null
  @column.dateTime({ autoCreate: true }) public createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true }) public updatedAt: DateTime
}
