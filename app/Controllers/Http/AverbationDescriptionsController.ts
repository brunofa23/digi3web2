import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import AverbationDescription from 'App/Models/AverbationDescription'
import { verifyPermission } from 'App/Services/util'

export default class AverbationDescriptionsController {
  private async allowed(auth: HttpContextContract['auth']) {
    const user = await auth.use('api').authenticate()
    const permissions = auth.use('api').token?.meta.payload.permissions || []
    return { user, granted: verifyPermission(Boolean(user.superuser), permissions, 49) }
  }

  public async index({ auth }: HttpContextContract) {
    const user = await auth.use('api').authenticate()

    return AverbationDescription.query()
      .where('companies_id', user.companies_id)
      .orderBy('id', 'asc')
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const { user, granted } = await this.allowed(auth)
    if (!granted) return response.forbidden({ message: 'Sem permissão para descrições de averbações' })

    const payload = await request.validate({ schema: schema.create({
      name: schema.string({ trim: true }, [rules.maxLength(255)]),
      description: schema.string.optional(),
      inactive: schema.boolean.optional(),
    }) })

    const item = await AverbationDescription.create({ ...payload, description: payload.description ?? '', companiesId: user.companies_id })
    return response.created(item)
  }

  public async update({ auth, params, request, response }: HttpContextContract) {
    const { user, granted } = await this.allowed(auth)
    if (!granted) return response.forbidden({ message: 'Sem permissão para descrições de averbações' })

    const item = await AverbationDescription.query()
      .where('id', params.id)
      .where('companies_id', user.companies_id)
      .first()
    if (!item) return response.notFound({ message: 'Descrição de averbação não encontrada' })

    const payload = await request.validate({ schema: schema.create({
      name: schema.string({ trim: true }, [rules.maxLength(255)]),
      description: schema.string.optional(),
      inactive: schema.boolean(),
    }) })
    item.merge({ ...payload, description: payload.description ?? '' })
    await item.save()
    return item
  }
}
