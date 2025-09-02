import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Entity from 'App/Models/Entity'
import { schema } from '@ioc:Adonis/Core/Validator'
import BadRequestException from 'App/Exceptions/BadRequestException'
import { currencyConverter } from "App/Services/util"
export default class FinEntitiesController {

  public async index({ auth, response }) {
    const authenticate = await auth.use('api').authenticate()
    try {
      const data = await Entity.query()
        .where('companies_id', authenticate.companies_id)
      //.andWhere('inactive',false)
      return response.status(200).send(data)
    } catch (error) {
      throw new BadRequestException('Bad Request', 401, 'erro')
    }
  }


  public async store({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const querySchema = schema.create({
      description: schema.string.nullableAndOptional(),
      responsible: schema.string.nullableAndOptional(),
      phone: schema.string.nullableAndOptional(),
      obs: schema.string.nullableAndOptional(),
      inactive: schema.boolean.nullableAndOptional(),
      excluded: schema.boolean.nullableAndOptional(),
      limit_amount: schema.number.nullableAndOptional()
    })

    const input = request.all()
    if (input.limit_amount && typeof input.limit_amount === 'string') {
      input.limit_amount = Number(currencyConverter(input.limit_amount))
    }
    const body = await request.validate({
      schema: querySchema,
      data: input//request.body()
    })
    body.companies_id = authenticate.companies_id
    try {
      const data = await Entity.create(body)
      return response.status(201).send(data)
    } catch (error) {
      throw new BadRequestException('Bad Request', 401, error)
    }

  }


  public async update({ auth, params, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const querySchema = schema.create({
      description: schema.string.nullableAndOptional(),
      responsible: schema.string.nullableAndOptional(),
      phone: schema.string.nullableAndOptional(),
      obs: schema.string.nullableAndOptional(),
      inactive: schema.boolean.nullableAndOptional(),
      excluded: schema.boolean.nullableAndOptional(),
      limit_amount: schema.number.nullableAndOptional()
    })

    const input = request.all()
    if (input.limit_amount && typeof input.limit_amount === 'string') {
      input.limit_amount = Number(currencyConverter(input.limit_amount))
    }

    const body = await request.validate({
      schema: querySchema,
      data: input
    })
    body.companies_id = authenticate.companies_id

    try {
      const data = await Entity.findOrFail(params.id)
      data.merge(body).save()
      return response.status(201).send(data)
    } catch (error) {
      throw new BadRequestException('Bad Request', 401, error)
    }

  }

}
