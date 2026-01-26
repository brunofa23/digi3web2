// app/Controllers/Http/EmployeeVerificationXReceiptsController.ts
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { DateTime } from 'luxon'

import EmployeeVerificationXReceipt from 'App/Models/EmployeeVerificationXReceipt'
import EmployeeVerificationXReceiptValidator from 'App/Validators/EmployeeVerificationXReceiptValidator'

export default class EmployeeVerificationXReceiptsController {
  /**
   * GET /employee-verification-x-receipts
   * Filtros opcionais: ?receipt_id=&employee_verification_id=
   * Sempre filtrando por companiesId do usuário autenticado
   */
  public async index({ auth, request, response }: HttpContextContract) {
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

    // garante unique (receiptId + employeeVerificationId)
    const alreadyExists = await EmployeeVerificationXReceipt.query()
      .where('receiptId', payload.receiptId)
      .where('employeeVerificationId', payload.employeeVerificationId)
      .where('companiesId', companiesId) // garante por empresa
      .first()

    if (alreadyExists) {
      return response.status(409).json({
        message: 'Já existe um vínculo para este recibo e conferência de funcionário nesta empresa',
      })
    }

    const item = await EmployeeVerificationXReceipt.create({
      receiptId: payload.receiptId,
      companiesId,
      employeeVerificationId: payload.employeeVerificationId,
      userId,
      date: payload.date as DateTime,
    })

    await item.refresh()

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

    if (payload.receiptId !== undefined) {
      item.receiptId = payload.receiptId
    }
    if (payload.employeeVerificationId !== undefined) {
      item.employeeVerificationId = payload.employeeVerificationId
    }
    if (payload.date !== undefined) {
      item.date = payload.date as DateTime
    }

    await item.save()
    await item.refresh()

    return item
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

    await item.delete()

    return response.status(204)
  }
}
