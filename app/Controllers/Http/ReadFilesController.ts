import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Application from '@ioc:Adonis/Core/Application'
import {readFile}from "App/Services/readFile/readFile"


export default class ReadFilesController {

  public async readFile({ auth, request, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    //console.log("readfile....", authenticate)
    const file = request.file('file', {
      size: '100mb',
      extnames: ['xls', 'xlsx', 'csv']
    })

    if (!file?.isValid || file===undefined) {
      return file?.errors
    }

    await file?.move(Application.tmpPath(`/uploads/Client_${authenticate.companies_id}`))
    const filePath = Application.tmpPath(`/uploads/Client_${authenticate.companies_id}/${file.clientName}`)
    const data = await readFile(filePath)

    console.log('FILE>>', data)
    //const readfile = await readFile()


  }



}
