import { DateTime } from 'luxon'
import Hash from '@ioc:Adonis/Core/Hash'
import { column, beforeSave, BaseModel, hasOne, HasOne } from '@ioc:Adonis/Lucid/Orm'
import Company from './Company'

export default class User extends BaseModel {

  public static get fillable(){
    return[
      'id',
      'companies_id',
      'name',
      'username',
      'email',
      'password',
      'remember_me_token',
      'status',
      'createdAt',
      'updatedAt'
    ]
  }

  @hasOne(() => Company,{
    foreignKey: 'id',
    localKey: 'companies_id'
  })
  public company: HasOne<typeof Company>


  @column({ isPrimary: true })
  public id: number

  @column()
  public companies_id: number


  @column()
  public name: string

  @column()
  public username: string

  @column()
  public email: string

  @column({ serializeAs: null })
  public password: string

  @column()
  public rememberMeToken: string | null

  @column()
  public status: Boolean

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeSave()
  public static async hashPassword (user: User) {
    if (user.$dirty.password) {
      user.password = await Hash.make(user.password)
    }
  }
}