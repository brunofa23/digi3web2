import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BadRequestException from 'App/Exceptions/BadRequestException'
import FinClass from 'App/Models/FinClass'
import FinnClassStoreValidator from 'App/Validators/FinnClassStoreValidator'
import { currencyConverter } from "App/Services/util"
export default class FinClassesController {

  public async index({ auth, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    try {
      const data = await FinClass.query()
        .where('companies_id', authenticate.companies_id)
      return response.status(200).send(data)
    } catch (error) {
      throw new BadRequestException('Bad Request', 401, error)
    }
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    // const body = request.only(FinClass.fillable)
    // body.companies_id = authenticate.companies_id
    const input = request.all()
    // Se vier como string tipo '100,00', converte
    if (input.limit_amount && typeof input.limit_amount === 'string') {
      input.limit_amount = Number(currencyConverter(input.limit_amount))
    }
    input.companies_id = authenticate.companies_id
    const body = await request.validate({
      schema: new FinnClassStoreValidator().schema,
      data: input,
    })

    try {
      const data = await FinClass.create(body)
      return response.status(201).send(data)

    } catch (error) {
      throw new BadRequestException('Bad Request', 401, error)
    }
  }

  public async show({ auth, params, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    try {
      const data = await FinClass.findOrFail(params.id)
      return response.status(200).send(data)
    } catch (error) {
      throw new BadRequestException('Bad Request', 401, error)
    }
  }


  public async update({ auth, params, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const input = request.all()
    // Se vier como string tipo '100,00', converte
    if (input.limit_amount && typeof input.limit_amount === 'string') {
      input.limit_amount = Number(currencyConverter(input.limit_amount))
    }
    const body = await request.validate({
      schema: new FinnClassStoreValidator().schema,
      data: input,
    })

    try {
      const data = await FinClass.query()
        .where('companies_id', authenticate.companies_id)
        .andWhere('id', params.id)
        .update(body)

      return response.status(201).send(data)

    } catch (error) {
      throw new BadRequestException('Bad Request', 401, error)
    }

  }

  public async destroy({ }: HttpContextContract) { }
}
