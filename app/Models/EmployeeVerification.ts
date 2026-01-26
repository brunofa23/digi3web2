// app/Models/EmployeeVerification.ts
import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  belongsTo,
  BelongsTo,
} from '@ioc:Adonis/Lucid/Orm'
import Company from 'App/Models/Company'

export default class EmployeeVerification extends BaseModel {
  // Nome da tabela
  public static table = 'employee_verifications'

  // Chave primária não é auto-incremento
  public static primaryKey = 'id'
  public static incrementing = false

  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'companies_id' })
  public companiesId: number

  @column()
  public description: string

  @column()
  public inactive: boolean

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Company, {
    foreignKey: 'companiesId',
  })
  public company: BelongsTo<typeof Company>
}
