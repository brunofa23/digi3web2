import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  belongsTo,
  BelongsTo,
} from '@ioc:Adonis/Lucid/Orm'

import Receipt from 'App/Models/Receipt'
import EmployeeVerification from 'App/Models/EmployeeVerification'
import Company from 'App/Models/Company'
import User from 'App/Models/User'

export default class EmployeeVerificationXReceipt extends BaseModel {
  public static table = 'employee_verification_x_receipts'

  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'receipt_id' })
  public receiptId: number

  @column({ columnName: 'companies_id' })
  public companiesId: number

  @column({ columnName: 'employee_verification_id' })
  public employeeVerificationId: number

  @column({ columnName: 'user_id' })
  public userId: number

  @column.dateTime()
  public date: DateTime

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Receipt, {
    foreignKey: 'receiptId',
  })
  public receipt: BelongsTo<typeof Receipt>

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
