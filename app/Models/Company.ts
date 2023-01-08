import { DateTime } from 'luxon'
import { afterSave, BaseModel, column, HasMany, hasMany } from '@ioc:Adonis/Lucid/Orm'
import Typebook from './Typebook'
import User from './User'


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

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime


  @afterSave()
  public static async afterSaveHook(company: Company) {
    company.foldername = `Client_${company.id.toString()}`
    await company.save()
  }

}



