import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BadRequestException from 'App/Exceptions/BadRequestException'
import FinClass from 'App/Models/FinClass'

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
    const body = request.only(FinClass.fillable)
    body.companies_id = authenticate.companies_id

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


  public async update({auth,params, request, response }: HttpContextContract) {
    const authenticate =  await auth.use('api').authenticate()
        const body = request.only(FinClass.fillable)
        try {
          const data = await FinClass.query()
          .where('companies_id',authenticate.companies_id )
          .andWhere('id', params.id)
          .update(body)

          return response.status(201).send(data)

        } catch (error) {
          throw new BadRequestException('Bad Request', 401, error)
        }

  }

  public async destroy({ }: HttpContextContract) { }
}
