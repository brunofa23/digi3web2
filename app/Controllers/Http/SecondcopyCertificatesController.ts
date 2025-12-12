import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import SecondcopyCertificate from 'App/Models/SecondcopyCertificate'
import SecondcopyCertificateValidator from 'App/Validators/SecondcopyCertificateValidator'

export default class SecondcopyCertificatesController {
  /**
   * Listagem
   */
  public async index({ auth, request }: HttpContextContract) {
    await auth.use('api').authenticate()
    const user = auth.user!

    const companiesId =
      (user as any).companiesId ?? (user as any).companies_id

    const page = request.input('page', 1)
    const perPage = request.input('perPage', 20)

    return SecondcopyCertificate.query()
      .where('companies_id', companiesId)
      .preload('documenttype')
      .preload('applicantPerson')
      .preload('registered1Person')
      .preload('registered2Person')
      .orderBy('id', 'desc')
      .paginate(page, perPage)
  }

  /**
   * Detalhe
   */
  public async show({ auth, params, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const user = auth.user!

    const companiesId =
      (user as any).companiesId ?? (user as any).companies_id

    const item = await SecondcopyCertificate.query()
      .where('id', params.id)
      .where('companies_id', companiesId)
      .preload('documenttype')
      .preload('applicantPerson')
      .preload('registered1Person')
      .preload('registered2Person')
      .first()

    if (!item) {
      return response.notFound({ message: 'Registro não encontrado' })
    }

    return item
  }

  /**
   * Criar
   */
  public async store({ auth, request, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const user = auth.user!

    const companiesId =
      (user as any).companiesId ?? (user as any).companies_id

    const payload = await request.validate(SecondcopyCertificateValidator)

    const item = await SecondcopyCertificate.create({
      companiesId,
      ...payload,
    })

    return response.created(item)
  }

  /**
   * Atualizar
   */
  public async update({ auth, params, request, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const user = auth.user!

    const companiesId =
      (user as any).companiesId ?? (user as any).companies_id

    const item = await SecondcopyCertificate.query()
      .where('id', params.id)
      .where('companies_id', companiesId)
      .first()

    if (!item) {
      return response.notFound({ message: 'Registro não encontrado' })
    }

    const payload = await request.validate(SecondcopyCertificateValidator)

    item.merge(payload)
    await item.save()

    return item
  }

  /**
   * Excluir
   */
  public async destroy({ auth, params, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const user = auth.user!

    const companiesId =
      (user as any).companiesId ?? (user as any).companies_id

    const item = await SecondcopyCertificate.query()
      .where('id', params.id)
      .where('companies_id', companiesId)
      .first()

    if (!item) {
      return response.notFound({ message: 'Registro não encontrado' })
    }

    await item.delete()
    return response.ok({ message: 'Excluído com sucesso' })
  }
}
