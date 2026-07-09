import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BadRequest from 'App/Exceptions/BadRequestException'
import Company from 'App/Models/Company'
import Entity from 'App/Models/Entity'
import validations from 'App/Services/Validations/validations'
import CompanyValidator from 'App/Validators/CompanyValidator'
import { sendSearchOrCreateFolder } from "App/Services/googleDrive/googledrive"

//const authorize = require('App/Services/googleDrive/googledrive')

export default class CompaniesController {
  private async validateFinEntityLink(authenticate: any, finEntityId?: number | null, companyId?: number) {
    if (!finEntityId) return

    const entity = await Entity
      .query()
      .where('id', finEntityId)
      .where('companies_id', authenticate.companies_id)
      .first()

    if (!entity) {
      throw new BadRequest('Entidade financeira inválida para a empresa logada', 400, 'company_error_fin_entity')
    }

    const linkedCompany = await Company
      .query()
      .where('fin_entity_id', finEntityId)
      .if(companyId, query => {
        query.andWhereNot('id', companyId!)
      })
      .first()

    if (linkedCompany) {
      throw new BadRequest('Entidade financeira já vinculada a outra empresa', 400, 'company_error_fin_entity_linked')
    }
  }

  public async index({ auth, response, request }: HttpContextContract) {

    const authenticate = await auth.use('api').authenticate()
    if (!authenticate.superuser) {
      let errorValidation: any = await new validations('company_error_100')
      throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
    }

    const { status } = request.only(['status'])
    let query = " 1=1 "
    if (status)
      query += ` and status=${status} `

    try {
      const data = await Company
        .query()
        .preload('typebooks')
        .preload('situations')
        .preload('finentity')
        .whereRaw(query)

      return response.status(200).send(data)
    } catch (error) {
      throw new BadRequest('Bad Request', 401, 'erro')
    }

  }


  //inserir
  public async store({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    if (!authenticate.superuser) {
      let errorValidation: any = await new validations('company_error_100')
      throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
    }
    const body = await request.validate(CompanyValidator)
    const { situation_ids: situationIds, ...companyPayload } = body
    await this.validateFinEntityLink(authenticate, companyPayload.fin_entity_id)
    const companyByName = await Company.findBy('name', companyPayload.name)

    if (companyByName) {
      let errorValidation: any = await new validations('company_error_101')
      throw new BadRequest(errorValidation['messages'], errorValidation.status, errorValidation.code)
    }


    const companyByShortname = await Company.findBy('shortname', companyPayload.shortname)
    if (companyByShortname) {
      let errorValidation: any = await new validations('company_error_102')
      throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
    }
    try {
      const data = await Company.create(companyPayload as any)
      await data.related('situations').sync(situationIds || [])
      await data.load('situations')
      await data.load('finentity')
      let parent = await sendSearchOrCreateFolder(data.foldername, data.cloud)
      let successValidation: any = await new validations('company_success_100')
      return response.status(201).send({ data, idfoder: parent, successValidation: successValidation.code })

    } catch (error) {
      throw new BadRequest('Bad Request', 401)
    }

  }


  //retorna um registro
  public async show({ params, response }: HttpContextContract) {
    const data = await Company
      .query()
      .preload('situations')
      .preload('finentity')
      .where('id', params.id)
      .first()
    return response.send(data)
  }

  //patch ou put
  public async update({ auth, request, response }: HttpContextContract) {

    const authenticate = await auth.use('api').authenticate()
    if (!authenticate.superuser) {
      let errorValidation: any = await new validations('company_error_100')
      throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
    }

    const companyId = Number(request.param('id'))
    if (!companyId) {
      throw new BadRequest('Empresa inválida', 400, 'company_error_update')
    }

    const body = await request.validate(CompanyValidator)
    const situationIds = body.situation_ids || []
    const data = await Company.findOrFail(companyId)
    await this.validateFinEntityLink(authenticate, body.fin_entity_id, companyId)

    if (body.name !== data.name) {
      const companyByName = await Company.query()
        .where('name', body.name)
        .andWhereNot('id', companyId)
        .first()

      if (companyByName) {
        let errorValidation: any = await new validations('company_error_101')
        throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
      }
    }

    if (body.shortname !== data.shortname) {
      const companyByShortname = await Company.query()
        .where('shortname', body.shortname)
        .andWhereNot('id', companyId)
        .first()

      if (companyByShortname) {
        let errorValidation: any = await new validations('company_error_102')
        throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
      }
    }

    data.merge({
      name: body.name,
      shortname: body.shortname,
      address: body.address,
      number: body.number,
      complement: body.complement,
      postalcode: body.postalcode,
      district: body.district,
      city: body.city,
      state: body.state,
      cnpj: body.cnpj,
      responsablename: body.responsablename,
      phoneresponsable: body.phoneresponsable,
      email: body.email,
      status: body.status,
      cloud: body.cloud,
      use_device_control: body.use_device_control || false,
      use_device_cookie_control: body.use_device_cookie_control || false,
      module_books: body.module_books || false,
      module_financial: body.module_financial || false,
      module_lgpd: body.module_lgpd || false,
      obs: body.obs || '',
      licence_value: body.licence_value || null,
      due_date: body.due_date || null,
      fin_entity_id: body.fin_entity_id || null,
    })

    await data.save()
    await data.related('situations').sync(situationIds)
    await data.load('situations')
    await data.load('finentity')

    let successValidation: any = await new validations('company_success_101')
    return response.status(201).send({
      data,
      params: companyId,
      successValidation: successValidation.code
    })


  }

}
