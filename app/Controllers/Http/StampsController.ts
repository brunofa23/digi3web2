// app/Controllers/Http/StampsController.ts
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Stamp from 'App/Models/Stamp'
import StampStoreValidator from 'App/Validators/StampStoreValidator'
import StampUpdateValidator from 'App/Validators/StampUpdateValidator'

export default class StampsController {
  /**
   * GET /stamps
   * Query params opcionais: page, perPage, companies_id
   */
  public async index({ request }: HttpContextContract) {
    const { page = 1, perPage = 20, companies_id } = request.qs()

    const query = Stamp.query()

    if (companies_id) {
      query.where('companies_id', companies_id)
    }

    const stamps = await query.paginate(page, perPage)
    return stamps
  }

  /**
   * GET /stamps/:id
   */
  public async show({ params, response }: HttpContextContract) {
    const stamp = await Stamp.find(params.id)

    if (!stamp) {
      return response.notFound({ message: 'Stamp não encontrado' })
    }

    return stamp
  }

  /**
   * POST /stamps
   */
  public async store({ request, response }: HttpContextContract) {
    const data = await request.validate(StampStoreValidator)

    const stamp = await Stamp.create(data)

    return response.created(stamp)
  }

  /**
   * PUT/PATCH /stamps/:id
   */
  public async update({ params, request, response }: HttpContextContract) {
    const stamp = await Stamp.find(params.id)

    if (!stamp) {
      return response.notFound({ message: 'Stamp não encontrado' })
    }

    const data = await request.validate(StampUpdateValidator)

    stamp.merge(data)
    await stamp.save()

    return stamp
  }

  /**
   * DELETE /stamps/:id
   */
  public async destroy({ params, response }: HttpContextContract) {
    const stamp = await Stamp.find(params.id)

    if (!stamp) {
      return response.notFound({ message: 'Stamp não encontrado' })
    }

    await stamp.delete()
    return response.noContent()
  }
}
