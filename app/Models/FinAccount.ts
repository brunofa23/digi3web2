import { DateTime } from 'luxon'
import { BaseModel, column, HasOne, hasOne } from '@ioc:Adonis/Lucid/Orm'
import FinClass from './FinClass'
import FinEmp from './FinEmp'
import FinPaymentMethod from './FinPaymentMethod'
import Entity from './Entity'
export default class FinAccount extends BaseModel {

  public static get fillable() {
    return [
      'id',
      'companies_id',
      'fin_emp_id',
      'fin_class_id',
      'fin_paymentmethod_id',
      'id_replication',
      'entity_id',
      'description',
      'amount',
      'amount_paid',
      'date', //data de lançamento
      'date_due', //data de vencimento
      'replicate',
      'data_billing',
      'date_conciliation',
      'excluded',
      'debit_credit',
      'cost',
      'ir',
      'obs',
      'analyze',
      'future',
      'reserve',
      'overplus',
      'limit_amount',
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

  @hasOne(() => Entity, {
    foreignKey: 'id',
    localKey: 'entity_id'
  })
  public entity: HasOne<typeof Entity>



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
  public entity_id: number

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

  @column()
  public analyze: boolean
  @column()
  public future: boolean
  @column()
  public reserve: boolean
  @column()
  public overplus: boolean
  @column()
  public limit_amount: number

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
