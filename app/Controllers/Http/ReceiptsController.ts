// app/Controllers/Http/ReceiptsController.ts
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import Receipt from 'App/Models/Receipt'
import ReceiptItem from 'App/Models/ReceiptItem'
import Service from 'App/Models/Service'
import ReceiptValidator from 'App/Validators/ReceiptValidator'
import EmployeeVerificationXReceipt from 'App/Models/EmployeeVerificationXReceipt'
import BadRequestException from 'App/Exceptions/BadRequestException'
import { DateTime } from 'luxon'
import OrderCertificate from 'App/Models/OrderCertificate'
import ReceiptPayment from 'App/Models/ReceiptPayment'
import SpedyServiceInvoice from 'App/Models/SpedyServiceInvoice'
import User from 'App/Models/User'
import Groupxpermission from 'App/Models/Groupxpermission'
import AuditLog from 'App/Models/AuditLog'
import Hash from '@ioc:Adonis/Core/Hash'
import { schema, rules } from '@ioc:Adonis/Core/Validator'

type ReceiptItemPayload = {
  emolumentId: number
  qtde?: number
  amount?: number
}

const CANCEL_RECEIPT_PERMISSION_ID = 48

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
      if (request.input('activeOnly') === 'true') {
        query.where((q) => q.whereNull('status').orWhereNot('status', 'EXCLUIDO'))
      }

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
      const service = await Service.query({ client: trx })
        .where('companies_id', authenticate.companies_id).where('id', receiptData.serviceId).firstOrFail()
      receiptData.free = !!service.free
      if (service.free) items.forEach((item: ReceiptItemPayload) => { item.amount = 0 })

      // O status inicial segue a presença do selo.
      receiptData.status = receiptData.dateStamp ? 'SELADO' : 'PROTOCOLADO'

      // Serializa a criação por certidão para manter apenas um recibo ativo.
      await OrderCertificate.query({ client: trx })
        .where('companies_id', authenticate.companies_id)
        .where('id', receiptData.orderCertificateId).forUpdate().firstOrFail()
      const activeReceipt = await Receipt.query({ client: trx })
        .where('companies_id', authenticate.companies_id)
        .where('order_certificate_id', receiptData.orderCertificateId)
        .where((q) => q.whereNull('status').orWhereNot('status', 'EXCLUIDO')).first()
      if (activeReceipt) {
        throw new BadRequestException('Já existe um recibo ativo para esta certidão.', 409, 'active_receipt_exists')
      }

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

      // ✅ mantém criação padrão de employee_verification_x_receipts
      await EmployeeVerificationXReceipt.create(
        {
          receiptId: receipt.id,
          companiesId: authenticate.companies_id,
          employeeVerificationId: 1, // conferência padrão
          userId: authenticate.id,
          date: DateTime.local(), // agora
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
        .forUpdate()
        .firstOrFail()

      // A finalização bloqueia somente serviço e itens financeiros, verificados após a validação.

      // ✅ SE JÁ ESTIVER CANCELADO, NÃO PERMITE UPDATE
      if (receipt.status === 'CANCELADO' || receipt.status === 'EXCLUIDO') {
        await trx.rollback()
        return response.status(400).send({
          message: 'Recibo cancelado não pode ser alterado.',
        })
      }

      const payload = await request.validate(ReceiptValidator)

      console.log(payload)
      const { items, ...receiptData } = payload as any
      if (receiptData.orderCertificateId !== receipt.orderCertificateId) {
        throw new BadRequestException('A certidão do recibo não pode ser alterada.', 409, 'receipt_order_change')
      }
      if (receiptData.status === 'CANCELADO' || receiptData.status === 'EXCLUIDO') {
        throw new BadRequestException('Use a ação de cancelamento do recibo.', 409, 'receipt_cancel_action_required')
      }
      const service = await Service.query({ client: trx })
        .where('companies_id', authenticate.companies_id).where('id', receiptData.serviceId).firstOrFail()
      receiptData.free = receipt.financialFinalizedAt ? receipt.free : !!service.free
      if (receiptData.free) items?.forEach((item: ReceiptItemPayload) => { item.amount = 0 })

      if (receipt.financialFinalizedAt) {
        if (receiptData.serviceId !== receipt.serviceId || receiptData.status === 'CANCELADO' ||
          (Object.prototype.hasOwnProperty.call(receiptData, 'tributationId') &&
            String(receiptData.tributationId ?? '') !== String(receipt.tributationId ?? ''))) {
          await trx.rollback()
          return response.status(409).send({ message: 'Serviço e cobrança não podem ser alterados após a finalização.' })
        }
        if (items) {
          const savedItems = await ReceiptItem.query({ client: trx }).where('receipt_id', receipt.id)
          const normalize = (list: ReceiptItemPayload[]) => list.map((item) => [
            Number(item.emolumentId), Number(item.qtde ?? 1), Math.round(Number(item.amount ?? 0) * 100),
          ]).sort((a, b) => a[0] - b[0])
          const original = savedItems.map((item) => ({ emolumentId: item.emolumentId, qtde: item.qtde, amount: item.amount }))
          if (JSON.stringify(normalize(items)) !== JSON.stringify(normalize(original))) {
            await trx.rollback()
            return response.status(409).send({ message: 'Os valores do recibo não podem ser alterados após a finalização.' })
          }
        }
      }

      // ✅ REGRA STATUS x DATESTAMP
      //
      // O recibo reaberto permanece assim até a nova confirmação financeira.
      if (receipt.status !== 'REABERTO') {
        if (receiptData.dateStamp) {
          receiptData.status = 'SELADO'
        } else {
          receiptData.status = 'PROTOCOLADO'
        }
      } else if (receipt.status === 'REABERTO') {
        receiptData.status = 'REABERTO'
      }

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
      if (items && !receipt.financialFinalizedAt) {
        // valida itens contra pivot (companies + service ATUAL do receipt após merge)
        await this.validateEmolumentsInPivot({
          trx,
          companiesId: authenticate.companies_id,
          serviceId: receipt.serviceId,
          items: items as ReceiptItemPayload[],
        })

        // apaga itens antigos
        await ReceiptItem.query({ client: trx }).where('receipt_id', receipt.id).delete()

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
  private async cancelActivePayments(receipt: Receipt, trx: any) {
    await ReceiptPayment.query({ client: trx })
      .where('receipt_id', receipt.id).whereNull('canceled_at')
      .update({ canceled_at: DateTime.local().toFormat('yyyy-LL-dd HH:mm:ss') })
    receipt.financialFinalizedAt = null
  }

  private async checkInvoice(receipt: Receipt, trx: any) {
    const invoice = await SpedyServiceInvoice.query({ client: trx })
      .where('companies_id', receipt.companiesId).where('receipt_id', receipt.id).first()
    if (invoice) {
      throw new BadRequestException('Há uma NF vinculada a este recibo. O cancelamento com NF será tratado em uma próxima etapa.', 409, 'receipt_invoice_exists')
    }
  }

  public async cancelPayments({ auth, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const trx = await Database.transaction()
    try {
      const receipt = await Receipt.query({ client: trx })
        .where('companies_id', authenticate.companies_id)
        .where('id', params.id).forUpdate().firstOrFail()
      if (receipt.status === 'EXCLUIDO' || receipt.status === 'CANCELADO') {
        throw new BadRequestException('Recibo cancelado não pode ser reaberto.', 409, 'receipt_cancelled')
      }
      if (!receipt.financialFinalizedAt || receipt.free) {
        throw new BadRequestException('Este recibo não possui recebimento ativo.', 409, 'receipt_not_received')
      }
      await this.checkInvoice(receipt, trx)
      await this.cancelActivePayments(receipt, trx)
      receipt.status = 'REABERTO'
      await receipt.save()
      await trx.commit()
      return response.ok(receipt)
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  public async destroy({ auth, request, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const { username, password } = await request.validate({ schema: schema.create({
      username: schema.string({ trim: true }, [rules.maxLength(45)]),
      password: schema.string(),
    }) })
    const authorizer = await User.query()
      .where('companies_id', authenticate.companies_id)
      .where('username', username).where('status', true).first()
    if (!authorizer || !await Hash.verify(authorizer.password, password)) {
      throw new BadRequestException('Usuário ou senha inválidos.', 403, 'receipt_cancel_invalid_credentials')
    }
    if (!authorizer.superuser) {
      const permission = await Groupxpermission.query()
        .where('usergroup_id', authorizer.usergroup_id)
        .where('permissiongroup_id', CANCEL_RECEIPT_PERMISSION_ID)
        .where((q) => q.whereNull('companies_id').orWhere('companies_id', authenticate.companies_id))
        .first()
      if (!permission) {
        throw new BadRequestException('Usuário sem permissão para cancelar recibos.', 403, 'receipt_cancel_forbidden')
      }
    }
    const trx = await Database.transaction()
    try {
      const receipt = await Receipt.query({ client: trx })
        .where('companies_id', authenticate.companies_id)
        .where('id', params.id).forUpdate().firstOrFail()
      if (receipt.status === 'EXCLUIDO') {
        throw new BadRequestException('Recibo já excluído.', 409, 'receipt_already_excluded')
      }
      await this.checkInvoice(receipt, trx)
      const previousStatus = receipt.status
      const previousFinalizedAt = receipt.financialFinalizedAt
      await this.cancelActivePayments(receipt, trx)
      receipt.status = 'EXCLUIDO'
      await receipt.save()
      const now = DateTime.local()
      await AuditLog.create({
        companiesId: authenticate.companies_id,
        userId: authorizer.id,
        action: 'receipt_cancel',
        entityTable: 'receipts',
        entityId: receipt.id,
        resourceKey: `receipts:${receipt.id}`,
        description: `Usuário ${authorizer.name || authorizer.username} autorizou o cancelamento do recibo ${receipt.id}, solicitado por ${authenticate.name || authenticate.username}.`,
        metadata: {
          authorizedByUserId: authorizer.id,
          requestedByUserId: authenticate.id,
          requestedByUsername: authenticate.username,
          orderCertificateId: receipt.orderCertificateId,
        },
        changedFields: ['status', 'financialFinalizedAt'],
        beforeData: { status: previousStatus, financialFinalizedAt: previousFinalizedAt?.toISO() ?? null },
        afterData: { status: receipt.status, financialFinalizedAt: null },
        occurrenceCount: 1,
        firstAt: now,
        lastAt: now,
        ip: request.ip(),
      }, { client: trx })
      await trx.commit()
      return response.ok(receipt)
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }
}
