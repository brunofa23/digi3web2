import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  belongsTo,
  BelongsTo
} from '@ioc:Adonis/Lucid/Orm'

import Company from 'App/Models/Company'
import Occupation from 'App/Models/Occupation'

export default class Person extends BaseModel {
  public static table = 'people'

  @column({ isPrimary: true })
  public id: number

  @column({
    columnName: 'companies_id',
    serializeAs: 'companiesId',
  })
  public companiesId: number

  // === Dados pessoais ===
  @column()
  public name: string

  @column({
    columnName: 'name_married',
    serializeAs: 'nameMarried',
  })
  public nameMarried: string

  @column()
  public cpf: string

  @column()
  public gender: string

  @column()
  public deceased: boolean

  @column.date({
    columnName: 'date_birth',
    serializeAs: 'dateBirth',
  })
  public dateBirth: DateTime

  @column({
    columnName: 'marital_status',
    serializeAs: 'maritalStatus',
  })
  public maritalStatus: string

  @column({
    columnName: 'illiterate',
    serializeAs: 'illiterate',
  })
  public illiterate: boolean

  // === Naturalidade / Nacionalidade / Profissão ===
  @column({
    columnName: 'place_birth',
    serializeAs: 'placeBirth',
  })
  public placeBirth: string

  @column()
  public nationality: string

  @column({
    columnName: 'occupation_id',
    serializeAs: 'occupationId',
  })
  public occupationId: number | null

  // === Endereço ===
  @column({
    columnName: 'zip_code',
    serializeAs: 'zipCode',
  })
  public zipCode: string

  @column()
  public address: string

  @column({
    columnName: 'street_number',
    serializeAs: 'streetNumber',
  })
  public streetNumber: string

  @column({
    columnName: 'street_complement',
    serializeAs: 'streetComplement',
  })
  public streetComplement: string

  @column()
  public district: string

  @column()
  public city: string

  @column()
  public state: string

  // === Documento ===
  @column({
    columnName: 'document_type',
    serializeAs: 'documentType',
  })
  public documentType: string

  @column({
    columnName: 'document_number',
    serializeAs: 'documentNumber',
  })
  public documentNumber: string

  // === Contatos ===
  @column()
  public phone: string

  @column()
  public cellphone: string

  @column()
  public email: string

  @column()
  public inactive: boolean

  // === Relacionamentos ===
  @belongsTo(() => Company, {
    foreignKey: 'companiesId', // propriedade do model
  })
  public company: BelongsTo<typeof Company>

  @belongsTo(() => Occupation, {
    foreignKey: 'occupationId', // propriedade do model
  })
  public occupation: BelongsTo<typeof Occupation>

  // === Datas ===
  @column.dateTime({
    columnName: 'created_at',
    serializeAs: 'createdAt',
    autoCreate: true
  })
  public createdAt: DateTime

  @column.dateTime({
    columnName: 'updated_at',
    serializeAs: 'updatedAt',
    autoCreate: true,
    autoUpdate: true
  })
  public updatedAt: DateTime
}
