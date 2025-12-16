// app/Controllers/Http/EmolumentsController.ts
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Emolument from 'App/Models/Emolument'
import EmolumentValidator from 'App/Validators/EmolumentValidator'
import EmolumentUpdateValidator from 'App/Validators/EmolumentUpdateValidator'

export default class EmolumentsController {
  /**
   * GET /emoluments
   * query:
   *  - q, type, page, perPage
   */
  public async index({ request, response }: HttpContextContract) {
    const page = Number(request.input('page', 1))
    const perPage = Number(request.input('perPage', 20))
    const q = String(request.input('q', '')).trim()
    const type = String(request.input('type', '')).trim()

    const query = Emolument.query().orderBy('name', 'asc')

    if (type) query.where('type', type)

    if (q) {
      query.where((builder) => {
        builder
          .whereILike('name', `%${q}%`)
          .orWhereILike('description', `%${q}%`)
          .orWhereILike('code', `%${q}%`)
          .orWhereILike('type', `%${q}%`)
      })
    }

    const data = await query.paginate(page, perPage)
    return response.ok(data)
  }

  /**
   * GET /emoluments/:id
   */
  public async show({ params, response }: HttpContextContract) {
    const item = await Emolument.findOrFail(params.id)
    return response.ok(item)
  }

  /**
   * POST /emoluments
   */
  public async store({ request, response }: HttpContextContract) {
    const payload = await request.validate(EmolumentValidator)

    const item = await Emolument.create({
      name: payload.name,
      description: payload.description ?? null,
      price: payload.price !== undefined ? payload.price.toFixed(2) : null,
      code: payload.code ?? null,
      type: payload.type,
    })

    return response.created(item)
  }

  /**
   * PUT/PATCH /emoluments/:id
   */
  public async update({ params, request, response }: HttpContextContract) {
    const payload = await request.validate(EmolumentUpdateValidator)

    const item = await Emolument.findOrFail(params.id)

    if (payload.name !== undefined) item.name = payload.name
    if (payload.description !== undefined) item.description = payload.description ?? null
    if (payload.price !== undefined) item.price = payload.price.toFixed(2)
    if (payload.code !== undefined) item.code = payload.code ?? null
    if (payload.type !== undefined) item.type = payload.type

    await item.save()
    return response.ok(item)
  }

  /**
   * DELETE /emoluments/:id
   */
  public async destroy({ params, response }: HttpContextContract) {
    const item = await Emolument.findOrFail(params.id)
    await item.delete()
    return response.noContent()
  }
}
