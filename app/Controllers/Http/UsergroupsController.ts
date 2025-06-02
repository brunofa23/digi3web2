import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BadRequestException from 'App/Exceptions/BadRequestException'
import Usergroup from 'App/Models/Usergroup'
export default class UsergroupsController {

  public async index({ auth, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    //const body = request.only(Usergroup.fillable)
    try {
      const data = await Usergroup.query()
        .where('inactive', false)
        .orderBy('name')
      return response.ok(data)

    } catch (error) {
      throw new BadRequestException('Erro ao buscar lançamentos', 401, error)
    }
  }
}
