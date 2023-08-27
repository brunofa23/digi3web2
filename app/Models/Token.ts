import { DateTime } from 'luxon'
import { BaseModel, column, beforeSave, afterFind } from '@ioc:Adonis/Lucid/Orm'
import Encryption from '@ioc:Adonis/Core/Encryption'
import { string, types } from '@ioc:Adonis/Core/Helpers'

export default class Token extends BaseModel {

  public static get fillable() {
    return [
      "id",
      "name",
      "token",
      "credentials",
      "accountname",
      "status"
    ]
  }


  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @column()
  public token: string

  @column()
  public credentials: string

  @column()
  public accountname: string

  @column()
  public status: boolean

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeSave()
  public static async Encryption(token: Token) {
    console.log("before Save....", token)
    if (token.$dirty.token) {
      token.token = await Encryption.encrypt(token.token)
    }

    if (token.$dirty.credentials) {
      token.credentials = await Encryption.encrypt(token.credentials)
    }
  }

  @afterFind()
  public static afterFind(token: Token) {
    if (!string.isEmpty(token.token) || !types.isNull(token.token))
      token.token = Encryption.decrypt(token.token)
    if (!string.isEmpty(token.credentials) || !types.isNull(token.credentials))
      token.credentials = Encryption.decrypt(token.credentials)
  }



}
