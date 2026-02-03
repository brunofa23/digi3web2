// app/Controllers/Http/TributationsController.ts
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Tributation from 'App/Models/Tributation'

export default class TributationsController {
  /**
   * GET /tributations
   * Lista todas as tributações
   */
  public async index({}: HttpContextContract) {
    const tributations = await Tributation.all()
    return tributations
  }

  /**
   * POST /tributations
   * Cria uma nova tributação
   */
  public async store({ request }: HttpContextContract) {
    const data = request.only(['companies_id', 'description', 'inactive'])

    const tributation = await Tributation.create({
      companiesId: data.companies_id,
      description: data.description,
      inactive: data.inactive ?? false,
    })

    return tributation
  }

  /**
   * GET /tributations/:id
   * Mostra uma tributação específica
   */
  public async show({ params }: HttpContextContract) {
    const tributation = await Tributation.findOrFail(params.id)
    return tributation
  }

  /**
   * PUT/PATCH /tributations/:id
   * Atualiza uma tributação
   */
  public async update({ params, request }: HttpContextContract) {
    const tributation = await Tributation.findOrFail(params.id)

    const data = request.only(['companies_id', 'description', 'inactive'])

    tributation.merge({
      companiesId: data.companies_id ?? tributation.companiesId,
      description: data.description ?? tributation.description,
      inactive: typeof data.inactive === 'boolean' ? data.inactive : tributation.inactive,
    })

    await tributation.save()

    return tributation
  }

  /**
   * DELETE /tributations/:id
   * Remove uma tributação
   */
  public async destroy({ params, response }: HttpContextContract) {
    const tributation = await Tributation.findOrFail(params.id)
    await tributation.delete()
    return response.noContent()
  }
}
