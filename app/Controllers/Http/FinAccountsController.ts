import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BadRequestException from 'App/Exceptions/BadRequestException'
import FinAccount from 'App/Models/FinAccount'
import { currencyConverter } from "App/Services/util"
import { uploadFinImage } from 'App/Services/uploadFinImage/finImages'
export default class FinAccountsController {

  public async index({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const body = request.qs()
    try {
      const query = FinAccount.query()
        .where('companies_id', authenticate.companies_id)
        .preload('finclass', query => {
          query.select('description')
        })

      if (body.description)
        query.where('description', 'like', `${body.description}`)
      if (body.fin_emp_id)
        query.where('fin_emp_id', body.fin_emp_id)
      if (body.fin_class_id)
        query.where('fin_class_id', body.fin_class_id)
      if (body.date_start)
        query.where('created_at', '>=', body.date_start)
      if (body.date_end)
        query.where('created_at', '<=', body.date_end)

      const data = await query

      return response.status(200).send(data)
    } catch (error) {
      throw new BadRequestException('Bad Request', 401, error)
    }
  }


  public async show({ auth, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    try {
      const data = await FinAccount.query()
        .where('id', params.id)
        .andWhere('companies_id', authenticate.companies_id)
      return response.status(200).send(data)
    } catch (error) {
      throw new BadRequestException('Bad Request', 401, error)
    }
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const body = request.only(FinAccount.fillable)
    const body2 = {
      ...body, companies_id: authenticate.companies_id,
      amount: await currencyConverter(body.amount)
    }

    try {
      const data = await FinAccount.create(body2)
      await uploadFinImage(authenticate.companies_id, data.id, request)
      return response.status(201).send(data)

    } catch (error) {
      throw new BadRequestException('Bad Request', 401, error)
    }
  }


  public async update({ auth, params, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const body = request.only(FinAccount.fillable)

    // const image = request.file('file', {
    //   size: '8mb',
    //   extnames: ['jpg', 'png', 'jpeg', 'pdf', 'xls', 'JPG', 'PNG', 'JPEG', 'PDF', 'XLS'],
    // });
    // console.log("passei aqui 444444$$$$$$",request )

    const body2 = { ...body, amount: await currencyConverter(body.amount) }
    try {
      const data = await FinAccount.query()
        .where('companies_id', authenticate.companies_id)
        .andWhere('id', params.id)
        .update(body2)
      return response.status(201).send(data)
    } catch (error) {
      throw new BadRequestException('Bad Request', 401, error)
    }

  }

  public async destroy({ }: HttpContextContract) { }


}
