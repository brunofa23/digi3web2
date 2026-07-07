import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Situation from 'App/Models/Situation'

export default class SituationsController {
  public async index({ auth }: HttpContextContract) {
    await auth.use('api').authenticate()

    return await Situation
      .query()
      .where('inactive', false)
      .orderBy('id', 'asc')
  }
}
