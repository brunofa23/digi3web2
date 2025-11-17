import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  belongsTo,
  BelongsTo
} from '@ioc:Adonis/Lucid/Orm'

import Company from 'App/Models/Company'
import User from 'App/Models/User'
import Status from 'App/Models/Status'
import Person from 'App/Models/Person'

export default class MarriedCertificate extends BaseModel {
  public static table = 'married_certificates'

  @column({ isPrimary: true })
  public id: number

  @column()
  public companiesId: number

  // === Noivo e pais ===
  @column()
  public groomPersonId: number

  @column()
  public fatherGroomPersonId: number | null

  @column()
  public motherGroomPersonId: number | null

  // === Noiva e pais ===
  @column()
  public bridePersonId: number

  @column()
  public fahterBridePersonId: number | null   // atenção: migration tem erro de digitação "fahter"

  @column()
  public motherBridePersonId: number | null

  // === Testemunhas ===
  @column()
  public witnessPersonId: number | null

  @column()
  public witness2PersonId: number | null

  // === Usuário responsável ===
  @column()
  public usrId: number

  // === Status ===
  @column()
  public statusId: number | null

  // === Datas principais ===
  @column.dateTime()
  public dthrSchedule: DateTime | null

  @column.dateTime()
  public dthrMarriage: DateTime | null

  // === Tipo e observação ===
  @column()
  public type: string

  @column()
  public obs: string

  // === Igreja ===
  @column()
  public churchName: string

  @column()
  public churchCity: string

  // === Regime de bens ===
  @column()
  public maritalRegime: string

  // === Pacto antenupcial ===
  @column()
  public prenup: boolean

  @column()
  public registryOfficePrenup: string

  @column()
  public addresRegistryOfficePrenup: string

  @column()
  public bookRegistryOfficePrenup: number | null

  @column()
  public sheetRegistryOfficePrenup: number | null

  @column.date()
  public dthrPrenup: DateTime | null

  // === Local da cerimônia ===
  @column()
  public cerimonyLocation: string

  @column()
  public otherCerimonyLocation: string

  // === Ex-cônjuges ===
  @column()
  public nameFormerSpouse: string

  @column.date()
  public dthrDivorceSpouse: DateTime | null

  @column()
  public nameFormerSpouse2: string

  @column.date()
  public dthrDivorceSpouse2: DateTime | null

  @column()
  public inactive: boolean

  @column()
  public statusForm:string

  // === Relacionamentos ===

  @belongsTo(() => Company, { foreignKey: 'companiesId' })
  public company: BelongsTo<typeof Company>

  @belongsTo(() => User, { foreignKey: 'usrId' })
  public user: BelongsTo<typeof User>

  @belongsTo(() => Status, { foreignKey: 'statusId' })
  public status: BelongsTo<typeof Status>

  @belongsTo(() => Person, { foreignKey: 'groomPersonId' })
  public groom: BelongsTo<typeof Person>

  @belongsTo(() => Person, { foreignKey: 'fatherGroomPersonId' })
  public fatherGroom: BelongsTo<typeof Person>

  @belongsTo(() => Person, { foreignKey: 'motherGroomPersonId' })
  public motherGroom: BelongsTo<typeof Person>

  @belongsTo(() => Person, { foreignKey: 'bridePersonId' })
  public bride: BelongsTo<typeof Person>

  @belongsTo(() => Person, { foreignKey: 'fahterBridePersonId' })
  public fatherBride: BelongsTo<typeof Person>

  @belongsTo(() => Person, { foreignKey: 'motherBridePersonId' })
  public motherBride: BelongsTo<typeof Person>

  @belongsTo(() => Person, { foreignKey: 'witnessPersonId' })
  public witness1: BelongsTo<typeof Person>

  @belongsTo(() => Person, { foreignKey: 'witness2PersonId' })
  public witness2: BelongsTo<typeof Person>

  // === Timestamps ===
  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
