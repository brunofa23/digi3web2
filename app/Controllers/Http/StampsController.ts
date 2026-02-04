// app/Controllers/Http/StampsController.ts
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Stamp from 'App/Models/Stamp'
import StampValidator from 'App/Validators/StampValidator'


export default class StampsController {
  /**
   * GET /stamps
   * Lista os stamps da empresa autenticada, com paginação
   * Query params opcionais: page, perPage
   */
  public async index({ auth, request }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    const { page = 1, perPage = 20 } = request.qs()

    const stamps = await Stamp.query()
      .where('companies_id', authenticate.companies_id)
      .orderBy('id', 'asc')
      .paginate(page, perPage)

    return stamps
  }

  /**
   * GET /stamps/:id
   */
  public async show({ auth, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    const stamp = await Stamp.query()
      .where('companies_id', authenticate.companies_id)
      .where('id', params.id)
      .first()

    if (!stamp) {
      return response.notFound({ message: 'Stamp não encontrado' })
    }

    return stamp
  }

  /**
   * POST /stamps
   */
  public async store({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    const data = await request.validate(StampValidator)

    const stamp = await Stamp.create({
      ...data,
      companies_id: authenticate.companies_id,
    })

    return response.created(stamp)
  }

  /**
   * PUT/PATCH /stamps/:id
   */
  public async update({ auth, params, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    const stamp = await Stamp.query()
      .where('companies_id', authenticate.companies_id)
      .where('id', params.id)
      .first()

    if (!stamp) {
      return response.notFound({ message: 'Stamp não encontrado' })
    }

    const data = await request.validate(StampValidator)

    stamp.merge(data)
    await stamp.save()

    return stamp
  }

  /**
   * DELETE /stamps/:id
   */
  public async destroy({ auth, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    const stamp = await Stamp.query()
      .where('companies_id', authenticate.companies_id)
      .where('id', params.id)
      .first()

    if (!stamp) {
      return response.notFound({ message: 'Stamp não encontrado' })
    }

    await stamp.delete()
    return response.noContent()
  }
}
