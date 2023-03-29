import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BadRequest from 'App/Exceptions/BadRequestException'
import Company from 'App/Models/Company'
import validations from 'App/Services/Validations/validations'
import CompanyValidator from 'App/Validators/CompanyValidator'
const authorize = require('App/Services/googleDrive/googledrive')

export default class CompaniesController {

  public async index({ auth, response }: HttpContextContract) {

    const authenticate = await auth.use('api').authenticate()
    if (!authenticate.superuser) {
      let errorValidation = await new validations().validations('book_100')
      throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
    }

    const data = await Company
      .query()
      .preload('typebooks')
    return response.status(200).send(data)
  }


  //inserir
  public async store({ auth, request, response }: HttpContextContract) {

    const authenticate = await auth.use('api').authenticate()
    if (!authenticate.superuser) {
      let errorValidation = await new validations().validations('book_100')
      throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
    }

    const body = await request.validate(CompanyValidator)
    const companyByName = await Company.findBy('name', body.name)
    if (companyByName) {
      let errorValidation = await new validations().validations('book_101')
      throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
    }

    const companyByShortname = await Company.findBy('shortname', body.shortname)
    if (companyByShortname) {
      let errorValidation = await new validations().validations('book_102')
      throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
    }

    try {
      const data = await Company.create(body)
      let parent = await authorize.sendSearchOrCreateFolder(data.foldername)

      return response.status(201).send({
        data,
        idfoder: parent
      })

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
      let errorValidation = await new validations().validations('book_100')
      throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
    }

    const body = await request.validate(CompanyValidator)

    try {
      body['id'] = params.id
      const data = await Company.findOrFail(body.id)
      body.foldername = data.foldername
      await data.fill(body).save()

      return response.status(201).send({
        data,
        params: params.id
      })
    } catch (error) {
      throw new BadRequest('Bad Request', 401)
    }



  }

}

