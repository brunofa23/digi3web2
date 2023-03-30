import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BadRequest from 'App/Exceptions/BadRequestException'
import Company from 'App/Models/Company'
import validations from 'App/Services/Validations/validations'
import CompanyValidator from 'App/Validators/CompanyValidator'
const authorize = require('App/Services/googleDrive/googledrive')

export default class CompaniesController {

  public async index({ auth, response, request }: HttpContextContract) {

    const authenticate = await auth.use('api').authenticate()
    if (!authenticate.superuser) {
      let errorValidation = await new validations('company_error_100')
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
      let errorValidation = await new validations('company_error_100')
      throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
    }

    const body = await request.validate(CompanyValidator)
    const companyByName = await Company.findBy('name', body.name)
    if (companyByName) {
      let errorValidation = await new validations('company_error_101')
      throw new BadRequest(errorValidation['messages'], errorValidation.status, errorValidation.code)
    }

    const companyByShortname = await Company.findBy('shortname', body.shortname)
    if (companyByShortname) {
      let errorValidation = await new validations('company_error_102')
      throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
    }

    try {
      const data = await Company.create(body)
      let parent = await authorize.sendSearchOrCreateFolder(data.foldername)

      let successValidation = await new validations('company_success_100')
      return response.status(201).send({ data, idfoder: parent, successValidation: successValidation.code })

    } catch (error) {
      throw new BadRequest('Bad Request', 401)
    }

  }


  //retorna um registro
  public async show({ params, response }: HttpContextContract) {
    const data = await Company.find(params.id)
    return response.send(data)

  }

  //patch ou put
  public async update({ auth, request, params, response }: HttpContextContract) {

    const authenticate = await auth.use('api').authenticate()
    if (!authenticate.superuser) {
      let errorValidation = await new validations('company_error_100')
      throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
    }
    const body = await request.validate(CompanyValidator)


    try {
      body['id'] = params.id
      const data = await Company.findOrFail(body.id)
      body.foldername = data.foldername
      await data.fill(body).save()
      let successValidation = await new validations('company_success_101')
      return response.status(201).send({
        data,
        params: params.id,
        successValidation: successValidation.code
      })
    } catch (error) {
      throw new BadRequest('Bad Request update', 401, 'company_error_102')
    }



  }

}

