import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BadRequest from 'App/Exceptions/BadRequestException'
import Company from 'App/Models/Company'
import CreateCompanyValidator from 'App/Validators/CreateCompanyValidator'
const authorize = require('App/Services/googleDrive/googledrive')

export default class CompaniesController {

  public async index({ auth, response }: HttpContextContract) {

    const authenticate = await auth.use('api').authenticate()
    if (!authenticate.superuser)
      throw new BadRequest('not superuser', 401)

    const data = await Company
      .query()
      .preload('typebooks')
    return response.send(data)
  }


  //inserir
  public async store({ auth, request, response }: HttpContextContract) {

    const authenticate = await auth.use('api').authenticate()
    if (!authenticate.superuser)
      throw new BadRequest('not superuser', 401)

    //const body = request.only(Company.fillable)
    const body = await request.validate(CreateCompanyValidator)

    const companyByName = await Company.findBy('name', body.name)
    if (companyByName)
      throw new BadRequest('name already in use', 402)

    const companyByShortname = await Company.findBy('shortname', body.shortname)
    if (companyByShortname)
      throw new BadRequest('shortname already in use', 402)


    try {
      const data = await Company.create(body)
      let parent = await authorize.sendSearchOrCreateFolder(data.foldername)

      response.status(201)
      return {
        message: "Criado com sucesso",
        data: data,
        idfolder: parent
      }

    } catch (error) {
      //return response.status(401)
      throw new BadRequest('not superuser', 401)
    }

  }


  //retorna um registro
  public async show({ params, response }: HttpContextContract) {
    const data = await Company.find(params.id)
    return response.send(data)

  }

  //patch ou put
  public async update({ auth, request, params }: HttpContextContract) {

    const authenticate = await auth.use('api').authenticate()
    if (!authenticate.superuser)
      return "Não Possui privilégios para cadastrar empresa"

    const body = request.only(Company.fillable)
    //await request.validate(CreateCompanyValidator)

    body.id = params.id
    const data = await Company.findOrFail(body.id)
    body.foldername = data.foldername
    //return (body)
    await data.fill(body).save()

    return {
      message: 'Empresa atualizada com sucesso!!',
      data: data,
      params: params.id
    }

  }

}

