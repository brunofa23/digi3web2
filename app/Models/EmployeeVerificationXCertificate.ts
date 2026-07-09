import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  belongsTo,
  BelongsTo,
} from '@ioc:Adonis/Lucid/Orm'

import MarriedCertificate from 'App/Models/MarriedCertificate'
import EmployeeVerification from 'App/Models/EmployeeVerification'
import Company from 'App/Models/Company'
import User from 'App/Models/User'

export default class EmployeeVerificationXCertificate extends BaseModel {
  public static table = 'employee_verification_x_certificates'

  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'married_certificate_id' })
  public marriedCertificateId: number

  @column({ columnName: 'companies_id' })
  public companiesId: number

  @column({ columnName: 'employee_verification_id' })
  public employeeVerificationId: number

  @column({ columnName: 'user_id' })
  public userId: number

  @column()
  public status: string

  @column.dateTime()
  public date: DateTime

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => MarriedCertificate, {
    foreignKey: 'marriedCertificateId',
  })
  public marriedCertificate: BelongsTo<typeof MarriedCertificate>

  @belongsTo(() => EmployeeVerification, {
    foreignKey: 'employeeVerificationId',
  })
  public employeeVerification: BelongsTo<typeof EmployeeVerification>

  @belongsTo(() => Company, {
    foreignKey: 'companiesId',
  })
  public company: BelongsTo<typeof Company>

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  public user: BelongsTo<typeof User>
}
