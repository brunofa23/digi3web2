import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Service from 'App/Models/Service'
import Emolument from 'App/Models/Emolument'

export default class ServiceEmolumentsController {
  // GET /services/:id/emoluments
  public async index({ auth, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    const service = await Service.query()
      .where('id', params.id)
      .where('companies_id', authenticate.companies_id)
      .firstOrFail()

    await service.load('emoluments', (q) => {
      q.where('companies_id', authenticate.companies_id).orderBy('name')
    })

    return response.ok(service.emoluments)
  }

  // POST /services/:id/emoluments  body: { emolumentIds: number[] }
  public async store({ auth, params, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const emolumentIds: number[] = request.input('emolumentIds', [])

    const service = await Service.query()
      .where('id', params.id)
      .where('companies_id', authenticate.companies_id)
      .firstOrFail()

    // garante que só ids da empresa entram
    const validIds = await Emolument.query()
      .where('companies_id', authenticate.companies_id)
      .whereIn('id', emolumentIds)
      .select('id')

    await service.related('emoluments').attach(
      validIds.map((e) => e.id),
      (pivotRow) => {
        pivotRow.companies_id = authenticate.companies_id
      }
    )

    return response.ok({ message: 'Vínculos criados com sucesso' })
  }

  // DELETE /services/:id/emoluments/:emolumentId
  public async destroy({ auth, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    const service = await Service.query()
      .where('id', params.id)
      .where('companies_id', authenticate.companies_id)
      .firstOrFail()

    await service.related('emoluments').detach([Number(params.emolumentId)])

    return response.ok({ message: 'Vínculo removido com sucesso' })
  }
}
