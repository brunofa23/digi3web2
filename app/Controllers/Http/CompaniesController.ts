import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Company from 'App/Models/Company'
import CreateCompanyValidator from 'App/Validators/CreateCompanyValidator'


export default class CompaniesController {

  public async index({ response }) {
    const data = await Company
      .query()
      .preload('typebooks')
    return response.send(data)
  }


  //inserir
  public async store({ request, response }: HttpContextContract) {

    const body = request.only(Company.fillable)
    await request.validate(CreateCompanyValidator)
    try {

      const data = await Company.create(body)
      response.status(201)
      return {
        message: "Criado com sucesso",
        data: data
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

  // //delete
  // public async destroy({ params }: HttpContextContract) {
  //   const data = await Typebook.query()
  //   .where("companies_id","=",params.companies_id)
  //   .andWhere('id',"=",params.id).delete()

  //   return {
  //     message: "Livro excluido com sucesso.",
  //     data: data
  //   }

  // }

  //patch ou put
  public async update({ request, params }: HttpContextContract) {

    const body = request.only(Company.fillable)
    await request.validate(CreateCompanyValidator)

    body.id = params.id
    const data = await Company.findOrFail(body.id)
    await data.fill(body).save()

    return {
      message: 'Empresa atualizada com sucesso!!',
      data: data,
      params: params.id
    }

  }

}

