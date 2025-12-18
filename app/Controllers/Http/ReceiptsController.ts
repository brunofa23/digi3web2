// app/Controllers/Http/ReceiptsController.ts
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Receipt from 'App/Models/Receipt'
import ReceiptValidator from 'App/Validators/ReceiptValidator'
import { BadRequestException } from '@adonisjs/core/build/standalone'

export default class ReceiptsController {
  public async index({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    try {
      const page = Number(request.input('page', 1))
      const perPage = Number(request.input('perPage', 20))

      const query = Receipt.query()
        .where('companies_id', authenticate.companies_id)
        .preload('service')
        .preload('orderCertificate')
        .preload('user')
        .preload('typebook')
        .orderBy('id', 'desc')

      // filtros opcionais
      const orderCertificateId = request.input('orderCertificateId')
      if (orderCertificateId) query.where('order_certificate_id', orderCertificateId)

      const serviceId = request.input('serviceId')
      if (serviceId) query.where('service_id', serviceId)

      const status = request.input('status')
      if (status) query.where('status', status)

      const results = await query.paginate(page, perPage)
      return response.status(200).send(results)
    } catch (error) {
      throw new BadRequestException('Bad Request', 401, 'erro')
    }
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    try {
      const receipt = await Receipt.query()
        .where('companies_id', authenticate.companies_id)
        .where('id', params.id)
        .preload('service')
        .preload('orderCertificate')
        .preload('user')
        .preload('typebook')
        .firstOrFail()

      return response.status(200).send(receipt)
    } catch (error) {
      throw new BadRequestException('Bad Request', 401, 'erro')
    }
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    try {
      const payload = await request.validate(ReceiptValidator)

      const receipt = await Receipt.create({
        ...payload,
        // força companiesId e userId pelo token
        companiesId: authenticate.companies_id,
        userId: authenticate.id,
      })

      await receipt.refresh()
      await receipt.load('service')
      await receipt.load('orderCertificate')
      await receipt.load('user')
      await receipt.load('typebook')

      return response.status(201).send(receipt)
    } catch (error) {
      throw error
    }
  }

  public async update({ auth, request, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    try {
      const receipt = await Receipt.query()
        .where('companies_id', authenticate.companies_id)
        .where('id', params.id)
        .firstOrFail()

      const payload = await request.validate(ReceiptValidator)

      receipt.merge({
        ...payload,
        companiesId: authenticate.companies_id,
        userId: authenticate.id,
      })

      await receipt.save()
      await receipt.refresh()
      await receipt.load('service')
      await receipt.load('orderCertificate')
      await receipt.load('user')
      await receipt.load('typebook')

      return response.status(200).send(receipt)
    } catch (error) {
      throw error
    }
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    try {
      const receipt = await Receipt.query()
        .where('companies_id', authenticate.companies_id)
        .where('id', params.id)
        .firstOrFail()

      await receipt.delete()
      return response.status(200).send({ message: 'Registro removido com sucesso' })
    } catch (error) {
      throw new BadRequestException('Bad Request', 401, 'erro')
    }
  }
}
