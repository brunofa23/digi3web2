import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  belongsTo,
  BelongsTo,
  hasMany,
  HasMany,
} from '@ioc:Adonis/Lucid/Orm'

import Company from 'App/Models/Company'
import User from 'App/Models/User'
import Status from 'App/Models/Status'
import Person from 'App/Models/Person'
import EmployeeVerificationXCertificate from 'App/Models/EmployeeVerificationXCertificate'

export default class DeathCertificate extends BaseModel {
  public static table = 'death_certificates'

  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'companies_id', serializeAs: 'companiesId' })
  public companiesId: number

  @column({ columnName: 'deceased_person_id', serializeAs: 'deceasedPersonId' })
  public deceasedPersonId: number | null

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

  @column({ columnName: 'death_declaration_number', serializeAs: 'deathDeclarationNumber' })
  public deathDeclarationNumber: string | null

  @column({ columnName: 'death_declaration_not_found', serializeAs: 'deathDeclarationNotFound' })
  public deathDeclarationNotFound: boolean

  @column({ columnName: 'deceased_unknown', serializeAs: 'deceasedUnknown' })
  public deceasedUnknown: boolean

  @column({ columnName: 'naturalness_state', serializeAs: 'naturalnessState' })
  public naturalnessState: string | null

  @column({ columnName: 'naturalness_city', serializeAs: 'naturalnessCity' })
  public naturalnessCity: string | null

  @column.date({ columnName: 'birth_date', serializeAs: 'birthDate' })
  public birthDate: DateTime | null

  @column.date({ columnName: 'death_date', serializeAs: 'deathDate' })
  public deathDate: DateTime | null

  @column({ columnName: 'death_date_unknown', serializeAs: 'deathDateUnknown' })
  public deathDateUnknown: boolean

  @column({ columnName: 'death_time', serializeAs: 'deathTime' })
  public deathTime: string | null

  @column({ columnName: 'death_time_unknown', serializeAs: 'deathTimeUnknown' })
  public deathTimeUnknown: boolean

  @column()
  public age: number | null

  @column({ columnName: 'age_type', serializeAs: 'ageType' })
  public ageType: string | null

  @column({ columnName: 'stable_union', serializeAs: 'stableUnion' })
  public stableUnion: boolean

  @column({ columnName: 'marital_status', serializeAs: 'maritalStatus' })
  public maritalStatus: string | null

  @column()
  public race: string | null

  @column({ columnName: 'other_occupation', serializeAs: 'otherOccupation' })
  public otherOccupation: boolean

  @column({ columnName: 'former_spouse_name', serializeAs: 'formerSpouseName' })
  public formerSpouseName: string | null

  @column({ columnName: 'former_spouse_book_number', serializeAs: 'formerSpouseBookNumber' })
  public formerSpouseBookNumber: number | null

  @column({ columnName: 'former_spouse_sheet_number', serializeAs: 'formerSpouseSheetNumber' })
  public formerSpouseSheetNumber: number | null

  @column({ columnName: 'former_spouse_term_number', serializeAs: 'formerSpouseTermNumber' })
  public formerSpouseTermNumber: string | null

  @column({ columnName: 'former_spouse_registry_office', serializeAs: 'formerSpouseRegistryOffice' })
  public formerSpouseRegistryOffice: string | null

  @column({ columnName: 'occurrence_found_alive', serializeAs: 'occurrenceFoundAlive' })
  public occurrenceFoundAlive: boolean

  @column({ columnName: 'occurrence_location_type', serializeAs: 'occurrenceLocationType' })
  public occurrenceLocationType: string | null

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

  @column({ columnName: 'deceased_residence_country', serializeAs: 'deceasedResidenceCountry' })
  public deceasedResidenceCountry: string | null

  @column({ columnName: 'burial_status', serializeAs: 'burialStatus' })
  public burialStatus: string | null

  @column({ columnName: 'cremation_manifestation', serializeAs: 'cremationManifestation' })
  public cremationManifestation: boolean

  @column({ columnName: 'burial_witnesses', serializeAs: 'burialWitnesses' })
  public burialWitnesses: string | null

  @column({ columnName: 'burial_state', serializeAs: 'burialState' })
  public burialState: string | null

  @column({ columnName: 'burial_city', serializeAs: 'burialCity' })
  public burialCity: string | null

  @column({ columnName: 'will_be_cremated', serializeAs: 'willBeCremated' })
  public willBeCremated: boolean

  @column({ columnName: 'burial_place', serializeAs: 'burialPlace' })
  public burialPlace: string | null

  @column({ columnName: 'burial_doctor', serializeAs: 'burialDoctor' })
  public burialDoctor: string | null

  @column({ columnName: 'burial_doctor_crm', serializeAs: 'burialDoctorCrm' })
  public burialDoctorCrm: string | null

  @column({ columnName: 'burial_observation', serializeAs: 'burialObservation' })
  public burialObservation: string | null

  @column({ columnName: 'filiation1_naturalness_ignored', serializeAs: 'filiation1NaturalnessIgnored' })
  public filiation1NaturalnessIgnored: boolean

  @column({ columnName: 'filiation1_birth_state', serializeAs: 'filiation1BirthState' })
  public filiation1BirthState: string | null

  @column({ columnName: 'filiation1_birth_city', serializeAs: 'filiation1BirthCity' })
  public filiation1BirthCity: string | null

  @column({ columnName: 'filiation1_other_occupation', serializeAs: 'filiation1OtherOccupation' })
  public filiation1OtherOccupation: boolean

  @column({ columnName: 'filiation1_residence_country', serializeAs: 'filiation1ResidenceCountry' })
  public filiation1ResidenceCountry: string | null

  @column({ columnName: 'filiation2_naturalness_ignored', serializeAs: 'filiation2NaturalnessIgnored' })
  public filiation2NaturalnessIgnored: boolean

  @column({ columnName: 'filiation2_birth_state', serializeAs: 'filiation2BirthState' })
  public filiation2BirthState: string | null

  @column({ columnName: 'filiation2_birth_city', serializeAs: 'filiation2BirthCity' })
  public filiation2BirthCity: string | null

  @column({ columnName: 'filiation2_other_occupation', serializeAs: 'filiation2OtherOccupation' })
  public filiation2OtherOccupation: boolean

  @column({ columnName: 'filiation2_residence_country', serializeAs: 'filiation2ResidenceCountry' })
  public filiation2ResidenceCountry: string | null

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

  @belongsTo(() => Person, { foreignKey: 'deceasedPersonId' })
  public deceased: BelongsTo<typeof Person>

  @belongsTo(() => Person, { foreignKey: 'filiation1PersonId' })
  public filiation1: BelongsTo<typeof Person>

  @belongsTo(() => Person, { foreignKey: 'filiation2PersonId' })
  public filiation2: BelongsTo<typeof Person>

  @belongsTo(() => Person, { foreignKey: 'declarantPersonId' })
  public declarant: BelongsTo<typeof Person>

  @hasMany(() => EmployeeVerificationXCertificate, { foreignKey: 'deathCertificateId' })
  public employeeVerificationXCertificates: HasMany<typeof EmployeeVerificationXCertificate>

  @column.dateTime({ columnName: 'created_at', autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at', autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
