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
//import BornCertificate from 'App/Models/BornCertificate'

export default class ImageCertificate extends BaseModel {
  public static table = 'image_certificates'

  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'companies_id' })
  public companiesId: number

  @column({ columnName: 'book_id' })
  public bookId: number

  @column({ columnName: 'married_certificate_id' })
  public marriedCertificateId: number | null

  // @column({ columnName: 'born_certificate_id' })
  // public bornCertificateId: number | null

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

  @belongsTo(() => Company, { foreignKey: 'companiesId' })
  public company: BelongsTo<typeof Company>

  @belongsTo(() => Book, { foreignKey: 'bookId' })
  public book: BelongsTo<typeof Book>

  @belongsTo(() => MarriedCertificate, {
    foreignKey: 'marriedCertificateId',
  })
  public marriedCertificate: BelongsTo<typeof MarriedCertificate>

  @belongsTo(() => BornCertificate, {
    foreignKey: 'bornCertificateId',
  })
  public bornCertificate: BelongsTo<typeof BornCertificate>

  // (Opcional) getter "genérico" só pra facilitar uso:
  public get certificate() {
    return (this as any).marriedCertificate ?? (this as any).bornCertificate ?? null
  }
}
