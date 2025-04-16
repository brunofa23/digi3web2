import { DateTime } from 'luxon'
import { BaseModel, column, HasOne, hasOne } from '@ioc:Adonis/Lucid/Orm'
import FinClass from './FinClass'
import FinEmp from './FinEmp'
import FinPaymentMethod from './FinPaymentMethod'
export default class FinAccount extends BaseModel {

  public static get fillable() {
    return [
      'id',
      'companies_id',
      'fin_emp_id',
      'fin_class_id',
      'fin_paymentmethod_id',
      'id_replication',
      'description',
      'amount',
      'amount_paid',
      'date',
      'date_due',
      'replicate',
      'data_billing',
      'date_conciliation',
      'excluded',
      'debit_credit',
      'cost',
      'ir',
      'obs',
    ]
  }

  @hasOne(() => FinClass, {
    foreignKey: 'id',
    localKey: 'fin_class_id'
  })
  public finclass: HasOne<typeof FinClass>

  @hasOne(() => FinEmp, {
    foreignKey: 'id',
    localKey: 'fin_emp_id'
  })
  public finemp: HasOne<typeof FinEmp>

  @hasOne(() => FinPaymentMethod, {
    foreignKey: 'id',
    localKey: 'fin_paymentmethod_id'
  })
  public finPaymentMethod: HasOne<typeof FinPaymentMethod>

  @column({ isPrimary: true })
  public id: number

  @column()
  public companies_id: number

  @column()
  public fin_emp_id: number

  @column()
  public fin_class_id: number

  @column()
  public fin_paymentmethod_id: number

  @column()
  public id_replication: number

  @column()
  public description: string

  @column()
  public amount: number


  @column()
  public amount_paid: number

  @column.dateTime()
  public date: DateTime
  @column.dateTime()
  public date_due: DateTime
  @column()
  public replicate: boolean

  @column.dateTime()
  public data_billing: DateTime

  @column.dateTime()
  public date_conciliation: DateTime

  @column()
  public excluded: boolean

  @column()
  public debit_credit: string

  @column()
  public cost: string
  @column()
  public ir: boolean
  @column()
  public obs: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
