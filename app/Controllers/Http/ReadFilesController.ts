import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Application from '@ioc:Adonis/Core/Application'
import {readFile}from "App/Services/readFile/readFile"
import Bookrecord from 'App/Models/Bookrecord'
import Document from 'App/Models/Document'


export default class ReadFilesController {

  public async readFile({ auth, request, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const {typebooks_id, books_id, companies_id}=request.only(['typebooks_id', 'books_id', 'companies_id'])

    console.log("readfile....", typebooks_id, books_id, companies_id)

    const file = request.file('file', {
      size: '100mb',
      extnames: ['xls', 'xlsx', 'csv']
    })

    if (!file?.isValid || file===undefined) {
      return file?.errors
    }

    await file?.move(Application.tmpPath(`/uploads/Client_${authenticate.companies_id}`))
    const filePath = Application.tmpPath(`/uploads/Client_${authenticate.companies_id}/${file.clientName}`)
    const bookrecords = await readFile(filePath)

    for (const bookrecord of bookrecords) {
      const searchPayload = { id: bookrecord.id, typebooks_id:typebooks_id, books_id:books_id, companies_id:companies_id }
      const persistanceBookrecord = { id: bookrecord.id, typebooks_id:53, books_id:13, companies_id:10 }
      const retorno =  await Bookrecord.updateOrCreate(searchPayload, persistanceBookrecord)
      //console.log("retorno", retorno.id)


    }



    //INSERIR ID, COD, BOOK(BOX) DENTRO DE BOOKRECORDS
    //APOS INSERIR PEGAR O ID DE RETORNO E INSERIR O RESTANTE DE CAMPOS






  }



}
