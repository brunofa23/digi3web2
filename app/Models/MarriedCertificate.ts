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

  @column({
    columnName: 'companies_id',
    serializeAs: 'companiesId',
  })
  public companiesId: number

  // === Noivo e pais ===
  @column({
    columnName: 'groom_person_id',
    serializeAs: 'groomPersonId',
  })
  public groomPersonId: number

  @column({
    columnName: 'father_groom_person_id',
    serializeAs: 'fatherGroomPersonId',
  })
  public fatherGroomPersonId: number | null

  @column({
    columnName: 'mother_groom_person_id',
    serializeAs: 'motherGroomPersonId',
  })
  public motherGroomPersonId: number | null

  // === Noiva e pais ===
  @column({
    columnName: 'bride_person_id',
    serializeAs: 'bridePersonId',
  })
  public bridePersonId: number

  @column({
    columnName: 'fahter_bride_person_id', // migration escrita errada
    serializeAs: 'fatherBridePersonId',    // correto no JSON
  })
  public fahterBridePersonId: number | null

  @column({
    columnName: 'mother_bride_person_id',
    serializeAs: 'motherBridePersonId',
  })
  public motherBridePersonId: number | null

  // === Testemunhas ===
  @column({
    columnName: 'witness_person_id',
    serializeAs: 'witnessPersonId',
  })
  public witnessPersonId: number | null

  @column({
    columnName: 'witness2_person_id',
    serializeAs: 'witness2PersonId',
  })
  public witness2PersonId: number | null

  // === Usuário responsável ===
  @column({
    columnName: 'usr_id',
    serializeAs: 'usrId',
  })
  public usrId: number

  // === Status ===
  @column({
    columnName: 'status_id',
    serializeAs: 'statusId',
  })
  public statusId: number | null

  // === Datas principais ===
  @column.dateTime({
    columnName: 'dthr_schedule',
    serializeAs: 'dthrSchedule',
  })
  public dthrSchedule: DateTime | null

  @column.dateTime({
    columnName: 'dthr_marriage',
    serializeAs: 'dthrMarriage',
  })
  public dthrMarriage: DateTime | null

  // === Tipo e observação ===
  @column()
  public type: string

  @column()
  public obs: string

  // === Igreja ===
  @column({
    columnName: 'church_name',
    serializeAs: 'churchName',
  })
  public churchName: string

  @column({
    columnName: 'church_city',
    serializeAs: 'churchCity',
  })
  public churchCity: string

  // === Regime de bens ===
  @column({
    columnName: 'marital_regime',
    serializeAs: 'maritalRegime',
  })
  public maritalRegime: string

  // === Pacto antenupcial ===
  @column()
  public prenup: boolean

  @column({
    columnName: 'registry_office_prenup',
    serializeAs: 'registryOfficePrenup',
  })
  public registryOfficePrenup: string

  @column({
    columnName: 'addres_registry_office_prenup',
    serializeAs: 'addresRegistryOfficePrenup',
  })
  public addresRegistryOfficePrenup: string

  @column({
    columnName: 'book_registry_office_prenup',
    serializeAs: 'bookRegistryOfficePrenup',
  })
  public bookRegistryOfficePrenup: number | null

  @column({
    columnName: 'sheet_registry_office_prenup',
    serializeAs: 'sheetRegistryOfficePrenup',
  })
  public sheetRegistryOfficePrenup: number | null

  @column.date({
    columnName: 'dthr_prenup',
    serializeAs: 'dthrPrenup',
  })
  public dthrPrenup: DateTime | null

  // === Local da cerimônia ===
  @column({
    columnName: 'cerimony_location',
    serializeAs: 'cerimonyLocation',
  })
  public cerimonyLocation: string

  @column({
    columnName: 'other_cerimony_location',
    serializeAs: 'otherCerimonyLocation',
  })
  public otherCerimonyLocation: string

  // === Ex-cônjuges ===
  @column({
    columnName: 'name_former_spouse',
    serializeAs: 'nameFormerSpouse',
  })
  public nameFormerSpouse: string

  @column.date({
    columnName: 'dthr_divorce_spouse',
    serializeAs: 'dthrDivorceSpouse',
  })
  public dthrDivorceSpouse: DateTime | null

  @column({
    columnName: 'name_former_spouse2',
    serializeAs: 'nameFormerSpouse2',
  })
  public nameFormerSpouse2: string

  @column.date({
    columnName: 'dthr_divorce_spouse2',
    serializeAs: 'dthrDivorceSpouse2',
  })
  public dthrDivorceSpouse2: DateTime | null

  @column()
  public inactive: boolean

  @column({
    columnName: 'status_form',
    serializeAs: 'statusForm',
  })
  public statusForm: string

    // === Relacionamentos ===
  @belongsTo(() => Company, {
    foreignKey: 'companiesId', // propriedade do model
  })
  public company: BelongsTo<typeof Company>

  @belongsTo(() => User, {
    foreignKey: 'usrId',
  })
  public user: BelongsTo<typeof User>

  @belongsTo(() => Status, {
    foreignKey: 'statusId',
  })
  public status: BelongsTo<typeof Status>

  @belongsTo(() => Person, {
    foreignKey: 'groomPersonId',
  })
  public groom: BelongsTo<typeof Person>

  @belongsTo(() => Person, {
    foreignKey: 'fatherGroomPersonId',
  })
  public fatherGroom: BelongsTo<typeof Person>

  @belongsTo(() => Person, {
    foreignKey: 'motherGroomPersonId',
  })
  public motherGroom: BelongsTo<typeof Person>

  @belongsTo(() => Person, {
    foreignKey: 'bridePersonId',
  })
  public bride: BelongsTo<typeof Person>

  @belongsTo(() => Person, {
    // atenção: aqui o NOME DA PROPRIEDADE tem o mesmo erro de digitação do banco
    foreignKey: 'fahterBridePersonId',
  })
  public fatherBride: BelongsTo<typeof Person>

  @belongsTo(() => Person, {
    foreignKey: 'motherBridePersonId',
  })
  public motherBride: BelongsTo<typeof Person>

  @belongsTo(() => Person, {
    foreignKey: 'witnessPersonId',
  })
  public witness1: BelongsTo<typeof Person>

  @belongsTo(() => Person, {
    foreignKey: 'witness2PersonId',
  })
  public witness2: BelongsTo<typeof Person>


  // === Timestamps ===
  @column.dateTime({
    columnName: 'created_at',
    serializeAs: 'createdAt',
    autoCreate: true,
  })
  public createdAt: DateTime

  @column.dateTime({
    columnName: 'updated_at',
    serializeAs: 'updatedAt',
    autoCreate: true,
    autoUpdate: true,
  })
  public updatedAt: DateTime
}
