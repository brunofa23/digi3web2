import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Typebook from 'App/Models/Typebook'
import Company from 'App/Models/Company'
import BadRequest from 'App/Exceptions/BadRequestException'
import TypebookValidator from 'App/Validators/TypebookValidator'

const authorize = require('App/Services/googleDrive/googledrive')


export default class TypebooksController {


  //inserir livro
  public async store({ auth, request, response }: HttpContextContract) {

    const authenticate = await auth.use('api').authenticate()
    //const typebookPayload = request.only(Typebook.fillable)
    const typebookPayload = await request.validate(TypebookValidator)

    typebookPayload.companies_id = authenticate.companies_id

    try {
      const company = await Company.findByOrFail('id', authenticate.companies_id)
      const data = await Typebook.create(typebookPayload)
      const idFolderCompany = await authorize.sendSearchFile(company.foldername)
      await authorize.sendCreateFolder(data.path, idFolderCompany[0].id)

      return response.status(201).send(typebookPayload)


    } catch (error) {

      throw new BadRequest('Error in TypebookStore', 401)
    }

  }


  //listar livro
  public async index({ auth, response, request }: HttpContextContract) {

    const { companies_id } = await auth.use('api').authenticate()
    const typebookPayload = request.only(['name', 'status', 'books_id'])

    if (!companies_id)
      throw new BadRequest('company not exists', 401)

    if (!typebookPayload.name && !typebookPayload.status && !typebookPayload.books_id) {
      const data = await Typebook.query().where("companies_id", '=', companies_id)
      return response.status(200).send(data)
    }
    else {

      let query = " 1=1 "
      let _status
      if (typebookPayload.status !== undefined) {
        if (typebookPayload.status === 'TRUE' || typebookPayload.status === '1')
          _status = 1
        else
          if (typebookPayload.status === 'FALSE' || typebookPayload.status === '0')
            _status = 0
        query += ` and status =${_status} `
      }

      if (typebookPayload.name !== undefined)
        query += ` and name like '%${typebookPayload.name}%' `

      if (typebookPayload.books_id !== undefined) {
        query += ` and books_id = ${typebookPayload.books_id} `
      }
      const data
        = await Typebook.query().where("companies_id", '=', companies_id)
          .preload('bookrecords').preload('book')
          .whereRaw(query)

      return response.status(200).send(data)
    }


  }

  //retorna um registro
  public async show({ auth, params, response }: HttpContextContract) {

    const authenticate = await auth.use('api').authenticate()
    const data = await Typebook.query()
      .where("companies_id", "=", authenticate.companies_id)
      .andWhere('id', "=", params.id).firstOrFail()

    return response.send(data)

  }

  //patch ou put
  public async update({ auth, request, params, response }: HttpContextContract) {

    const authenticate = await auth.use('api').authenticate()
    //const body = request.only(Typebook.fillable)
    const typebookPayload = await request.validate(TypebookValidator)

    typebookPayload.id = params.id
    typebookPayload.companies_id = authenticate.companies_id

    await Typebook.query()
      .where("companies_id", "=", authenticate.companies_id)
      .andWhere('id', "=", params.id).update(typebookPayload)
    return response.status(201).send(typebookPayload)

  }

  //delete
  public async destroy({ auth, params }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    const data = await Typebook.query()
      .where("companies_id", "=", authenticate.companies_id)
      .andWhere('id', "=", params.id).delete()

    return {
      message: "Livro excluido com sucesso.",
      data: data
    }

  }



}
