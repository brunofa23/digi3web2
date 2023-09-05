import { DateTime } from 'luxon'
import Hash from '@ioc:Adonis/Core/Hash'
import { column, beforeSave, BaseModel, BelongsTo, belongsTo, hasOne, HasOne, beforeUpdate } from '@ioc:Adonis/Lucid/Orm'
import Company from './Company'
import BadRequest from 'App/Exceptions/BadRequestException'
import validations from 'App/Services/Validations/validations'

export default class User extends BaseModel {

  public static get fillable() {
    return [
      'id',
      'companies_id',
      'shortname',
      'name',
      'username',
      'email',
      'password',
      'remember_me_token',
      'permission_level',
      'status',
      'work_schedule',
      'access_image',
      'createdAt',
      'updatedAt'
    ]
  }

  // @hasOne(() => Company, {
  //   foreignKey: 'id',
  //   localKey: 'companies_id'
  // })
  // public company: HasOne<typeof Company>

  @belongsTo(() => Company, {
    foreignKey: 'companies_id',
    localKey: 'id'
  })
  public company: BelongsTo<typeof Company>

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
  public permission_level: number

  @column()
  public superuser: Boolean

  @column()
  public status: Boolean

  @column()
  public work_schedule: string

  @column()
  public access_image: DateTime

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeSave()
  public static async hashPassword(user: User) {
    const strongPasswordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
    if (user.$dirty.password) {
      if (strongPasswordRegex.test(user.$dirty.password) == false) {
        let errorValidation = await new validations('user_error_207')
        throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
      }

      user.password = await Hash.make(user.password)
    }
  }





}
