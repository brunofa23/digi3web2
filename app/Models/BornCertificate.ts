import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  belongsTo,
  BelongsTo,
} from '@ioc:Adonis/Lucid/Orm'

import Company from 'App/Models/Company'
import User from 'App/Models/User'
import Status from 'App/Models/Status'
import Person from 'App/Models/Person'

export default class BornCertificate extends BaseModel {
  public static table = 'born_certificates'

  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'companies_id', serializeAs: 'companiesId' })
  public companiesId: number

  @column({ columnName: 'registered_person_id', serializeAs: 'registeredPersonId' })
  public registeredPersonId: number | null

  @column({ columnName: 'filiation1_person_id', serializeAs: 'filiation1PersonId' })
  public filiation1PersonId: number | null

  @column({ columnName: 'filiation2_person_id', serializeAs: 'filiation2PersonId' })
  public filiation2PersonId: number | null

  @column({ columnName: 'declarant_person_id', serializeAs: 'declarantPersonId' })
  public declarantPersonId: number | null

  @column({ columnName: 'usr_id', serializeAs: 'usrId' })
  public usrId: number | null

  @column({ columnName: 'status_id', serializeAs: 'statusId' })
  public statusId: number | null

  @column({ columnName: 'registered_name_altered', serializeAs: 'registeredNameAltered' })
  public registeredNameAltered: boolean

  @column.date({ columnName: 'birth_date', serializeAs: 'birthDate' })
  public birthDate: DateTime | null

  @column({ columnName: 'birth_time', serializeAs: 'birthTime' })
  public birthTime: string | null

  @column({ columnName: 'birth_time_ignored', serializeAs: 'birthTimeIgnored' })
  public birthTimeIgnored: boolean

  @column()
  public twins: boolean

  @column({ columnName: 'dnv_number', serializeAs: 'dnvNumber' })
  public dnvNumber: string | null

  @column({ columnName: 'dnv_not_found', serializeAs: 'dnvNotFound' })
  public dnvNotFound: boolean

  @column({ columnName: 'dnv_missing_reason', serializeAs: 'dnvMissingReason' })
  public dnvMissingReason: string | null

  @column({ columnName: 'naturalness_state', serializeAs: 'naturalnessState' })
  public naturalnessState: string | null

  @column({ columnName: 'naturalness_city', serializeAs: 'naturalnessCity' })
  public naturalnessCity: string | null

  @column({ columnName: 'occurrence_location_type', serializeAs: 'occurrenceLocationType' })
  public occurrenceLocationType: string | null

  @column({ columnName: 'occurrence_place', serializeAs: 'occurrencePlace' })
  public occurrencePlace: string | null

  @column({ columnName: 'occurrence_zip_code', serializeAs: 'occurrenceZipCode' })
  public occurrenceZipCode: string | null

  @column({ columnName: 'occurrence_address', serializeAs: 'occurrenceAddress' })
  public occurrenceAddress: string | null

  @column({ columnName: 'occurrence_street_number', serializeAs: 'occurrenceStreetNumber' })
  public occurrenceStreetNumber: string | null

  @column({ columnName: 'occurrence_district', serializeAs: 'occurrenceDistrict' })
  public occurrenceDistrict: string | null

  @column({ columnName: 'occurrence_country', serializeAs: 'occurrenceCountry' })
  public occurrenceCountry: string | null

  @column({ columnName: 'occurrence_state', serializeAs: 'occurrenceState' })
  public occurrenceState: string | null

  @column({ columnName: 'occurrence_city', serializeAs: 'occurrenceCity' })
  public occurrenceCity: string | null

  @column({ columnName: 'occurrence_subdistrict', serializeAs: 'occurrenceSubdistrict' })
  public occurrenceSubdistrict: string | null

  @column({ columnName: 'filiation1_considered_mother', serializeAs: 'filiation1ConsideredMother' })
  public filiation1ConsideredMother: boolean

  @column({ columnName: 'filiation1_name_altered', serializeAs: 'filiation1NameAltered' })
  public filiation1NameAltered: boolean

  @column({ columnName: 'filiation1_other_occupation', serializeAs: 'filiation1OtherOccupation' })
  public filiation1OtherOccupation: boolean

  @column({ columnName: 'filiation1_birth_state', serializeAs: 'filiation1BirthState' })
  public filiation1BirthState: string | null

  @column({ columnName: 'filiation1_birth_city', serializeAs: 'filiation1BirthCity' })
  public filiation1BirthCity: string | null

  @column({ columnName: 'filiation1_birth_place', serializeAs: 'filiation1BirthPlace' })
  public filiation1BirthPlace: string | null

  @column({ columnName: 'filiation1_residence_country', serializeAs: 'filiation1ResidenceCountry' })
  public filiation1ResidenceCountry: string | null

  @column({ columnName: 'filiation1_residence_subdistrict', serializeAs: 'filiation1ResidenceSubdistrict' })
  public filiation1ResidenceSubdistrict: string | null

  @column({ columnName: 'filiation2_considered_mother', serializeAs: 'filiation2ConsideredMother' })
  public filiation2ConsideredMother: boolean

  @column({ columnName: 'filiation2_name_altered', serializeAs: 'filiation2NameAltered' })
  public filiation2NameAltered: boolean

  @column({ columnName: 'filiation2_other_occupation', serializeAs: 'filiation2OtherOccupation' })
  public filiation2OtherOccupation: boolean

  @column({ columnName: 'filiation2_birth_state', serializeAs: 'filiation2BirthState' })
  public filiation2BirthState: string | null

  @column({ columnName: 'filiation2_birth_city', serializeAs: 'filiation2BirthCity' })
  public filiation2BirthCity: string | null

  @column({ columnName: 'filiation2_birth_place', serializeAs: 'filiation2BirthPlace' })
  public filiation2BirthPlace: string | null

  @column({ columnName: 'filiation2_residence_country', serializeAs: 'filiation2ResidenceCountry' })
  public filiation2ResidenceCountry: string | null

  @column({ columnName: 'filiation2_residence_subdistrict', serializeAs: 'filiation2ResidenceSubdistrict' })
  public filiation2ResidenceSubdistrict: string | null

  @column({ columnName: 'grandfather_filiation1', serializeAs: 'grandfatherFiliation1' })
  public grandfatherFiliation1: string | null

  @column({ columnName: 'grandmother_filiation1', serializeAs: 'grandmotherFiliation1' })
  public grandmotherFiliation1: string | null

  @column({ columnName: 'grandfather_filiation2', serializeAs: 'grandfatherFiliation2' })
  public grandfatherFiliation2: string | null

  @column({ columnName: 'grandmother_filiation2', serializeAs: 'grandmotherFiliation2' })
  public grandmotherFiliation2: string | null

  @column({ columnName: 'declarant_type', serializeAs: 'declarantType' })
  public declarantType: string | null

  @column({ columnName: 'declarant_other_occupation', serializeAs: 'declarantOtherOccupation' })
  public declarantOtherOccupation: boolean

  @column({ columnName: 'declarant_birth_state', serializeAs: 'declarantBirthState' })
  public declarantBirthState: string | null

  @column({ columnName: 'declarant_birth_city', serializeAs: 'declarantBirthCity' })
  public declarantBirthCity: string | null

  @column({ columnName: 'declarant_residence_country', serializeAs: 'declarantResidenceCountry' })
  public declarantResidenceCountry: string | null

  @column({ columnName: 'declarant_residence_subdistrict', serializeAs: 'declarantResidenceSubdistrict' })
  public declarantResidenceSubdistrict: string | null

  @column({ columnName: 'electronic_address', serializeAs: 'electronicAddress' })
  public electronicAddress: string | null

  @column()
  public phone: string | null

  @column()
  public obs: string | null

  @column()
  public inactive: boolean

  @column({ columnName: 'status_form', serializeAs: 'statusForm' })
  public statusForm: string

  @belongsTo(() => Company, { foreignKey: 'companiesId' })
  public company: BelongsTo<typeof Company>

  @belongsTo(() => User, { foreignKey: 'usrId' })
  public user: BelongsTo<typeof User>

  @belongsTo(() => Status, { foreignKey: 'statusId' })
  public status: BelongsTo<typeof Status>

  @belongsTo(() => Person, { foreignKey: 'registeredPersonId' })
  public registered: BelongsTo<typeof Person>

  @belongsTo(() => Person, { foreignKey: 'filiation1PersonId' })
  public filiation1: BelongsTo<typeof Person>

  @belongsTo(() => Person, { foreignKey: 'filiation2PersonId' })
  public filiation2: BelongsTo<typeof Person>

  @belongsTo(() => Person, { foreignKey: 'declarantPersonId' })
  public declarant: BelongsTo<typeof Person>

  @column.dateTime({ columnName: 'created_at', serializeAs: 'createdAt', autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({
    columnName: 'updated_at',
    serializeAs: 'updatedAt',
    autoCreate: true,
    autoUpdate: true,
  })
  public updatedAt: DateTime
}
