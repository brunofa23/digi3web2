import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Groupxpermission extends BaseModel {

  public static get fillable() {
    return [
      'id',
      'usergroup_id',
      'permissiongroup_id',
      'companies_id'
    ]
  }


  @column({ isPrimary: true })
  public id: number

  @column()
  public usergroup_id: number

  @column()
  public permissiongroup_id: number

  @column()
public companies_id:number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
