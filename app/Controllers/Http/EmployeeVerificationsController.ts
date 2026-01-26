import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import EmployeeVerification from 'App/Models/EmployeeVerification'

export default class EmployeeVerificationsController {
  /**
   * GET /employee-verifications
   * Lista verificações de funcionários
   */
  public async index({ auth, request, response }: HttpContextContract) {
    await auth.use('api').authenticate()

    const qs = request.qs()

    // filtros opcionais (se quiser usar depois)
    const employees_id = qs.employees_id ? Number(qs.employees_id) : null
    const status = qs.status ?? null

    const query = EmployeeVerification.query()

    if (employees_id) {
      query.where('employees_id', employees_id)
    }

    if (status) {
      query.where('status', status)
    }

    const data = await query
      .orderBy('created_at', 'desc')

    return response.ok(data)
  }
}
