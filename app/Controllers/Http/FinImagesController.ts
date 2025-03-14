import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BadRequestException from 'App/Exceptions/BadRequestException'
import FinImage from 'App/Models/FinImage'

export default class FinImagesController {

  public async index({ auth, response }: HttpContextContract) {
      await auth.use('api').authenticate()
      try {
        const data = await FinImage.query()
        return response.status(200).send(data)
      } catch (error) {
        throw new BadRequestException('Bad Request', 401, error)
      }
    }

    public async store({ auth, request, response }: HttpContextContract) {
      await auth.use('api').authenticate()
      const body = request.only(FinImage.fillable)
      try {
        const data = await FinImage.create(body)
        return response.status(201).send(data)

      } catch (error) {
        throw new BadRequestException('Bad Request', 401, error)
      }
    }

    public async show({ auth, params, response }: HttpContextContract) {
      await auth.use('api').authenticate()
      try {
        const data = await FinImage.findOrFail(params.id)
        return response.status(200).send(data)
      } catch (error) {
        throw new BadRequestException('Bad Request', 401, error)
      }
    }


    public async update({auth,params, request, response }: HttpContextContract) {
      const authenticate =  await auth.use('api').authenticate()
          const body = request.only(FinImage.fillable)
          try {
            const data = await FinImage.query()
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
