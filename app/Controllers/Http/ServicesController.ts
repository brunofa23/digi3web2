// app/Controllers/Http/ServicesController.ts
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Service from 'App/Models/Service'
import ServiceValidator from 'App/Validators/ServiceValidator'
import { BadRequest } from 'App/Exceptions/BadRequest'

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
      throw new BadRequest('Bad Request', 400, 'erro ao listar serviços')
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
      throw new BadRequest('Bad Request', 404, 'serviço não encontrado')
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
      throw new BadRequest('Bad Request', 400, 'erro ao criar serviço')
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
      throw new BadRequest('Bad Request', 400, 'erro ao atualizar serviço')
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
      throw new BadRequest('Bad Request', 400, 'erro ao remover serviço')
    }
  }
}
