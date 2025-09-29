import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BadRequestException from 'App/Exceptions/BadRequestException'
import FinClass from 'App/Models/FinClass'
import FinnClassStoreValidator from 'App/Validators/FinnClassStoreValidator'
import { currencyConverter } from "App/Services/util"
import { schema } from '@ioc:Adonis/Core/Validator'
export default class FinClassesController {

  public async index({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const querySchema = schema.create({
      fin_emp_id: schema.number.optional(),
      description: schema.string.optional(),
      excluded: schema.boolean.optional(),
      inactive: schema.boolean.optional(),
      debit_credit: schema.string.optional(),
      cost: schema.string.optional(),
      limit_amount: schema.number.optional(),
    })

    const body = await request.validate({
      schema: querySchema,
      data: request.qs()
    })

    try {
      const query = FinClass.query()
        .where('companies_id', authenticate.companies_id)
        .preload('finemp', query => {
          query.select('id', 'name')
        })
        .if(body.fin_emp_id, (q) => {
          q.where((subQuery) => {
            subQuery.where('fin_emp_id', body.fin_emp_id).orWhereNull('fin_emp_id')
          })
        })
        .if(body.description, q => {
          q.where('description', 'like', `%${body.description}%`)
        })
        .if(body.debit_credit, q => {
          q.where('debit_credit', body.debit_credit)
        })
        .if(body.excluded, q => {
          q.where('excluded', true)
        })
        .if(body.inactive, q => {
          q.where('inactive', true)
        })
      const data = await query
      return response.status(200).send(data)
    } catch (error) {
      throw new BadRequestException('Bad Request', 401, error)
    }
  }


  public async store({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const input = request.all()
    // Se vier como string tipo '100,00', converte
    if (input.limit_amount && typeof input.limit_amount === 'string') {
      input.limit_amount = Number(currencyConverter(input.limit_amount))
    }
    input.companies_id = authenticate.companies_id
    const body = await request.validate({
      schema: new FinnClassStoreValidator().schema,
      data: input,
    })

    try {
      const data = await FinClass.create(body)
      return response.status(201).send(data)

    } catch (error) {
      throw new BadRequestException('Bad Request', 401, error)
    }
  }

  public async show({ auth, params, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    try {
      const data = await FinClass.findOrFail(params.id)
      return response.status(200).send(data)
    } catch (error) {
      throw new BadRequestException('Bad Request', 401, error)
    }
  }


  public async update({ auth, params, request, response }: HttpContextContract) {

    const authenticate = await auth.use('api').authenticate()
    const input = request.all()
    // Se vier como string tipo '100,00', converte
    if (input.limit_amount && typeof input.limit_amount === 'string') {
      input.limit_amount = Number(currencyConverter(input.limit_amount))
    }
    const body = await request.validate({
      schema: new FinnClassStoreValidator().schema,
      data: input,
    })

    try {
      await FinClass.query()
        .where('companies_id', authenticate.companies_id)
        .andWhere('id', params.id)
        .update(body)
      const data = await FinClass.findOrFail(params.id)
      await data.load('finemp')
      return response.status(201).send(data)

    } catch (error) {
      throw new BadRequestException('Bad Request', 401, error)
    }

  }

  public async destroy({ }: HttpContextContract) { }
}
