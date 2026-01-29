// app/Controllers/Http/EmolumentsController.ts
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { currencyConverter } from "App/Services/util"
import Emolument from 'App/Models/Emolument'
import EmolumentValidator from 'App/Validators/EmolumentValidator'
import EmolumentUpdateValidator from 'App/Validators/EmolumentValidator'

export default class EmolumentsController {
  public async index({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    const page = Number(request.input('page', 1))
    const perPage = Number(request.input('perPage', 500))
    const q = String(request.input('q', '')).trim()
    const type = String(request.input('type', '')).trim()

    const query = Emolument.query()
      .where('companies_id', authenticate.companies_id)
      .orderBy('name', 'asc')

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

  public async show({ auth, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    const item = await Emolument.query()
      .where('companies_id', authenticate.companies_id)
      .where('id', params.id)
      .firstOrFail()

    return response.ok(item)
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    // valida payload, mas não confia no companiesId do client
    const payload = await request.validate(EmolumentValidator)

    const item = await Emolument.create({
      companiesId: authenticate.companies_id, // força empresa da sessão
      name: payload.name,
      description: payload.description ?? null,
      price:await currencyConverter(payload.price),// !== undefined ? payload.price.toFixed(2) : null,
      code: payload.code ?? null,
      type: payload.type,
      inactive: payload.inactive
    })

    return response.created(item)
  }

  public async update({ auth, params, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()


    const payload = await request.validate(EmolumentUpdateValidator)

    const item = await Emolument.query()
    .where('companies_id', authenticate.companies_id)
    .where('id', params.id)
    .firstOrFail()

    // nunca permitir trocar companies_id pelo payload
    const data = {
      ...payload,
      companiesId: undefined,
      price: await currencyConverter(payload.price)
      //price: payload.price !== undefined ? payload.price.toFixed(2) : undefined,
    }

    item.merge(data)
    await item.save()

    return response.ok(item)
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    const item = await Emolument.query()
      .where('companies_id', authenticate.companies_id)
      .where('id', params.id)
      .firstOrFail()

    await item.delete()
    return response.noContent()
  }
}
