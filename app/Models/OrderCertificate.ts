import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  belongsTo,
  BelongsTo,
  hasOne,
  HasOne,
} from '@ioc:Adonis/Lucid/Orm'

import Company from 'App/Models/Company'
import MarriedCertificate from './MarriedCertificate'
import SecondcopyCertificate from './SecondcopyCertificate'
import Book from './Book'
import Receipt from 'App/Models/Receipt'

export default class OrderCertificate extends BaseModel {
  public static table = 'order_certificates'

  @column({ isPrimary: true })
  public id: number

  @column()
  public companiesId: number

  @column()
  public typeCertificate: number

  @column()
  public origin: string

  @column({
    columnName: 'public_order_certificate_link_id',
    serializeAs: 'publicOrderCertificateLinkId',
  })
  public publicOrderCertificateLinkId: number | null

  @column({
    columnName: 'lgpd_consent_accepted',
    serializeAs: 'lgpdConsentAccepted',
  })
  public lgpdConsentAccepted: boolean

  @column.dateTime({
    columnName: 'lgpd_consent_accepted_at',
    serializeAs: 'lgpdConsentAcceptedAt',
  })
  public lgpdConsentAcceptedAt: DateTime | null

  @column({
    columnName: 'public_request_ip',
    serializeAs: 'publicRequestIp',
  })
  public publicRequestIp: string | null

  @column({
    columnName: 'public_request_user_agent',
    serializeAs: 'publicRequestUserAgent',
  })
  public publicRequestUserAgent: string | null

  @column()
  public certificateId: number

  @column()
  public bookId: number

  @belongsTo(() => Company, { foreignKey: 'companiesId' })
  public company: BelongsTo<typeof Company>

  @belongsTo(() => MarriedCertificate, { foreignKey: 'certificateId' })
  public marriedCertificate: BelongsTo<typeof MarriedCertificate>

  @belongsTo(() => Book, { foreignKey: 'bookId' })
  public book: BelongsTo<typeof Book>

  @belongsTo(() => SecondcopyCertificate, { foreignKey: 'certificateId' })
  public secondcopyCertificate: BelongsTo<typeof SecondcopyCertificate>

  // ✅ NOVO: 1 OrderCertificate tem 1 Receipt
  @hasOne(() => Receipt, { foreignKey: 'orderCertificateId' })
  public receipt: HasOne<typeof Receipt>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
