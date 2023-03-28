import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BadRequest from 'App/Exceptions/BadRequestException'
import UnAuthorizedException from 'App/Exceptions/UnAuthorizedException'
import Company from 'App/Models/Company'
import CompanyValidator from 'App/Validators/CompanyValidator'
const authorize = require('App/Services/googleDrive/googledrive')

export default class CompaniesController {

  public async index({ auth, response }: HttpContextContract) {

    const authenticate = await auth.use('api').authenticate()
    if (!authenticate.superuser)
      throw new BadRequest('not superuser', 401)

    const data = await Company
      .query()
      .preload('typebooks')
    return response.status(200).send(data)
  }


  //inserir
  public async store({ auth, request, response }: HttpContextContract) {

    const authenticate = await auth.use('api').authenticate()
    if (!authenticate.superuser)
      throw new BadRequest('not superuser', 401)

    const body = await request.validate(CompanyValidator)

    const companyByName = await Company.findBy('name', body.name)
    if (companyByName)
      throw new BadRequest('name already in use', 402, '105')
    //throw new BadRequest('name already in use', 402)
    //throw new UnAuthorizedException("nome já utilizado", 402, "109")

    const companyByShortname = await Company.findBy('shortname', body.shortname)
    if (companyByShortname)
      throw new BadRequest('shortname already in use', 402)

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
    if (!authenticate.superuser)
      throw new BadRequest('not superuser', 401)

    const body = await request.validate(CompanyValidator)

    body['id'] = params.id
    const data = await Company.findOrFail(body.id)
    body.foldername = data.foldername
    await data.fill(body).save()

    return response.status(201).send({
      data,
      params: params.id
    })


  }

}

