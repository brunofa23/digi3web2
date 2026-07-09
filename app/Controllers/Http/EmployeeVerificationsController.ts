import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import EmployeeVerification from 'App/Models/EmployeeVerification'
import EmployeeVerificationValidator from 'App/Validators/EmployeeVerificationValidator'

export default class EmployeeVerificationsController {
  /**
   * GET /employee-verifications
   * Lista verificações de funcionários
   */
  public async index({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    const qs = request.qs()

    const local = qs.local ?? null
    const inactive = qs.inactive

    const query = EmployeeVerification.query()
      .where('companiesId', authenticate.companies_id)

    if (local) {
      query.where('local', local)
    }

    if (inactive !== undefined) {
      const boolInactive =
        inactive === true || inactive === 'true' || inactive === 1 || inactive === '1'
      query.where('inactive', boolInactive)
    }

    const data = await query
      .orderBy('description', 'asc')

    return response.ok(data)
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    const item = await EmployeeVerification.query()
      .where('id', params.id)
      .where('companiesId', authenticate.companies_id)
      .first()

    if (!item) {
      return response.status(404).json({ message: 'Registro não encontrado' })
    }

    return item
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    if (!authenticate.superuser) {
      return response.status(403).json({ message: 'Acesso permitido apenas para superusuário' })
    }

    const payload = await request.validate(EmployeeVerificationValidator)

    const item = await EmployeeVerification.create({
      ...payload,
      companiesId: authenticate.companies_id,
      inactive: payload.inactive ?? false,
    })

    return response.status(201).send(item)
  }

  public async update({ auth, params, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    if (!authenticate.superuser) {
      return response.status(403).json({ message: 'Acesso permitido apenas para superusuário' })
    }

    const payload = await request.validate(EmployeeVerificationValidator)

    const item = await EmployeeVerification.query()
      .where('id', params.id)
      .where('companiesId', authenticate.companies_id)
      .first()

    if (!item) {
      return response.status(404).json({ message: 'Registro não encontrado' })
    }

    item.merge({
      description: payload.description,
      local: payload.local,
      inactive: payload.inactive ?? false,
    })

    await item.save()
    return item
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    if (!authenticate.superuser) {
      return response.status(403).json({ message: 'Acesso permitido apenas para superusuário' })
    }

    const item = await EmployeeVerification.query()
      .where('id', params.id)
      .where('companiesId', authenticate.companies_id)
      .first()

    if (!item) {
      return response.status(404).json({ message: 'Registro não encontrado' })
    }

    await item.delete()
    return response.status(200).send({ message: 'Verificação removida com sucesso' })
  }
}
