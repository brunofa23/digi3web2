import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import AverbationDescription from './AverbationDescription'
import DocumentTypeBook from './DocumentTypeBook'

export default class OrderCertificateAverbation extends BaseModel {
  public static table = 'order_certificate_averbations'

  @column({ isPrimary: true }) public id: number
  @column() public companiesId: number
  @column() public orderCertificateId: number
  @column() public bookNumber: number | null
  @column() public sheetNumber: number | null
  @column() public termNumber: number | null
  @column() public averbationDescriptionId: number | null
  @column() public documentTypeBookId: number | null
  @column({ columnName: 'label_text' }) public labelText: string | null

  @belongsTo(() => AverbationDescription, { foreignKey: 'averbationDescriptionId' })
  public averbationDescription: BelongsTo<typeof AverbationDescription>

  @belongsTo(() => DocumentTypeBook, { foreignKey: 'documentTypeBookId' })
  public documentTypeBook: BelongsTo<typeof DocumentTypeBook>

  @column.dateTime({ autoCreate: true }) public createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true }) public updatedAt: DateTime
}
