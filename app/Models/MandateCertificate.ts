import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import EmployeeVerificationXCertificate from './EmployeeVerificationXCertificate'

export default class MandateCertificate extends BaseModel {
  public static table = 'mandate_certificates'

  @column({ isPrimary: true }) public id: number
  @column({ columnName: 'companies_id', serializeAs: 'companiesId' }) public companiesId: number
  @column({ columnName: 'usr_id', serializeAs: 'usrId' }) public usrId: number | null
  @column.date({ columnName: 'request_date', serializeAs: 'requestDate' }) public requestDate: DateTime
  @column.dateTime({ columnName: 'schedule_date', serializeAs: 'scheduleDate', serialize: (value: DateTime | null) => value?.setZone('America/Sao_Paulo').toFormat("yyyy-LL-dd'T'HH:mm") ?? null }) public scheduleDate: DateTime | null
  @column({ columnName: 'mandate_type', serializeAs: 'mandateType' }) public mandateType: number
  @column({ columnName: 'rectification_type', serializeAs: 'rectificationType' }) public rectificationType: number | null
  @column({ columnName: 'transcription_type', serializeAs: 'transcriptionType' }) public transcriptionType: number | null
  @column({ columnName: 'has_power_of_attorney', serializeAs: 'hasPowerOfAttorney' }) public hasPowerOfAttorney: boolean | null
  @column({ columnName: 'applicant_name', serializeAs: 'applicantName' }) public applicantName: string
  @column({ columnName: 'applicant_cpf', serializeAs: 'applicantCpf' }) public applicantCpf: string
  @column({ columnName: 'applicant_whatsapp', serializeAs: 'applicantWhatsapp' }) public applicantWhatsapp: string
  @column({ columnName: 'applicant_phone', serializeAs: 'applicantPhone' }) public applicantPhone: string | null
  @column({ columnName: 'applicant_email', serializeAs: 'applicantEmail' }) public applicantEmail: string | null
  @column({ columnName: 'registered_data', serializeAs: 'registeredData' }) public registeredData: string | null
  @column({ columnName: 'registered_city', serializeAs: 'registeredCity' }) public registeredCity: string | null
  @column({ columnName: 'book_number', serializeAs: 'bookNumber' }) public bookNumber: number | null
  @column({ columnName: 'sheet_number', serializeAs: 'sheetNumber' }) public sheetNumber: number | null
  @column({ columnName: 'term_number', serializeAs: 'termNumber' }) public termNumber: number | null
  @column() public obs: string | null
  @column({ columnName: 'status_form', serializeAs: 'statusForm' }) public statusForm: string
  @column() public inactive: boolean
  @column.dateTime({ columnName: 'created_at', serializeAs: 'createdAt', autoCreate: true }) public createdAt: DateTime
  @column.dateTime({ columnName: 'updated_at', serializeAs: 'updatedAt', autoCreate: true, autoUpdate: true }) public updatedAt: DateTime

  @hasMany(() => EmployeeVerificationXCertificate, { foreignKey: 'mandateCertificateId' })
  public employeeVerificationXCertificates: HasMany<typeof EmployeeVerificationXCertificate>
}
