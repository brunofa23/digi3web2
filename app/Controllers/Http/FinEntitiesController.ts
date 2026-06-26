import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Entity from 'App/Models/Entity'
import { schema } from '@ioc:Adonis/Core/Validator'
import BadRequestException from 'App/Exceptions/BadRequestException'
import { currencyConverter } from "App/Services/util"
export default class FinEntitiesController {

  private cleanUndefined(payload: Record<string, any>) {
    return Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined)
    )
  }

  private normalizeInput(input: Record<string, any>) {
    const normalized = { ...input }

    for (const key of ['description', 'responsible', 'phone', 'obs']) {
      if (typeof normalized[key] === 'string' && normalized[key].trim() === '') {
        normalized[key] = undefined
      }
    }

    if (normalized.fin_class_id === '' || normalized.fin_class_id === undefined) {
      normalized.fin_class_id = null
    }

    if (normalized.limit_amount === '' || normalized.limit_amount === undefined) {
      normalized.limit_amount = null
    } else if (typeof normalized.limit_amount === 'string') {
      normalized.limit_amount = Number(currencyConverter(normalized.limit_amount))
    }

    return normalized
  }

  public async index({ auth, request, response }) {
    const authenticate = await auth.use('api').authenticate()
    const {description} = request.only(['description'])
    try {
      const query = Entity.query()
        .where('companies_id', authenticate.companies_id)
        .preload('finclass', query => {
          query.select('id', 'description', 'debit_credit', 'cost', 'allocation', 'limit_amount')
        })
        .if(description, query=>{
          query.where('description','like',`%${description}%`)
        })
        const data = await query
      //.andWhere('inactive',false)
      return response.status(200).send(data)
    } catch (error) {
      throw new BadRequestException('Bad Request', 401, 'erro')
    }
  }


  public async store({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const querySchema = schema.create({
      companies_id: schema.number.optional(),
      fin_class_id: schema.number.nullableAndOptional(),
      description: schema.string.nullableAndOptional(),
      responsible: schema.string.nullableAndOptional(),
      phone: schema.string.nullableAndOptional(),
      obs: schema.string.nullableAndOptional(),
      inactive: schema.boolean.nullableAndOptional(),
      excluded: schema.boolean.nullableAndOptional(),
      limit_amount: schema.number.nullableAndOptional()
    })

    const input = this.normalizeInput(request.all())
    const body = await request.validate({
      schema: querySchema,
      data: input//request.body()
    })
    const payload = this.cleanUndefined({ ...body, companies_id: authenticate.companies_id }) as any
    try {
      const data = await Entity.create(payload)
      await data.load('finclass')
      return response.status(201).send(data)
    } catch (error) {
      throw new BadRequestException('Erro ao cadastrar entidade financeira', 400, error)
    }

  }


  public async update({ auth, params, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const querySchema = schema.create({
      companies_id: schema.number.optional(),
      fin_class_id: schema.number.nullableAndOptional(),
      description: schema.string.nullableAndOptional(),
      responsible: schema.string.nullableAndOptional(),
      phone: schema.string.nullableAndOptional(),
      obs: schema.string.nullableAndOptional(),
      inactive: schema.boolean.nullableAndOptional(),
      excluded: schema.boolean.nullableAndOptional(),
      limit_amount: schema.number.nullableAndOptional()
    })

    const input = this.normalizeInput(request.all())

    const body = await request.validate({
      schema: querySchema,
      data: input
    })
    const payload = this.cleanUndefined({ ...body, companies_id: authenticate.companies_id }) as any

    try {
      const data = await Entity.findOrFail(params.id)
      await data.merge(payload).save()
      await data.load('finclass')
      return response.status(201).send(data)
    } catch (error) {
      throw new BadRequestException('Erro ao atualizar entidade financeira', 400, error)
    }

  }

}
