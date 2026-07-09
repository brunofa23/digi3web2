import { DateTime } from 'luxon'
import { afterCreate, BaseModel, belongsTo, BelongsTo, column, HasMany, hasMany, manyToMany, ManyToMany } from '@ioc:Adonis/Lucid/Orm'
import Typebook from './Typebook'
import User from './User'
import Situation from './Situation'
import Entity from './Entity'


export default class Company extends BaseModel {

  public static get fillable() {
    return [
      'id',
      'name',
      'shortname',
      'foldername',
      'address',
      'number',
      'complement',
      'postalcode',
      'district',
      'city',
      'state',
      'cnpj',
      'responsablename',
      'phoneresponsable',
      'email',
      'status',
      'cloud',
      'use_device_control',
      'use_device_cookie_control',
      'module_books',
      'module_financial',
      'module_lgpd',
      'obs',
      'licence_value',
      'due_date',
      'fin_entity_id',
      'created_at',
      'updated_at'
    ]
  }

  @hasMany(() => Typebook, {
    foreignKey: 'companies_id',
    localKey: 'id'
  })
  public typebooks: HasMany<typeof Typebook>

  @hasMany(() => User, {
    foreignKey: 'companies_id',
    localKey: 'id'
  })
  public user: HasMany<typeof User>

  @manyToMany(() => Situation, {
    localKey: 'id',
    relatedKey: 'id',
    pivotTable: 'company_situation',
    pivotForeignKey: 'companies_id',
    pivotRelatedForeignKey: 'situation_id',
  })
  public situations: ManyToMany<typeof Situation>

  @belongsTo(() => Entity, {
    foreignKey: 'fin_entity_id',
  })
  public finentity: BelongsTo<typeof Entity>

  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @column()
  public shortname: string

  @column()
  public foldername: string

  @column()
  public address: string

  @column()
  public number: string

  @column()
  public complement: string

  @column()
  public postalcode: string

  @column()
  public district: string

  @column()
  public city: string

  @column()
  public state: string

  @column()
  public cnpj: string

  @column()
  public responsablename: string

  @column()
  public phoneresponsable: string

  @column()
  public email: string

  @column()
  public status: Boolean

  @column()
  public cloud: number

  @column()
  public use_device_control: boolean

  @column()
  public use_device_cookie_control: boolean

  @column()
  public module_books: boolean

  @column()
  public module_financial: boolean

  @column()
  public module_lgpd: boolean

  @column()
  public obs: string

  @column()
  public licence_value: number | null

  @column()
  public due_date: string | null

  @column()
  public fin_entity_id: number | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime


  @afterCreate()
  public static async afterCreateHook(company: Company) {
    const foldername = `Client_${company.id.toString()}`

    if (company.foldername !== foldername) {
      company.foldername = foldername
      await company.save()
    }
  }

}
