// app/Controllers/Http/ReceiptItemsController.ts
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import ReceiptItem from 'App/Models/ReceiptItem'
import ReceiptItemValidator from 'App/Validators/ReceiptitemValidator'
import BadRequestException from 'App/Exceptions/BadRequestException'


export default class ReceiptItemsController {
  public async index({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    const { receiptId, serviceId, emolumentId } = request.qs()

    const query = ReceiptItem.query()
      .where('companies_id', authenticate.companies_id)
      .preload('service')
      .preload('emolument')
      .preload('receipt')
      .orderBy('id', 'desc')

    if (receiptId) query.where('receipt_id', receiptId)
    if (serviceId) query.where('service_id', serviceId)
    if (emolumentId) query.where('emolument_id', emolumentId)

    const items = await query
    return response.status(200).send(items)
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    const item = await ReceiptItem.query()
      .where('companies_id', authenticate.companies_id)
      .where('id', params.id)
      .preload('service')
      .preload('emolument')
      .preload('receipt')
      .firstOrFail()

    return response.status(200).send(item)
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    try {
      const payload = await request.validate(ReceiptItemValidator)

      const item = await ReceiptItem.create({
        companiesId: authenticate.companies_id,
        receiptId: payload.receiptId,
        serviceId: payload.serviceId,
        emolumentId: payload.emolumentId,
        qtde: payload.qtde ?? 0,
        amount: payload.amount ?? 0, //await currencyConverter(body.amount)
      })

      await item.load('service')
      await item.load('emolument')
      await item.load('receipt')

      return response.status(201).send(item)
    } catch (error) {
      throw new BadRequestException('Bad Request', 400, error?.messages ?? error)
    }
  }

  public async update({ auth, request, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    try {
      const payload = await request.validate(ReceiptItemValidator)

      const item = await ReceiptItem.query()
        .where('companies_id', authenticate.companies_id)
        .where('id', params.id)
        .firstOrFail()

      item.receiptId = payload.receiptId
      item.serviceId = payload.serviceId
      item.emolumentId = payload.emolumentId
      item.qtde = payload.qtde ?? item.qtde
      item.amount = payload.amount ?? item.amount

      await item.save()

      await item.load('service')
      await item.load('emolument')
      await item.load('receipt')

      return response.status(200).send(item)
    } catch (error) {
      throw new BadRequestException('Bad Request', 400, error?.messages ?? error)
    }
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    const item = await ReceiptItem.query()
      .where('companies_id', authenticate.companies_id)
      .where('id', params.id)
      .firstOrFail()

    await item.delete()
    return response.status(200).send({ message: 'Registro removido com sucesso' })
  }
}
