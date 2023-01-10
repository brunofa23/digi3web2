import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Company from 'App/Models/Company'
import CreateCompanyValidator from 'App/Validators/CreateCompanyValidator'
const authorize = require('App/Services/googleDrive/googledrive')

export default class CompaniesController {

  public async index({auth, response }) {

    const authenticate = await auth.use('api').authenticate()
    if(!authenticate.superuser)
      return "Não Possui privilégios para cadastrar empresa"


    const data = await Company
      .query()
      .preload('typebooks')
    return response.send(data)
  }


  //inserir
  public async store({auth, request, response }: HttpContextContract) {

    const authenticate = await auth.use('api').authenticate()
    if(!authenticate.superuser)
      return "Não Possui privilégios para cadastrar empresa"

    const body = request.only(Company.fillable)
    //await request.validate(CreateCompanyValidator)
    console.log("Passei pelo validator");
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
      return error
    }

  }


  //retorna um registro
  public async show({ params, response }: HttpContextContract) {
    const data = await Company.find(params.id)
    return response.send(data)

  }

  //patch ou put
  public async update({ request, params }: HttpContextContract) {

    const body = request.only(Company.fillable)
    await request.validate(CreateCompanyValidator)

    body.id = params.id
    const data = await Company.findOrFail(body.id)
    body.foldername = data.foldername
    await data.fill(body).save()

    return {
      message: 'Empresa atualizada com sucesso!!',
      data: data,
      params: params.id
    }

  }

}

