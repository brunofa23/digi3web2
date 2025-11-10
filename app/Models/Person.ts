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

  @column()
  public companiesId: number

  // === Dados pessoais ===
  @column()
  public name: string

  @column()
  public nameMarried: string

  @column()
  public cpf: string

  @column()
  public gender: string

  @column()
  public deceased: boolean

  @column.date()
  public dateBirth: DateTime

  @column()
  public maritalStatus: string

  @column()
  public illiterate: boolean

  // Naturalidade / Nacionalidade / Profissão
  @column()
  public placeBirth: string

  @column()
  public nationality: string

  @column()
  public occupationId: number | null

  // === Endereço ===
  @column()
  public zipCode: string

  @column()
  public address: string

  @column()
  public streetNumber: string

  @column()
  public streetComplement: string

  @column()
  public district: string

  @column()
  public city: string

  @column()
  public state: string

  // === Documento ===
  @column()
  public documentType: string

  @column()
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
    foreignKey: 'companiesId',
  })
  public company: BelongsTo<typeof Company>

  @belongsTo(() => Occupation, {
    foreignKey: 'occupationId',
  })
  public occupation: BelongsTo<typeof Occupation>

  // === Datas ===
  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
