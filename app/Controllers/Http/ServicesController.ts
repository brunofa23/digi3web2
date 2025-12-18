// app/Controllers/Http/ServicesController.ts
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Service from 'App/Models/Service'
import Emolument from 'App/Models/Emolument'
import ServiceValidator from 'App/Validators/ServiceValidator'
import BadRequestException from 'App/Exceptions/BadRequestException'

export default class ServicesController {
  public async index({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    try {
      const query = Service.query()
        .where('companies_id', authenticate.companies_id)
        .orderBy('name', 'asc')

      // opcional: filtro por inactive (true/false)
      const inactive = request.input('inactive')
      if (inactive !== undefined) {
        const boolInactive =
          inactive === true || inactive === 'true' || inactive === 1 || inactive === '1'
        query.where('inactive', boolInactive)
      }

      const items = await query
      return response.status(200).send(items)
    } catch (error) {
      throw new BadRequestException('Bad Request', 400, 'erro ao listar serviços')
    }
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    try {
      const item = await Service.query()
        .where('companies_id', authenticate.companies_id)
        .where('id', params.id)
        .firstOrFail()

      return response.status(200).send(item)
    } catch (error) {
      throw new BadRequestException('Bad Request', 404, 'serviço não encontrado')
    }
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    try {
      const payload = await request.validate(ServiceValidator)

      const item = await Service.create({
        ...payload,
        companiesId: authenticate.companies_id, // sempre da sessão
      })

      return response.status(201).send(item)
    } catch (error) {
      throw new BadRequestException('Bad Request', 400, 'erro ao criar serviço')
    }
  }

  public async update({ auth, params, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    try {
      const payload = await request.validate(ServiceValidator)

      const item = await Service.query()
        .where('companies_id', authenticate.companies_id)
        .where('id', params.id)
        .firstOrFail()

      item.merge({
        ...payload,
        companiesId: authenticate.companies_id, // garante que não troca empresa
      })

      await item.save()
      return response.status(200).send(item)
    } catch (error) {
      throw new BadRequestException('Bad Request', 400, 'erro ao atualizar serviço')
    }
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    try {
      const item = await Service.query()
        .where('companies_id', authenticate.companies_id)
        .where('id', params.id)
        .firstOrFail()

      await item.delete()
      return response.status(200).send({ message: 'Serviço removido com sucesso' })
    } catch (error) {
      throw new BadRequestException('Bad Request', 400, 'erro ao remover serviço')
    }
  }


  public async syncEmoluments({ auth, params, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const companiesId = authenticate.companies_id

    const emolumentIds: number[] = request.input('emolumentIds', [])

    // 1) garante que o service é da empresa
    const service = await Service.query()
      .where('id', params.id) // service_id vem da rota
      .where('companies_id', companiesId)
      .firstOrFail()

    // 2) garante que todos emoluments pertencem à mesma empresa
    const valid = await Emolument.query()
      .where('companies_id', companiesId)
      .whereIn('id', emolumentIds)
      .select('id')

    const validIds = valid.map((e) => e.id)

    if (validIds.length !== emolumentIds.length) {
      return response.unprocessableEntity({
        message: 'Existem emoluments inválidos para esta empresa.',
      })
    }

    // 3) salva na pivô (estado final)
    const payload = validIds.reduce<Record<number, any>>((acc, id) => {
      acc[id] = { companies_id: companiesId } // preenche pivot
      return acc
    }, {})

    console.log(payload)

    await service.related('emoluments').sync(payload)
    return response.ok({ message: 'Emoluments vinculados ao service com sucesso.' })
  }




}
