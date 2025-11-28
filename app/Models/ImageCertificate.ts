// start file: app/Models/ImageCertificate.ts
import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  belongsTo,
  BelongsTo,
} from '@ioc:Adonis/Lucid/Orm'

import Company from 'App/Models/Company'
import Book from 'App/Models/Book'
import MarriedCertificate from 'App/Models/MarriedCertificate'

export default class ImageCertificate extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'companies_id' })
  public companiesId: number

  @column({ columnName: 'book_id' })
  public bookId: number

  @column({ columnName: 'married_certificate_id' })
  public marriedCertificateId: number | null

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

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  // 🔹 Relações

  @belongsTo(() => Company, {
    foreignKey: 'companiesId',
  })
  public company: BelongsTo<typeof Company>

  @belongsTo(() => Book, {
    foreignKey: 'bookId',
  })
  public book: BelongsTo<typeof Book>

  @belongsTo(() => MarriedCertificate, {
    foreignKey: 'marriedCertificateId',
  })
  public marriedCertificate: BelongsTo<typeof MarriedCertificate>
}
