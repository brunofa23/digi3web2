// app/Controllers/Http/EmployeeVerificationXReceiptsController.ts
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { DateTime } from 'luxon'
import Database from '@ioc:Adonis/Lucid/Database'

import EmployeeVerification from 'App/Models/EmployeeVerification'
import EmployeeVerificationXReceipt from 'App/Models/EmployeeVerificationXReceipt'
import Receipt from 'App/Models/Receipt'
import EmployeeVerificationXReceiptValidator from 'App/Validators/EmployeeVerificationXReceiptValidator'

export default class EmployeeVerificationXReceiptsController {
  /**
   * GET /employee-verification-x-receipts
   * Filtros opcionais: ?receipt_id=&employee_verification_id=
   * Sempre filtrando por companiesId do usuário autenticado
   */
  public async index({ auth, request }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const companiesId = authenticate.companies_id

    const { receipt_id, employee_verification_id } = request.qs()

    const query = EmployeeVerificationXReceipt.query()
      .where('companiesId', companiesId)

    if (receipt_id) {
      query.where('receiptId', Number(receipt_id))
    }

    if (employee_verification_id) {
      query.where('employeeVerificationId', Number(employee_verification_id))
    }

    query
      .preload('receipt')
      .preload('employeeVerification')
      .preload('company')
      .preload('user')
      .orderBy('item', 'asc')

    const items = await query
    return items
  }

  /**
   * POST /employee-verification-x-receipts
   * Cria o vínculo entre receipt e employee_verification
   * companiesId e userId vêm do auth
   */
  public async store({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const companiesId = authenticate.companies_id
    const userId = authenticate.id

    const payload = await request.validate({
      schema: EmployeeVerificationXReceiptValidator.createSchema,
      messages: EmployeeVerificationXReceiptValidator.messages,
    })

    const verification = await EmployeeVerification.query()
      .where('id', payload.employeeVerificationId)
      .where('companiesId', companiesId)
      .where('local', 'receipt')
      .where('inactive', false)
      .first()

    if (!verification) {
      return response.status(422).json({
        message: 'A conferência de funcionário informada não está disponível para recibos nesta empresa',
      })
    }

    const item = await Database.transaction(async (trx) => {
      await Receipt.query({ client: trx })
        .where('id', payload.receiptId)
        .where('companiesId', companiesId)
        .forUpdate()
        .firstOrFail()

      const alreadyExists = await EmployeeVerificationXReceipt.query({ client: trx })
        .where('receiptId', payload.receiptId)
        .where('employeeVerificationId', payload.employeeVerificationId)
        .first()
      if (alreadyExists) return null

      const last = await EmployeeVerificationXReceipt.query({ client: trx })
        .where('receiptId', payload.receiptId)
        .orderBy('item', 'desc')
        .first()

      return EmployeeVerificationXReceipt.create({
        receiptId: payload.receiptId,
        companiesId,
        employeeVerificationId: payload.employeeVerificationId,
        userId,
        date: payload.date as DateTime,
        item: (last?.item || 0) + 1,
      }, { client: trx })
    })

    if (!item) {
      return response.status(409).json({
        message: 'Já existe um vínculo para este recibo e conferência de funcionário nesta empresa',
      })
    }

    return item
  }

  /**
   * GET /employee-verification-x-receipts/:id
   * Sempre respeitando companiesId
   */
  public async show({ auth, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const companiesId = authenticate.companies_id

    const item = await EmployeeVerificationXReceipt.query()
      .where('id', params.id)
      .where('companiesId', companiesId)
      .preload('receipt')
      .preload('employeeVerification')
      .preload('company')
      .preload('user')
      .first()

    if (!item) {
      return response.status(404).json({
        message: 'Registro não encontrado',
      })
    }

    return item
  }

  /**
   * PUT/PATCH /employee-verification-x-receipts/:id
   * Atualiza dados respeitando companiesId do auth
   */
  public async update({ auth, params, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const companiesId = authenticate.companies_id

    const item = await EmployeeVerificationXReceipt.query()
      .where('id', params.id)
      .where('companiesId', companiesId)
      .first()

    if (!item) {
      return response.status(404).json({
        message: 'Registro não encontrado',
      })
    }

    const payload = await request.validate({
      schema: EmployeeVerificationXReceiptValidator.updateSchema,
      messages: EmployeeVerificationXReceiptValidator.messages,
    })

    if (payload.employeeVerificationId !== undefined) {
      const verification = await EmployeeVerification.query()
        .where('id', payload.employeeVerificationId)
        .where('companiesId', companiesId)
        .where('local', 'receipt')
        .where('inactive', false)
        .first()

      if (!verification) {
        return response.status(422).json({
          message: 'A conferência de funcionário informada não está disponível para recibos nesta empresa',
        })
      }
    }

    const updated = await Database.transaction(async (trx) => {
      const destinationReceiptId = payload.receiptId ?? item.receiptId
      const receiptIds = [...new Set([item.receiptId, destinationReceiptId])].sort((a, b) => a - b)
      for (const receiptId of receiptIds) {
        await Receipt.query({ client: trx })
          .where('id', receiptId)
          .where('companiesId', companiesId)
          .forUpdate()
          .firstOrFail()
      }

      const current = await EmployeeVerificationXReceipt.query({ client: trx })
        .where('id', item.id)
        .where('companiesId', companiesId)
        .first()
      if (!current) return null
      if (current.receiptId !== item.receiptId) return false

      const oldReceiptId = current.receiptId
      const oldItem = current.item
      if (destinationReceiptId !== oldReceiptId) {
        const last = await EmployeeVerificationXReceipt.query({ client: trx })
          .where('receiptId', destinationReceiptId)
          .orderBy('item', 'desc')
          .first()
        current.receiptId = destinationReceiptId
        current.item = (last?.item || 0) + 1
      }
      if (payload.employeeVerificationId !== undefined) {
        current.employeeVerificationId = payload.employeeVerificationId
      }
      if (payload.date !== undefined) {
        current.date = payload.date as DateTime
      }
      await current.save()

      if (destinationReceiptId !== oldReceiptId) {
        const following = await EmployeeVerificationXReceipt.query({ client: trx })
          .where('receiptId', oldReceiptId)
          .where('item', '>', oldItem)
          .orderBy('item', 'asc')
        for (const entry of following) {
          entry.item -= 1
          await entry.save()
        }
      }

      return current
    })

    if (updated === false) {
      return response.status(409).json({ message: 'O vínculo mudou de recibo. Atualize e tente novamente.' })
    }
    if (!updated) {
      return response.status(404).json({ message: 'Registro não encontrado' })
    }

    return updated
  }

  /**
   * DELETE /employee-verification-x-receipts/:id
   * Respeitando companiesId
   */
  public async destroy({ auth, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const companiesId = authenticate.companies_id

    const item = await EmployeeVerificationXReceipt.query()
      .where('id', params.id)
      .where('companiesId', companiesId)
      .first()

    if (!item) {
      return response.status(404).json({
        message: 'Registro não encontrado',
      })
    }

    const deleted = await Database.transaction(async (trx) => {
      await Receipt.query({ client: trx })
        .where('id', item.receiptId)
        .where('companiesId', companiesId)
        .forUpdate()
        .firstOrFail()

      const current = await EmployeeVerificationXReceipt.query({ client: trx })
        .where('id', item.id)
        .where('companiesId', companiesId)
        .first()
      if (!current) return
      if (current.receiptId !== item.receiptId) return false

      await current.delete()

      const following = await EmployeeVerificationXReceipt.query({ client: trx })
        .where('receiptId', current.receiptId)
        .where('item', '>', current.item)
        .orderBy('item', 'asc')
      for (const entry of following) {
        entry.item -= 1
        await entry.save()
      }
    })

    if (deleted === false) {
      return response.status(409).json({ message: 'O vínculo mudou de recibo. Atualize e tente novamente.' })
    }

    return response.status(204)
  }
}
