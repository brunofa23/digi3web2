import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BadRequestException from 'App/Exceptions/BadRequestException'
import FinAccount from 'App/Models/FinAccount'
import { currencyConverter } from "App/Services/util"
import { uploadFinImage } from 'App/Services/uploadFinImage/finImages'
export default class FinAccountsController {

  public async index({ auth, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    try {
      const data = await FinAccount.query()
      return response.status(200).send(data)
    } catch (error) {
      throw new BadRequestException('Bad Request', 401, error)
    }
  }


  public async show({ auth, params, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    try {
      const data = await FinAccount.findOrFail(params.id)
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
      console.log("passei aqui STORE 222@@@@", body2)
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
