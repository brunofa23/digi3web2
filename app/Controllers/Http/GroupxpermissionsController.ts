import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BadRequestException from 'App/Exceptions/BadRequestException'
import Groupxpermission from 'App/Models/Groupxpermission'

export default class GroupxpermissionsController {

   public async index({ auth, response }: HttpContextContract) {
      const authenticate = await auth.use('api').authenticate()
      try {
        const data = await Groupxpermission.query()
          .where('excluded', false)
        return response.status(200).send(data)
      } catch (error) {
        throw new BadRequestException('Bad Request', 401, error)
      }
    }


    public async store({ auth, request, response }: HttpContextContract) {
      // const authenticate = await auth.use('api').authenticate()
      // const body = request.only(FinEmp.fillable)
      // body.companies_id = authenticate.companies_id
      // try {
      //   const data = await FinEmp.create(body)
      //   return response.status(201).send(data)

      // } catch (error) {
      //   throw new BadRequestException('Bad Request', 401, error)
      // }
    }



}
