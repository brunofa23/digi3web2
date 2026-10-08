import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import AverbationDescription from './AverbationDescription'
import DocumentTypeBook from './DocumentTypeBook'

export default class OrderCertificateAverbation extends BaseModel {
  public static table = 'order_certificate_averbations'

  @column({ isPrimary: true }) public id: number
  @column() public companiesId: number
  @column() public orderCertificateId: number
  @column() public bookNumber: number
  @column() public sheetNumber: number
  @column() public termNumber: number
  @column() public averbationDescriptionId: number
  @column() public documentTypeBookId: number

  @belongsTo(() => AverbationDescription, { foreignKey: 'averbationDescriptionId' })
  public averbationDescription: BelongsTo<typeof AverbationDescription>

  @belongsTo(() => DocumentTypeBook, { foreignKey: 'documentTypeBookId' })
  public documentTypeBook: BelongsTo<typeof DocumentTypeBook>

  @column.dateTime({ autoCreate: true }) public createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true }) public updatedAt: DateTime
}
