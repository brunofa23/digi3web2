import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Typebook from 'App/Models/Typebook'
import Company from 'App/Models/Company'
import AuthenticationController from './AuthenticationController'
import { Response } from '@adonisjs/core/build/standalone'
import Schema from '@ioc:Adonis/Lucid/Schema'

import { schema } from '@ioc:Adonis/Core/Validator'
import { authenticate } from '@google-cloud/local-auth'

const authorize = require('App/Services/googleDrive/googledrive')


export default class TypebooksController {


  //inserir livro
  public async store({ auth, request, response }: HttpContextContract) {

    const authenticate = await auth.use('api').authenticate()
    const body = request.only(Typebook.fillable)
    body.companies_id = authenticate.companies_id

    try {
      const company = await Company.findByOrFail('id', authenticate.companies_id)
      const data = await Typebook.create(body)

      console.log(">>>typebook folder");

      const idFolderCompany = await authorize.sendSearchFile(company.foldername)
      await authorize.sendCreateFolder(data.path, idFolderCompany[0].id)

      response.status(201)
      return {
        message: "Criado com sucesso",
        data: data,
      }

    } catch (error) {
      return error//response.status(401)
    }

  }


  //listar livro
  public async index({ auth, request, response }) {
    const { companies_id } = await auth.use('api').authenticate()
    const { name, status, books_id } = request.requestData

    if (!companies_id)
      return "error"

    if (!name && !status && !books_id) {
      const data = await Typebook.query().where("companies_id", '=', companies_id)
      return response.send(data)
    }
    else {

      let query = " 1=1 "
      let _status
      if (status !== undefined) {
        if (status === 'TRUE' || status === '1')
          _status = 1
        else
          if (status === 'FALSE' || status === '0')
            _status = 0
        query += ` and status =${_status} `
      }

      if (name !== undefined)
        query += ` and name like '%${name}%' `

      if (books_id !== undefined) {
        query += ` and books_id = ${books_id} `
      }

      const data
        = await Typebook.query().where("companies_id", '=', companies_id)
          .preload('bookrecords').preload('book')
          .whereRaw(query)


      return response.send(data)
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
  public async update({ auth, request, params }: HttpContextContract) {

    const authenticate = await auth.use('api').authenticate()
    const body = request.only(Typebook.fillable)

    body.id = params.id
    body.companies_id = authenticate.companies_id

    const data = await Typebook.query()
      .where("companies_id", "=", authenticate.companies_id)
      .andWhere('id', "=", params.id).update(body)

    return {
      message: 'Tipo de Livro atualizado com sucesso!!',
      data: data,
      body: body,
      params: params.id
    }

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
