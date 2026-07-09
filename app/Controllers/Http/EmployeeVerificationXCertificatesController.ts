import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { DateTime } from 'luxon'

import EmployeeVerification from 'App/Models/EmployeeVerification'
import EmployeeVerificationXCertificate from 'App/Models/EmployeeVerificationXCertificate'
import MarriedCertificate from 'App/Models/MarriedCertificate'
import EmployeeVerificationXCertificateValidator from 'App/Validators/EmployeeVerificationXCertificateValidator'

export default class EmployeeVerificationXCertificatesController {
  public async index({ auth, request }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const companiesId = authenticate.companies_id

    const { married_certificate_id, employee_verification_id } = request.qs()

    const query = EmployeeVerificationXCertificate.query()
      .where('companiesId', companiesId)

    if (married_certificate_id) {
      query.where('marriedCertificateId', Number(married_certificate_id))
    }

    if (employee_verification_id) {
      query.where('employeeVerificationId', Number(employee_verification_id))
    }

    return query
      .preload('marriedCertificate')
      .preload('employeeVerification')
      .preload('company')
      .preload('user')
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const companiesId = authenticate.companies_id
    const userId = authenticate.id

    const payload = await request.validate({
      schema: EmployeeVerificationXCertificateValidator.createSchema,
      messages: EmployeeVerificationXCertificateValidator.messages,
    })

    const certificate = await MarriedCertificate.query()
      .where('id', payload.marriedCertificateId)
      .where('companiesId', companiesId)
      .first()

    if (!certificate) {
      return response.status(422).json({
        message: 'O certificado de casamento informado não pertence a esta empresa',
      })
    }

    const verification = await EmployeeVerification.query()
      .where('id', payload.employeeVerificationId)
      .where('companiesId', companiesId)
      .where('local', 'certificate')
      .where('inactive', false)
      .first()

    if (!verification) {
      return response.status(422).json({
        message: 'A conferência de funcionário informada não está disponível para certificados nesta empresa',
      })
    }

    const alreadyExists = await EmployeeVerificationXCertificate.query()
      .where('marriedCertificateId', payload.marriedCertificateId)
      .where('employeeVerificationId', payload.employeeVerificationId)
      .where('companiesId', companiesId)
      .first()

    if (alreadyExists) {
      return response.status(409).json({
        message: 'Já existe um vínculo para este certificado e conferência de funcionário nesta empresa',
      })
    }

    const item = await EmployeeVerificationXCertificate.create({
      marriedCertificateId: payload.marriedCertificateId,
      companiesId,
      employeeVerificationId: payload.employeeVerificationId,
      userId,
      status: payload.status,
      date: payload.date as DateTime,
    })

    await item.refresh()
    return item
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const companiesId = authenticate.companies_id

    const item = await EmployeeVerificationXCertificate.query()
      .where('id', params.id)
      .where('companiesId', companiesId)
      .preload('marriedCertificate')
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

  public async update({ auth, params, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const companiesId = authenticate.companies_id

    const item = await EmployeeVerificationXCertificate.query()
      .where('id', params.id)
      .where('companiesId', companiesId)
      .first()

    if (!item) {
      return response.status(404).json({
        message: 'Registro não encontrado',
      })
    }

    const payload = await request.validate({
      schema: EmployeeVerificationXCertificateValidator.updateSchema,
      messages: EmployeeVerificationXCertificateValidator.messages,
    })

    if (payload.employeeVerificationId !== undefined) {
      const verification = await EmployeeVerification.query()
        .where('id', payload.employeeVerificationId)
        .where('companiesId', companiesId)
        .where('local', 'certificate')
        .where('inactive', false)
        .first()

      if (!verification) {
        return response.status(422).json({
          message: 'A conferência de funcionário informada não está disponível para certificados nesta empresa',
        })
      }

      item.employeeVerificationId = payload.employeeVerificationId
    }

    if (payload.marriedCertificateId !== undefined) {
      const certificate = await MarriedCertificate.query()
        .where('id', payload.marriedCertificateId)
        .where('companiesId', companiesId)
        .first()

      if (!certificate) {
        return response.status(422).json({
          message: 'O certificado de casamento informado não pertence a esta empresa',
        })
      }

      item.marriedCertificateId = payload.marriedCertificateId
    }
    if (payload.status !== undefined) {
      item.status = payload.status
    }
    if (payload.date !== undefined) {
      item.date = payload.date as DateTime
    }

    await item.save()
    await item.refresh()

    return item
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const companiesId = authenticate.companies_id

    const item = await EmployeeVerificationXCertificate.query()
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
