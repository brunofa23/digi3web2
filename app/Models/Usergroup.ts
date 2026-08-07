import { DateTime } from 'luxon'
import { BaseModel, column, HasMany, hasMany } from '@ioc:Adonis/Lucid/Orm'
import Groupxpermission from './Groupxpermission'
export default class Usergroup extends BaseModel {

  public static get fillable() {
    return [
      'id',
      'companies_id',
      'name',
      'inactive',
      'available_for_user_creation',
    ]
  }

  @hasMany(()=>Groupxpermission,{
    foreignKey: 'usergroup_id',
    localKey:'id'
  })
  public groupxpermission: HasMany<typeof Groupxpermission>

  @column({ isPrimary: true })
  public id: number

  @column()
  public companies_id: number

  @column()
  public name: string

  @column()
  public inactive: boolean

  @column()
  public available_for_user_creation: boolean

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
