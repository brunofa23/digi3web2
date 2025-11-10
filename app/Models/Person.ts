import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import Occupation from './Occupation'

export default class Person extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  // === Dados pessoais ===
  @column()
  public name: string | null

  @column()
  public nameMarried: string | null

  @column()
  public cpf: string | null

  @column()
  public gender: string | null

  @column()
  public deceased: boolean

  @column.date()
  public dateBirth: DateTime | null

  @column()
  public maritalStatus: string | null

  @column()
  public illiterate: boolean

  // === Naturalidade / Nacionalidade / Ocupação ===
  @column()
  public placeBirth: string | null

  @column()
  public nationality: string | null

  @column()
  public occupationId: number | null

  @belongsTo(() => Occupation, {
    foreignKey: 'occupationId',
  })
  public occupation: BelongsTo<typeof Occupation>

  // === Endereço ===
  @column()
  public zipCode: string | null

  @column()
  public address: string | null

  @column()
  public streetNumber: string | null

  @column()
  public streetComplement: string | null

  @column()
  public district: string | null

  @column()
  public city: string | null

  @column()
  public state: string | null

  // === Documento ===
  @column()
  public documentType: string | null

  @column()
  public documentNumber: string | null

  // === Contatos ===
  @column()
  public phone: string | null

  @column()
  public cellphone: string | null

  @column()
  public email: string | null

  @column()
  public inactive: boolean

  // === Timestamps ===
  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
