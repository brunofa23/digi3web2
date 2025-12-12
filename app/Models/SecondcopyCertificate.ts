// app/Models/SecondcopyCertificate.ts
import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  belongsTo,
  BelongsTo,
} from '@ioc:Adonis/Lucid/Orm'

import Company from 'App/Models/Company'
import Documenttype from 'App/Models/Documenttype'
import Person from 'App/Models/Person'

export default class SecondcopyCertificate extends BaseModel {
  public static table = 'secondcopy_certificates'

  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'companies_id' })
  public companiesId: number

  @column({ columnName: 'documenttype_id' })
  public documenttypeId: number | null

  @column()
  public paymentMethod: string | null

  @column()
  public applicant: number | null

  @column()
  public registered1: number | null

  @column()
  public book1: number | null

  @column()
  public sheet1: number | null

  @column()
  public city1: string | null

  @column()
  public registered2: number | null

  @column()
  public book2: number | null

  @column()
  public sheet2: number | null

  @column()
  public city2: string | null

  // -----------------------
  // Relationships
  // -----------------------

  @belongsTo(() => Company, { foreignKey: 'companiesId' })
  public company: BelongsTo<typeof Company>

  @belongsTo(() => Documenttype, { foreignKey: 'documenttypeId' })
  public documenttype: BelongsTo<typeof Documenttype>

  @belongsTo(() => Person, { foreignKey: 'applicant' })
  public applicantPerson: BelongsTo<typeof Person>

  @belongsTo(() => Person, { foreignKey: 'registered1' })
  public registered1Person: BelongsTo<typeof Person>

  @belongsTo(() => Person, { foreignKey: 'registered2' })
  public registered2Person: BelongsTo<typeof Person>

  // -----------------------
  // Timestamps
  // -----------------------

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  public updatedAt: DateTime
}
