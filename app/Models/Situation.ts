import {
  BaseModel,
  column,
  manyToMany,
  ManyToMany,
} from '@ioc:Adonis/Lucid/Orm'
import Company from 'App/Models/Company'

export default class Situation extends BaseModel {
  public static table = 'situation'

  @column({ isPrimary: true })
  public id: number

  @column()
  public description: string

  @column()
  public inactive: boolean

  @manyToMany(() => Company, {
    localKey: 'id',
    relatedKey: 'id',
    pivotTable: 'company_situation',
    pivotForeignKey: 'situation_id',
    pivotRelatedForeignKey: 'companies_id',
  })
  public companies: ManyToMany<typeof Company>
}
