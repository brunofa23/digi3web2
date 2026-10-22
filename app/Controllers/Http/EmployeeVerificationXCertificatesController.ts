import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { DateTime } from 'luxon'
import Database from '@ioc:Adonis/Lucid/Database'

import EmployeeVerification from 'App/Models/EmployeeVerification'
import EmployeeVerificationXCertificate from 'App/Models/EmployeeVerificationXCertificate'
import MarriedCertificate from 'App/Models/MarriedCertificate'
import BornCertificate from 'App/Models/BornCertificate'
import DeathCertificate from 'App/Models/DeathCertificate'
import MandateCertificate from 'App/Models/MandateCertificate'
import SecondcopyCertificate from 'App/Models/SecondcopyCertificate'
import CommunicationCertificate from 'App/Models/CommunicationCertificate'
import EmployeeVerificationXCertificateValidator from 'App/Validators/EmployeeVerificationXCertificateValidator'

export default class EmployeeVerificationXCertificatesController {
  public async index({ auth, request }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const companiesId = authenticate.companies_id

    const { married_certificate_id, born_certificate_id, death_certificate_id, mandate_certificate_id, secondcopy_certificate_id, communication_certificate_id, employee_verification_id } = request.qs()

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
    if (mandate_certificate_id) query.where('mandateCertificateId', Number(mandate_certificate_id))
    if (secondcopy_certificate_id) query.where('secondcopyCertificateId', Number(secondcopy_certificate_id))
    if (communication_certificate_id) query.where('communicationCertificateId', Number(communication_certificate_id))

    if (employee_verification_id) {
      query.where('employeeVerificationId', Number(employee_verification_id))
    }

    return query
      .preload('marriedCertificate')
      .preload('bornCertificate')
      .preload('deathCertificate')
      .preload('mandateCertificate')
      .preload('secondcopyCertificate')
      .preload('communicationCertificate')
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
    const hasMandateCertificate = payload.mandateCertificateId !== undefined
    const hasSecondcopyCertificate = payload.secondcopyCertificateId !== undefined
    const hasCommunicationCertificate = payload.communicationCertificateId !== undefined

    if ([hasMarriedCertificate, hasBornCertificate, hasDeathCertificate, hasMandateCertificate, hasSecondcopyCertificate, hasCommunicationCertificate].filter(Boolean).length !== 1) {
      return response.status(422).json({
        message: 'Informe exatamente um certificado',
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
    const mandateCertificate = hasMandateCertificate
      ? await MandateCertificate.query().where('id', payload.mandateCertificateId!).where('companiesId', companiesId).first()
      : null
    const secondcopyCertificate = hasSecondcopyCertificate
      ? await SecondcopyCertificate.query().where('id', payload.secondcopyCertificateId!).where('companiesId', companiesId).first()
      : null
    const communicationCertificate = hasCommunicationCertificate
      ? await CommunicationCertificate.query().where('id', payload.communicationCertificateId!).where('companiesId', companiesId).first()
      : null

    if (!certificate && !deathCertificate && !mandateCertificate && !secondcopyCertificate && !communicationCertificate) {
      return response.status(422).json({
        message: hasSecondcopyCertificate ? 'O certificado de segunda via informado não pertence a esta empresa'
          : hasCommunicationCertificate ? 'A comunicação informada não pertence a esta empresa'
          : hasMandateCertificate ? 'O mandado informado não pertence a esta empresa' : hasMarriedCertificate
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

    const target = hasMarriedCertificate ? { table: MarriedCertificate.table, field: 'marriedCertificateId', id: payload.marriedCertificateId! }
      : hasBornCertificate ? { table: BornCertificate.table, field: 'bornCertificateId', id: payload.bornCertificateId! }
      : hasDeathCertificate ? { table: DeathCertificate.table, field: 'deathCertificateId', id: payload.deathCertificateId! }
      : hasMandateCertificate ? { table: MandateCertificate.table, field: 'mandateCertificateId', id: payload.mandateCertificateId! }
      : hasSecondcopyCertificate ? { table: SecondcopyCertificate.table, field: 'secondcopyCertificateId', id: payload.secondcopyCertificateId! }
      : { table: CommunicationCertificate.table, field: 'communicationCertificateId', id: payload.communicationCertificateId! }

    const item = await Database.transaction(async (trx) => {
      const parent = await trx.from(target.table).where('id', target.id).where('companies_id', companiesId).forUpdate().first()
      if (!parent) return null

      const last = await EmployeeVerificationXCertificate.query({ client: trx })
        .where('companiesId', companiesId)
        .where(target.field, target.id)
        .orderBy('id', 'desc')
        .preload('employeeVerification')
        .first()

      if (last && last.employeeVerification?.ordem == null) return false
      if (verification.ordem !== (last?.employeeVerification?.ordem ?? 0) + 1) return false

      return EmployeeVerificationXCertificate.create({
        marriedCertificateId: payload.marriedCertificateId ?? null,
        bornCertificateId: payload.bornCertificateId ?? null,
        deathCertificateId: payload.deathCertificateId ?? null,
        mandateCertificateId: payload.mandateCertificateId ?? null,
        secondcopyCertificateId: payload.secondcopyCertificateId ?? null,
        communicationCertificateId: payload.communicationCertificateId ?? null,
        companiesId,
        employeeVerificationId: payload.employeeVerificationId,
        userId,
        status: payload.status ?? '',
        date: payload.date as DateTime,
      }, { client: trx })
    })

    if (item === false) {
      return response.status(422).json({ message: 'Selecione a próxima conferência na ordem do certificado' })
    }

    if (!item) return response.status(404).json({ message: 'Certificado não encontrado' })

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
      .preload('mandateCertificate')
      .preload('secondcopyCertificate')
      .preload('communicationCertificate')
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
    const hasMandateCertificate = payload.mandateCertificateId !== undefined
    const hasSecondcopyCertificate = payload.secondcopyCertificateId !== undefined
    const hasCommunicationCertificate = payload.communicationCertificateId !== undefined

    if ([hasMarriedCertificate, hasBornCertificate, hasDeathCertificate, hasMandateCertificate, hasSecondcopyCertificate, hasCommunicationCertificate].filter(Boolean).length > 1) {
      return response.status(422).json({
        message: 'Informe apenas um certificado',
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
      item.mandateCertificateId = null
      item.secondcopyCertificateId = null
      item.communicationCertificateId = null
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
      item.mandateCertificateId = null
      item.secondcopyCertificateId = null
      item.communicationCertificateId = null
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
      item.mandateCertificateId = null
      item.secondcopyCertificateId = null
      item.communicationCertificateId = null
    }
    if (payload.mandateCertificateId !== undefined) {
      const certificate = await MandateCertificate.query().where('id', payload.mandateCertificateId).where('companiesId', companiesId).first()
      if (!certificate) return response.status(422).json({ message: 'O mandado informado não pertence a esta empresa' })
      item.mandateCertificateId = payload.mandateCertificateId
      item.marriedCertificateId = null
      item.bornCertificateId = null
      item.deathCertificateId = null
      item.secondcopyCertificateId = null
      item.communicationCertificateId = null
    }
    if (payload.secondcopyCertificateId !== undefined) {
      const certificate = await SecondcopyCertificate.query().where('id', payload.secondcopyCertificateId).where('companiesId', companiesId).first()
      if (!certificate) return response.status(422).json({ message: 'O certificado de segunda via informado não pertence a esta empresa' })
      item.secondcopyCertificateId = payload.secondcopyCertificateId
      item.marriedCertificateId = null
      item.bornCertificateId = null
      item.deathCertificateId = null
      item.mandateCertificateId = null
      item.communicationCertificateId = null
    }
    if (payload.communicationCertificateId !== undefined) {
      const certificate = await CommunicationCertificate.query().where('id', payload.communicationCertificateId).where('companiesId', companiesId).first()
      if (!certificate) return response.status(422).json({ message: 'A comunicação informada não pertence a esta empresa' })
      item.communicationCertificateId = payload.communicationCertificateId
      item.marriedCertificateId = null
      item.bornCertificateId = null
      item.deathCertificateId = null
      item.mandateCertificateId = null
      item.secondcopyCertificateId = null
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
