import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Permissiongroup extends BaseModel {
  public static get fillable() {
    return [
      'id',
      'name',
      'desc',
      'inactive',
    ]
  }


  @column({ isPrimary: true })
  public id: number

  @column()
  public name:string

  @column()
  public desc: string

  @column()
  public inactive: boolean

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
