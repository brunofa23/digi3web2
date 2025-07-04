import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Entity from 'App/Models/Entity'
import { schema } from '@ioc:Adonis/Core/Validator'
import BadRequestException from 'App/Exceptions/BadRequestException'

export default class FinEntitiesController {

  public async index({ auth, response }) {
    console.log("teste")
    return
    await auth.use('api').authenticate()
    try {
      const data = await Entity.query()
      return response.status(200).send(data)
    } catch (error) {
      throw new BadRequestException('Bad Request', 401, 'erro')
    }
  }


  public async store({ auth, request, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const querySchema = schema.create({
      description: schema.string.nullableAndOptional(),
      responsible: schema.string.nullableAndOptional(),
      phone: schema.string.nullableAndOptional(),
      obs: schema.string.nullableAndOptional(),
      inactive: schema.boolean.nullableAndOptional()
    })

    const body = request.validate({
      schema: querySchema,
      data: request.qs()
    })
    try {
      const data = await Entity.create(body)
      return response.status(201).send(body)
    } catch (error) {
      throw new BadRequestException('Bad Request', 401, error)
    }

  }


  public async update({ auth, request, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const querySchema = schema.create({
      description: schema.string.nullableAndOptional(),
      responsible: schema.string.nullableAndOptional(),
      phone: schema.string.nullableAndOptional(),
      obs: schema.string.nullableAndOptional(),
    })

    const body = request.validate({
      schema: querySchema,
      data: request.qs()
    })
    // try {
    //   // const data = await Entity.
    //   // return response.status(201).send(body)
    // } catch (error) {
    //   throw new BadRequestException('Bad Request', 401, error)
    // }

  }





}
