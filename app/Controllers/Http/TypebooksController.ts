import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Typebook from 'App/Models/Typebook'
import Company from 'App/Models/Company'
import BadRequest from 'App/Exceptions/BadRequestException'
import TypebookValidator from 'App/Validators/TypebookValidator'
import validations from 'App/Services/Validations/validations'
import Book from 'App/Models/Book'
import DocumentConfig from 'App/Models/DocumentConfig'
import { sendSearchFile, sendCreateFolder } from "App/Services/googleDrive/googledrive"
//const authorize = require('App/Services/googleDrive/googledrive')
const fileRename = require('App/Services/fileRename/fileRename')

export default class TypebooksController {

  //inserir livro
  public async store({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const typebookPayload = await request.validate(TypebookValidator)
    const book = await Book.find(typebookPayload.books_id)
    typebookPayload.companies_id = authenticate.companies_id

    try {
      const company = await Company.findByOrFail('id', authenticate.companies_id)
      const data = await Typebook.create(typebookPayload)

      if (data.$attributes.books_id == 13) {
        await DocumentConfig
          .create({
            typebooks_id: data.$attributes.id,
            companies_id: authenticate.companies_id,
            prot: "Protocolo",
            month: "Mês",
            yeardoc: "Ano",
            documenttype_id: "Tipo Documento",
            free: "Gratuito",
            book_name: "Nome do Livro",
            book_number: "Num. Livro",
            sheet_number: "Folha"
          })
      }

      const path = `Client_${typebookPayload.companies_id}.Book_${data.id}.${book?.namefolder}`

      await Typebook.query().where('id', '=', data.id)
        .andWhere('companies_id', '=', typebookPayload.companies_id)
        .update({ path: path })

      const idFolderCompany = await sendSearchFile(company.foldername, company.cloud)
      const verifyFolder = await sendSearchFile(path, company.cloud)
      if (verifyFolder.length > 0) {
        return
      }
      await sendCreateFolder(path, company.cloud, idFolderCompany[0].id)
      let successValidation = await new validations('typebook_success_100')
      return response.status(201).send(typebookPayload, successValidation.code)

    } catch (error) {
      throw new BadRequest('Bad Request - Create Typebook', 401, error)
    }

  }
  //listar livro
  public async index({ auth, response, request }: HttpContextContract) {

    const { companies_id } = await auth.use('api').authenticate()
    const typebookPayload = request.only(['name', 'status', 'books_id', 'totalfiles'])
    let data
    let query = " 1=1 "

    if (!companies_id)
      throw new BadRequest('company not exists', 401)
    if (!typebookPayload.name && !typebookPayload.status && !typebookPayload.books_id) {
      data = await Typebook.query()
        .preload('documentconfig')
        .preload('book')
        .where("companies_id", '=', companies_id)
    }
    else {
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
      data = await Typebook.query()
        .preload('book')
        .where("companies_id", '=', companies_id)
        .whereRaw(query)
        .orderBy('name')


    }

    if (typebookPayload.totalfiles) {
      data = await Typebook.query()
        .where("companies_id", '=', companies_id)
        .whereRaw(query).andWhere("status", "=", 1)
      for (let i = 0; i < data.length; i++) {
        const totalFiles = await fileRename.totalFilesInFolder(data[i].path)
        data[i].totalFiles = totalFiles.length
      }
    }
    return response.status(200).send(data)
  }

  //retorna um registro
  public async show({ auth, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const data = await Typebook.query()
      .preload('documentconfig')
      .where("companies_id", "=", authenticate.companies_id)
      .andWhere('id', "=", params.id).firstOrFail()
    return response.status(200).send(data)
  }

  //patch ou put
  public async update({ auth, request, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const typebookPayload = await request.validate(TypebookValidator)
    typebookPayload.id = params.id
    typebookPayload.companies_id = authenticate.companies_id

    try {
      await Typebook.query()
        .where("companies_id", "=", authenticate.companies_id)
        .andWhere('id', "=", params.id).update(typebookPayload)

      let successValidation = await new validations('typebook_success_101')
      return response.status(201).send(typebookPayload, successValidation.code)
    } catch (error) {
      throw new BadRequest('Bad Request - update', 401)
    }


  }

  //delete
  public async destroy({ auth, params, response }: HttpContextContract) {

    const authenticate = await auth.use('api').authenticate()
    try {
      const data = await Typebook.query()
        .where("companies_id", "=", authenticate.companies_id)
        .andWhere('id', "=", params.id).delete()
      let successValidation = await new validations('typebook_success_102')
      return response.status(200).send(data, successValidation.code)
    } catch (error) {

      let errorValidation = await new validations('typebook_error_102')
      return response.status(500).send(errorValidation.code)

    }
  }


  public async allTypebook({ auth, response, request }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const typebookPayload = request.only(['companies_id'])

    //console.log(authenticate)
    //let data
    //let query = " 1=1 "
    // data = await Typebook.query()
    //   .whereRaw(query)

    const query = Typebook.query()
    if (!authenticate.superuser)
      query.where('companies_id', authenticate.companies_id)
    else if (typebookPayload.companies_id)
      query.where('companies_id', typebookPayload.companies_id)
    //query += ` and companies_id=${typebookPayload.companies_id}`

    const data = await query
    return response.status(200).send(data)
  }




}
