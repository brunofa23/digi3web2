import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BadRequestException from 'App/Exceptions/BadRequestException'
import FinPaymentMethod from 'App/Models/FinPaymentMethod'
import { currencyConverter } from "App/Services/util"

export default class FinPaymentMethodsController {

  public async index({ auth, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    try {
      const data = await FinPaymentMethod.query()
        .where('companies_id', authenticate.companies_id)
        .where('excluded', false)
      return response.status(200).send(data)
    } catch (error) {
      throw new BadRequestException('Bad Request', 401, error)
    }
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const body = request.only(FinPaymentMethod.fillable)

    if (body.limit_amount && typeof body.limit_amount === 'string') {
      body.limit_amount = Number(currencyConverter(body.limit_amount))
    }
    body.companies_id = authenticate.companies_id

    try {
      const data = await FinPaymentMethod.create(body)
      return response.status(201).send(data)

    } catch (error) {
      throw new BadRequestException('Bad Request', 401, error)
    }
  }


  public async update({ auth, params, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const body = request.only(FinPaymentMethod.fillable)

    if (body.limit_amount && typeof body.limit_amount === 'string') {
      body.limit_amount = Number(currencyConverter(body.limit_amount))
    }

    try {
      const data = await FinPaymentMethod.query()
        .where('companies_id', authenticate.companies_id)
        .andWhere('id', params.id)
        .update(body)

      return response.status(201).send(data)

    } catch (error) {
      throw new BadRequestException('Bad Request', 401, error)
    }
  }


}
