// app/Controllers/Http/ReceiptsController.ts
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import Receipt from 'App/Models/Receipt'
import ReceiptValidator from 'App/Validators/ReceiptValidator'
import EmployeeVerificationXReceipt from 'App/Models/EmployeeVerificationXReceipt'
import BadRequestException from 'App/Exceptions/BadRequestException'
import { DateTime } from 'luxon'

type ReceiptItemPayload = {
  emolumentId: number
  qtde?: number
  amount?: number
}

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
        .preload('items', (itemsQuery) => {
          itemsQuery.preload('emolument').orderBy('id', 'asc')
        })
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
        .preload('items', (itemsQuery) => {
          itemsQuery.preload('emolument').orderBy('id', 'asc')
        })
        .firstOrFail()

      return response.status(200).send(receipt)
    } catch (error) {
      throw new BadRequestException('Bad Request', 401, 'erro')
    }
  }

  /**
   * Valida se todos os emoluments informados existem na pivot emolument_service
   * para (companies_id, service_id). Retorna Set com os ids permitidos.
   */
  private async validateEmolumentsInPivot(params: {
    trx: any
    companiesId: number
    serviceId: number
    items: ReceiptItemPayload[]
  }) {
    const { trx, companiesId, serviceId, items } = params

    if (!items?.length) return

    const emolumentIds = items.map((i) => Number(i.emolumentId))

    const rows = await Database.from('emolument_service')
      .useTransaction(trx)
      .where('companies_id', companiesId)
      .where('service_id', serviceId)
      .whereIn('emolument_id', emolumentIds)
      .select('emolument_id')

    const allowed = new Set(rows.map((r) => Number(r.emolument_id)))

    const invalid = emolumentIds.filter((id) => !allowed.has(Number(id)))
    if (invalid.length) {
      // você pode trocar para ValidationException se preferir 422
      throw new BadRequestException(
        `Emolumentos inválidos para o serviço ${serviceId}: ${invalid.join(', ')}`,
        400,
        'invalid_emoluments'
      )
    }
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const trx = await Database.transaction()

    try {
      const payload = await request.validate(ReceiptValidator)

      // separa items do restante
      const { items = [], ...receiptData } = payload as any

      // cria receipt na transação
      const receipt = await Receipt.create(
        {
          ...receiptData,
          companiesId: authenticate.companies_id,
          userId: authenticate.id,
        },
        { client: trx }
      )

      // valida itens contra pivot (companies + service)
      await this.validateEmolumentsInPivot({
        trx,
        companiesId: authenticate.companies_id,
        serviceId: receipt.serviceId,
        items: items as ReceiptItemPayload[],
      })

      // cria receipt_items
      if (items.length) {
        await receipt.related('items').createMany(
          (items as ReceiptItemPayload[]).map((it) => ({
            companiesId: authenticate.companies_id,
            receiptId: receipt.id,
            serviceId: receipt.serviceId,
            emolumentId: it.emolumentId,
            qtde: it.qtde ?? 1,
            amount: it.amount ?? 0,
          })),
          { client: trx }
        )
      }

      // ✅ NOVO: cria um registro padrão em employee_verification_x_receipts
      await EmployeeVerificationXReceipt.create(
        {
          receiptId: receipt.id,
          companiesId: authenticate.companies_id,
          employeeVerificationId: 1,       // conferência padrão
          userId: authenticate.id,
          date: DateTime.local(),          // agora
        },
        { client: trx }
      )

      await trx.commit()

      // retorna com preloads
      await receipt.refresh()
      await receipt.load('service')
      await receipt.load('orderCertificate')
      await receipt.load('user')
      await receipt.load('typebook')
      await receipt.load('items', (q) => q.preload('emolument').orderBy('id', 'asc'))

      return response.status(201).send(receipt)
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  public async update({ auth, request, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const trx = await Database.transaction()

    try {
      const receipt = await Receipt.query({ client: trx })
        .where('companies_id', authenticate.companies_id)
        .where('id', params.id)
        .firstOrFail()
      const payload = await request.validate(ReceiptValidator)
      const { items, ...receiptData } = payload as any

      receipt.merge({
        ...receiptData,
        companiesId: authenticate.companies_id,
        userId: authenticate.id,
      })

      await receipt.save()

      /**
       * Se o front mandar "items", vamos substituir tudo (delete + createMany).
       * Se NÃO mandar "items", mantém como está.
       */
      if (items) {
        // valida itens contra pivot (companies + service ATUAL do receipt após merge)
        await this.validateEmolumentsInPivot({
          trx,
          companiesId: authenticate.companies_id,
          serviceId: receipt.serviceId,
          items: items as ReceiptItemPayload[],
        })

        // apaga itens antigos
        await receipt.related('items').query({ client: trx }).delete()

        // recria itens
        if ((items as ReceiptItemPayload[]).length) {
          await receipt.related('items').createMany(
            (items as ReceiptItemPayload[]).map((it) => ({
              companiesId: authenticate.companies_id,
              receiptId: receipt.id,
              serviceId: receipt.serviceId,
              emolumentId: it.emolumentId,
              qtde: it.qtde ?? 1,
              amount: it.amount ?? 0,
            })),
            { client: trx }
          )
        }
      }

      await trx.commit()

      // retorna com preloads
      await receipt.refresh()
      await receipt.load('service')
      await receipt.load('orderCertificate')
      await receipt.load('user')
      await receipt.load('typebook')
      await receipt.load('items', (q) => q.preload('emolument').orderBy('id', 'asc'))

      return response.status(200).send(receipt)
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const trx = await Database.transaction()

    try {
      const receipt = await Receipt.query({ client: trx })
        .where('companies_id', authenticate.companies_id)
        .where('id', params.id)
        .firstOrFail()

      // se receipt_items tem FK RESTRICT, precisa deletar items antes
      await receipt.related('items').query({ client: trx }).delete()
      await receipt.delete()

      await trx.commit()
      return response.status(200).send({ message: 'Registro removido com sucesso' })
    } catch (error) {
      await trx.rollback()
      throw new BadRequestException('Bad Request', 401, 'erro')
    }
  }
}
