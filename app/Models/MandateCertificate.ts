import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import EmployeeVerificationXCertificate from './EmployeeVerificationXCertificate'

export default class MandateCertificate extends BaseModel {
  public static table = 'mandate_certificates'

  @column({ isPrimary: true }) public id: number
  @column() public companiesId: number
  @column() public usrId: number | null
  @column.date() public requestDate: DateTime
  @column.dateTime({ serialize: (value: DateTime | null) => value?.setZone('America/Sao_Paulo').toFormat("yyyy-LL-dd'T'HH:mm") ?? null }) public scheduleDate: DateTime | null
  @column() public mandateType: number
  @column() public rectificationType: number | null
  @column() public transcriptionType: number | null
  @column() public hasPowerOfAttorney: boolean | null
  @column() public applicantName: string
  @column() public applicantCpf: string
  @column() public applicantWhatsapp: string
  @column() public applicantPhone: string | null
  @column() public applicantEmail: string | null
  @column() public registeredData: string | null
  @column() public registeredCity: string | null
  @column() public bookNumber: number | null
  @column() public sheetNumber: number | null
  @column() public termNumber: number | null
  @column() public obs: string | null
  @column() public statusForm: string
  @column() public inactive: boolean
  @column.dateTime({ autoCreate: true }) public createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true }) public updatedAt: DateTime

  @hasMany(() => EmployeeVerificationXCertificate, { foreignKey: 'mandateCertificateId' })
  public employeeVerificationXCertificates: HasMany<typeof EmployeeVerificationXCertificate>
}
