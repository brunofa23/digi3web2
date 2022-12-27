 import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Company from 'App/Models/Company'


export default class CompaniesController {

  public async index({ response }) {
    const data = await Company
    .query()
    .preload('typebooks')

    return response.send({ data })
  }

}
