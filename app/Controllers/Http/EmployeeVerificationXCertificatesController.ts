import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { DateTime } from 'luxon'

import EmployeeVerification from 'App/Models/EmployeeVerification'
import EmployeeVerificationXCertificate from 'App/Models/EmployeeVerificationXCertificate'
import MarriedCertificate from 'App/Models/MarriedCertificate'
import BornCertificate from 'App/Models/BornCertificate'
import DeathCertificate from 'App/Models/DeathCertificate'
import EmployeeVerificationXCertificateValidator from 'App/Validators/EmployeeVerificationXCertificateValidator'

export default class EmployeeVerificationXCertificatesController {
  public async index({ auth, request }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const companiesId = authenticate.companies_id

    const { married_certificate_id, born_certificate_id, death_certificate_id, employee_verification_id } = request.qs()

    const query = EmployeeVerificationXCertificate.query()
      .where('companiesId', companiesId)

    if (married_certificate_id) {
      query.where('marriedCertificateId', Number(married_certificate_id))
    }

    if (born_certificate_id) {
      query.where('bornCertificateId', Number(born_certificate_id))
    }

    if (death_certificate_id) {
      query.where('deathCertificateId', Number(death_certificate_id))
    }

    if (employee_verification_id) {
      query.where('employeeVerificationId', Number(employee_verification_id))
    }

    return query
      .preload('marriedCertificate')
      .preload('bornCertificate')
      .preload('deathCertificate')
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

    const hasMarriedCertificate = payload.marriedCertificateId !== undefined
    const hasBornCertificate = payload.bornCertificateId !== undefined
    const hasDeathCertificate = payload.deathCertificateId !== undefined

    if ([hasMarriedCertificate, hasBornCertificate, hasDeathCertificate].filter(Boolean).length !== 1) {
      return response.status(422).json({
        message: 'Informe exatamente um certificado de casamento, nascimento ou óbito',
      })
    }

    let certificate: MarriedCertificate | BornCertificate | null = null
    if (hasMarriedCertificate) {
      certificate = await MarriedCertificate.query()
        .where('id', payload.marriedCertificateId)
        .where('companiesId', companiesId)
        .first()
    } else if (hasBornCertificate) {
      certificate = await BornCertificate.query()
        .where('id', payload.bornCertificateId)
        .where('companiesId', companiesId)
        .first()
    }

    const deathCertificate = hasDeathCertificate
      ? await DeathCertificate.query()
        .where('id', payload.deathCertificateId)
        .where('companiesId', companiesId)
        .first()
      : null

    if (!certificate && !deathCertificate) {
      return response.status(422).json({
        message: hasMarriedCertificate
          ? 'O certificado de casamento informado não pertence a esta empresa'
          : hasBornCertificate
            ? 'O certificado de nascimento informado não pertence a esta empresa'
            : 'O certificado de óbito informado não pertence a esta empresa',
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

    const alreadyExistsQuery = EmployeeVerificationXCertificate.query()
      .where('employeeVerificationId', payload.employeeVerificationId)
      .where('companiesId', companiesId)

    if (hasMarriedCertificate) {
      alreadyExistsQuery.where('marriedCertificateId', payload.marriedCertificateId)
    } else if (hasBornCertificate) {
      alreadyExistsQuery.where('bornCertificateId', payload.bornCertificateId)
    } else {
      alreadyExistsQuery.where('deathCertificateId', payload.deathCertificateId)
    }

    const alreadyExists = await alreadyExistsQuery.first()

    if (alreadyExists) {
      return response.status(409).json({
        message: 'Já existe um vínculo para este certificado e conferência de funcionário nesta empresa',
      })
    }

    const item = await EmployeeVerificationXCertificate.create({
      marriedCertificateId: payload.marriedCertificateId ?? null,
      bornCertificateId: payload.bornCertificateId ?? null,
      deathCertificateId: payload.deathCertificateId ?? null,
      companiesId,
      employeeVerificationId: payload.employeeVerificationId,
      userId,
      status: payload.status ?? '',
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
      .preload('bornCertificate')
      .preload('deathCertificate')
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

    const hasMarriedCertificate = payload.marriedCertificateId !== undefined
    const hasBornCertificate = payload.bornCertificateId !== undefined
    const hasDeathCertificate = payload.deathCertificateId !== undefined

    if ([hasMarriedCertificate, hasBornCertificate, hasDeathCertificate].filter(Boolean).length > 1) {
      return response.status(422).json({
        message: 'Informe apenas um certificado de casamento, nascimento ou óbito',
      })
    }

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
      item.bornCertificateId = null
      item.deathCertificateId = null
    }

    if (payload.bornCertificateId !== undefined) {
      const certificate = await BornCertificate.query()
        .where('id', payload.bornCertificateId)
        .where('companiesId', companiesId)
        .first()

      if (!certificate) {
        return response.status(422).json({
          message: 'O certificado de nascimento informado não pertence a esta empresa',
        })
      }

      item.bornCertificateId = payload.bornCertificateId
      item.marriedCertificateId = null
      item.deathCertificateId = null
    }

    if (payload.deathCertificateId !== undefined) {
      const certificate = await DeathCertificate.query()
        .where('id', payload.deathCertificateId)
        .where('companiesId', companiesId)
        .first()

      if (!certificate) {
        return response.status(422).json({
          message: 'O certificado de óbito informado não pertence a esta empresa',
        })
      }

      item.deathCertificateId = payload.deathCertificateId
      item.marriedCertificateId = null
      item.bornCertificateId = null
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
