import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Status from 'App/Models/Status'
import { schema, rules } from '@ioc:Adonis/Core/Validator'

export default class StatusesController {
  /**
   * Lista todos os status
   */
  public async index({auth}: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    return await Status.query().orderBy('id', 'asc')
  }

  /**
   * Mostra um status pelo ID
   */
  public async show({ params, response }: HttpContextContract) {
    const status = await Status.find(params.id)

    if (!status) {
      return response.notFound({ message: 'Status não encontrado' })
    }

    return status
  }

  /**
   * Cria um novo status
   */
  public async store({ request, response }: HttpContextContract) {
    const validationSchema = schema.create({
      description: schema.string({ trim: true }, [
        rules.maxLength(255),
      ]),
      inactive: schema.boolean.optional(),
    })

    const payload = await request.validate({ schema: validationSchema })

    const status = await Status.create(payload)

    return response.created(status)
  }

  /**
   * Atualiza um status existente
   */
  public async update({ params, request, response }: HttpContextContract) {
    const status = await Status.find(params.id)

    if (!status) {
      return response.notFound({ message: 'Status não encontrado' })
    }

    const validationSchema = schema.create({
      description: schema.string.optional({ trim: true }, [
        rules.maxLength(255),
      ]),
      inactive: schema.boolean.optional(),
    })

    const payload = await request.validate({ schema: validationSchema })

    status.merge(payload)
    await status.save()

    return status
  }

  /**
   * Deleta um status
   */
  public async destroy({ params, response }: HttpContextContract) {
    const status = await Status.find(params.id)

    if (!status) {
      return response.notFound({ message: 'Status não encontrado' })
    }

    await status.delete()

    return response.ok({ message: 'Status removido com sucesso' })
  }
}
