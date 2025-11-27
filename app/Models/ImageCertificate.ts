// app/Models/ImageCertificate.ts
import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  belongsTo,
  BelongsTo,
} from '@ioc:Adonis/Lucid/Orm'

import Company from 'App/Models/Company'
import Book from 'App/Models/Book'

export default class ImageCertificate extends BaseModel {
  public static table = 'image_certificates'

  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'companies_id' })
  public companiesId: number

  @column({ columnName: 'book_id' })
  public bookId: number

  @column({ columnName: 'certificate_id' })
  public certificateId: number

  @column()
  public seq: number

  @column()
  public ext: string | null

  @column({ columnName: 'file_name' })
  public fileName: string | null

  @column()
  public description: string | null

  @column()
  public path: string | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  public updatedAt: DateTime

  // Relationships
  @belongsTo(() => Company, { foreignKey: 'companiesId' })
  public company: BelongsTo<typeof Company>

  @belongsTo(() => Book, { foreignKey: 'bookId' })
  public book: BelongsTo<typeof Book>

  /**
   * certificateId:
   * - se você tiver uma tabela específica (ex.: married_certificates),
   *   dá pra criar belongsTo também. Aqui ficou somente o campo numérico,
   *   porque na migration não tem FK.
   */
}
