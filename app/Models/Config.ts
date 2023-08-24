import { DateTime } from 'luxon'
import { BaseModel, column, afterFetch } from '@ioc:Adonis/Lucid/Orm'

export default class Config extends BaseModel {

  public static get fillable() {
    return [
      'id',
      'name',
      'valuetext',
      'valuebool',
      'valueinteger'

    ]
  }


  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @column()
  public valuetext: string

  @column()
  public valuebool: boolean

  @column()
  public valueinteger: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  // @afterFetch()
  // public static afterFetchHook(config: Config[]) {
  //   console.log("afterFetch...")
  // }


}
