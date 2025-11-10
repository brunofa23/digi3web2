import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import MarriedCertificate from 'App/Models/MarriedCertificate'
import MarriedCertificateValidator from 'App/Validators/MarriedCertificateValidator'

export default class MarriedCertificatesController {
  /**
   * GET /married-certificates
   * Filtros opcionais:
   *  - statusId
   *  - type
   *  - prenup (true|false)
   *  - dateFrom/dateTo (aplica em dthrMarriage)
   * Paginação:
   *  - page (default 1), perPage (default 10, máx 100)
   */
  public async index({ request, auth }: HttpContextContract) {
    await auth.use('api').authenticate()
    const user = auth.user!
    const companiesId = (user as any).companiesId ?? (user as any).companies_id

    const page = Number(request.input('page', 1))
    const perPage = Math.min(Number(request.input('perPage', 10)), 100)

    const statusId = request.input('statusId') as number | undefined
    const type = request.input('type') as string | undefined
    const prenup = request.input('prenup') as string | boolean | undefined
    const dateFrom = request.input('dateFrom') as string | undefined // yyyy-MM-dd
    const dateTo = request.input('dateTo') as string | undefined     // yyyy-MM-dd

    const query = MarriedCertificate.query()
      .where('companies_id', companiesId)
      .orderBy('id', 'desc')

    if (statusId) query.where('status_id', statusId)
    if (type) query.where('type', 'like', `%${type}%`)

    if (typeof prenup !== 'undefined') {
      const prenupBool =
        typeof prenup === 'string' ? prenup === 'true' : Boolean(prenup)
      query.where('prenup', prenupBool)
    }

    // filtro por intervalo de casamento (dthr_marriage)
    if (dateFrom) query.whereRaw('DATE(dthr_marriage) >= ?', [dateFrom])
    if (dateTo) query.whereRaw('DATE(dthr_marriage) <= ?', [dateTo])

    // Carregamento leve — ajuste conforme a necessidade
    // query.preload('groom').preload('bride').preload('status')

    return await query.paginate(page, perPage)
  }

  /** GET /married-certificates/:id */
  public async show({ params, auth, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const user = auth.user!
    const companiesId = (user as any).companiesId ?? (user as any).companies_id

    const item = await MarriedCertificate.query()
      .where('companies_id', companiesId)
      .where('id', params.id)
      .preload('groom')
      .preload('fatherGroom')
      .preload('motherGroom')
      .preload('bride')
      .preload('fatherBride')
      .preload('motherBride')
      .preload('witness1')
      .preload('witness2')

      .preload('status')
      .first()

    if (!item) {
      return response.notFound({ message: 'Registro não encontrado' })
    }

    return item
  }

  /** POST /married-certificates */
  public async store({ request, auth, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const user = auth.user!
    const companiesId = (user as any).companiesId ?? (user as any).companies_id

    const payload = await request.validate(MarriedCertificateValidator)

    const item = await MarriedCertificate.create({
      ...payload,
      companiesId,            // sempre da sessão
      usrId: (user as any).id // responsável é o usuário autenticado
    })

    return response.created(item)
  }

  /** PATCH/PUT /married-certificates/:id */
  public async update({ params, request, auth, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const user = auth.user!
    const companiesId = (user as any).companiesId ?? (user as any).companies_id

    const item = await MarriedCertificate.query()
      .where('companies_id', companiesId)
      .where('id', params.id)
      .first()

    if (!item) {
      return response.notFound({ message: 'Registro não encontrado' })
    }

    const payload = await request.validate(MarriedCertificateValidator)

    // companiesId e usrId NÃO vêm do body
    item.merge({
      ...payload,
      // opcional: atualizar usuário responsável em updates
      // usrId: (user as any).id,
    })
    await item.save()

    return item
  }

  /** DELETE /married-certificates/:id */
  public async destroy({ params, auth, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const user = auth.user!
    const companiesId = (user as any).companiesId ?? (user as any).companies_id

    const item = await MarriedCertificate.query()
      .where('companies_id', companiesId)
      .where('id', params.id)
      .first()

    if (!item) {
      return response.notFound({ message: 'Registro não encontrado' })
    }

    await item.delete()
    return response.ok({ message: 'Registro removido com sucesso' })
  }
}
