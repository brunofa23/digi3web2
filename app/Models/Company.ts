import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'


export default class Company extends BaseModel {

  public static get fillable(){
    return[
      'id',
      'name',
      'address',
      'number',
      'complement',
      'cep',
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

  

  @column({ isPrimary: true })
  public id: number

  @column()
  public name:string

  @column()
  public address:string

  @column()
  public number:string

  @column()
  public complement:string

  @column()
  public cep:string

  @column()
  public district:string

  @column()
  public city:string

  @column()
  public state:string

  @column()
  public cnpj:string

  @column()
  public responsablename:string

  @column()
  public phoneresponsable:string

  @column()
  public email:string

  @column()
  public status:Boolean

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
