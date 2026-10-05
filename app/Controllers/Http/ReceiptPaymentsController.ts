import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'
import BadRequestException from 'App/Exceptions/BadRequestException'
import Receipt from 'App/Models/Receipt'
import ReceiptPayment from 'App/Models/ReceiptPayment'
import ReceiptCashEntry from 'App/Models/ReceiptCashEntry'
import ReceiptItem from 'App/Models/ReceiptItem'
import FinPaymentMethod from 'App/Models/FinPaymentMethod'

const planSchema = schema.create({
  payments: schema.array([rules.minLength(1)]).members(
    schema.object().members({
      methodId: schema.number([rules.unsigned()]),
      amount: schema.number(),
      installments: schema.number([rules.range(1, 24)]),
      firstDueDate: schema.date({ format: 'yyyy-MM-dd' }),
    })
  ),
})

const cents = (amount: number) => Math.round(Number(amount) * 100)
const error = (message: string, status = 400) =>
  new BadRequestException(message, status, 'RECEIPT_PAYMENT_ERROR')

export default class ReceiptPaymentsController {
  public async index({ auth, request, response }: HttpContextContract) {
    const user = await auth.use('api').authenticate()
    const query = ReceiptPayment.query()
      .where('companies_id', user.companies_id)
      .whereNull('canceled_at')
      .preload('paymentMethod')
      .preload('receipt')
      .orderBy('due_date', 'asc')
      .orderBy('id', 'asc')

    const receiptId = Number(request.input('receiptId'))
    if (receiptId) query.where('receipt_id', receiptId)
    const status = request.input('status')
    if (status === 'pending') query.whereNull('received_at')
    if (status === 'received') query.whereNotNull('received_at')
    const page = Math.max(1, Number(request.input('page', 1)) || 1)
    const perPage = Math.min(100, Math.max(1, Number(request.input('perPage', 50)) || 50))
    return response.ok(await query.paginate(page, perPage))
  }

  public async cash({ auth, request, response }: HttpContextContract) {
    const user = await auth.use('api').authenticate()
    const totalQuery = ReceiptCashEntry.query().where('companies_id', user.companies_id)
      .whereHas('receiptPayment', (payment) => payment.whereNull('canceled_at'))
    const query = ReceiptCashEntry.query()
      .where('companies_id', user.companies_id)
      .whereHas('receiptPayment', (payment) => payment.whereNull('canceled_at'))
      .preload('receiptPayment', (payment) => {
        payment.preload('receipt').preload('paymentMethod')
      })
      .orderBy('received_at', 'desc')
    const date = request.input('date')
    if (date) {
      const day = DateTime.fromISO(String(date))
      if (!day.isValid || !/^\d{4}-\d{2}-\d{2}$/.test(String(date))) throw error('Data inválida.')
      const start = day.startOf('day').toSQL()!
      const end = day.plus({ days: 1 }).startOf('day').toSQL()!
      query.where('received_at', '>=', start).where('received_at', '<', end)
      totalQuery.where('received_at', '>=', start).where('received_at', '<', end)
    }
    const page = Math.max(1, Number(request.input('page', 1)) || 1)
    const perPage = Math.min(100, Math.max(1, Number(request.input('perPage', 50)) || 50))
    const total = await totalQuery.sum('amount as total').first()
    const result = await query.paginate(page, perPage)
    return response.ok({ ...result.serialize(), totalAmount: Number(total?.$extras.total ?? 0) })
  }

  public async finalizeFree({ auth, params, response }: HttpContextContract) {
    const user = await auth.use('api').authenticate()
    const trx = await Database.transaction()
    try {
      const receipt = await Receipt.query({ client: trx })
        .where('companies_id', user.companies_id).where('id', params.id)
        .preload('service').forUpdate().firstOrFail()
      if (!receipt.service.free) throw error('Este recibo não é gratuito.')
      if (receipt.status === 'CANCELADO' || receipt.status === 'EXCLUIDO') throw error('Recibo cancelado não pode ser finalizado.')
      if (receipt.financialFinalizedAt) throw error('Recibo já finalizado.', 409)
      receipt.free = true
      await ReceiptItem.query({ client: trx }).where('receipt_id', receipt.id).update({ amount: 0 })
      receipt.financialFinalizedAt = DateTime.local()
      await receipt.save()
      await trx.commit()
      return response.ok(receipt)
    } catch (e) {
      await trx.rollback()
      throw e
    }
  }

  public async store({ auth, request, params, response }: HttpContextContract) {
    const user = await auth.use('api').authenticate()
    const payload = await request.validate({ schema: planSchema })
    const trx = await Database.transaction()
    try {
      const receipt = await Receipt.query({ client: trx })
        .where('companies_id', user.companies_id).where('id', params.id)
        .preload('service').preload('items').forUpdate().firstOrFail()
      if (receipt.free || receipt.service.free) throw error('Recibo gratuito não gera recebimentos.')
      if (receipt.status === 'CANCELADO' || receipt.status === 'EXCLUIDO') throw error('Recibo cancelado não pode gerar recebimentos.')
      if (receipt.financialFinalizedAt) throw error('Recebimento já confirmado para este recibo.', 409)
      if (await ReceiptPayment.query({ client: trx }).where('receipt_id', receipt.id).whereNull('canceled_at').first()) {
        throw error('Já existem parcelas para este recibo.', 409)
      }
      const previousPayment = await ReceiptPayment.query({ client: trx })
        .where('receipt_id', receipt.id).orderBy('payment_group', 'desc').first()
      const firstGroup = Number(previousPayment?.paymentGroup ?? 0)

      const total = receipt.items.reduce((sum, item) => sum + cents(item.amount) * Number(item.qtde), 0)
      if (!Number.isSafeInteger(total) || total <= 0) throw error('O recibo precisa ter valor válido maior que zero.')
      if (payload.payments.reduce((sum, line) => sum + cents(line.amount), 0) !== total) {
        throw error('A soma das formas de pagamento deve ser igual ao total salvo do recibo.')
      }
      let distributed = 0
      const now = DateTime.local()
      for (const [group, line] of payload.payments.entries()) {
        const lineCents = cents(line.amount)
        if (!Number.isFinite(line.amount) || lineCents <= 0 || Math.abs(line.amount * 100 - lineCents) > 0.001) {
          throw error('Informe valores positivos com até duas casas decimais.')
        }
        if (!Number.isInteger(line.installments) || lineCents < line.installments) {
          throw error('Quantidade de parcelas inválida para o valor.')
        }
        distributed += lineCents
        const method = await FinPaymentMethod.query({ client: trx })
          .where('companies_id', user.companies_id)
          .where('id', line.methodId)
          .where('excluded', false).first()
        if (!method) throw error('Forma de pagamento não encontrada para esta empresa.')
        if (method.receipt_immediate && line.installments !== 1) {
          throw error('Forma de recebimento imediato não pode ser parcelada.')
        }
        const base = Math.floor(lineCents / line.installments)
        const remainder = lineCents % line.installments
        for (let installment = 1; installment <= line.installments; installment++) {
          const amount = (base + (installment <= remainder ? 1 : 0)) / 100
          const payment = await ReceiptPayment.create({
            companiesId: user.companies_id,
            receiptId: receipt.id,
            finPaymentmethodId: method.id,
            paymentGroup: firstGroup + group + 1,
            installmentNumber: installment,
            installmentCount: line.installments,
            amount,
            dueDate: method.receipt_immediate ? now.startOf('day') : line.firstDueDate.plus({ months: installment - 1 }),
            receivedAt: method.receipt_immediate ? now : null,
            receivedBy: method.receipt_immediate ? user.id : null,
          }, { client: trx })
          if (method.receipt_immediate) {
            await ReceiptCashEntry.create({
              companiesId: user.companies_id,
              receiptPaymentId: payment.id,
              amount,
              receivedAt: now,
              userId: user.id,
            }, { client: trx })
          }
        }
      }
      if (distributed !== total) throw error('A soma das formas de pagamento deve ser igual ao total salvo do recibo.')
      receipt.financialFinalizedAt = now
      receipt.status = receipt.dateStamp ? 'SELADO' : 'PROTOCOLADO'
      await receipt.save()
      await trx.commit()
      return response.status(201).send({ receiptId: receipt.id, total: total / 100 })
    } catch (e) {
      await trx.rollback()
      throw e
    }
  }

  public async settle({ auth, params, response }: HttpContextContract) {
    const user = await auth.use('api').authenticate()
    const trx = await Database.transaction()
    try {
      const selectedPayment = await ReceiptPayment.query({ client: trx })
        .where('companies_id', user.companies_id).where('id', params.id).firstOrFail()
      const receipt = await Receipt.query({ client: trx })
        .where('companies_id', user.companies_id).where('id', selectedPayment.receiptId)
        .forUpdate().firstOrFail()
      const payment = await ReceiptPayment.query({ client: trx })
        .where('companies_id', user.companies_id).where('id', params.id)
        .forUpdate().firstOrFail()
      if (payment.canceledAt || !receipt.financialFinalizedAt || receipt.status === 'EXCLUIDO' || receipt.status === 'CANCELADO') {
        throw error('Parcela cancelada.', 409)
      }
      if (payment.receivedAt) throw error('Parcela já recebida.', 409)
      const now = DateTime.local()
      payment.receivedAt = now
      payment.receivedBy = user.id
      await payment.save()
      await ReceiptCashEntry.create({
        companiesId: user.companies_id,
        receiptPaymentId: payment.id,
        amount: payment.amount,
        receivedAt: now,
        userId: user.id,
      }, { client: trx })
      await trx.commit()
      return response.ok(payment)
    } catch (e) {
      await trx.rollback()
      throw e
    }
  }
}
