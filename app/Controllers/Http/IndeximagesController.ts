import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Indeximage from 'App/Models/Indeximage'

const FileRename = require('../../Services/fileRename/fileRename')
import Application from '@ioc:Adonis/Core/Application'

const fs = require('fs')
export default class IndeximagesController {

  public async store({ request, response }: HttpContextContract) {
    const body = request.only(Indeximage.fillable)
    //const id = params.id
    //Verificar se existe o codigo passado pelo parâmetro
    //await Book.findByOrFail(id)
    //body.id = id

    const data = await Indeximage.create(body)

    response.status(201)
    return {
      message: "Criado com sucesso",
      data: data,
    }

  }

  public async index({ auth, response }) {
    await auth.use('api').authenticate()
    const data = await Indeximage.query()
    return response.send({ data })
  }


  public async show({ params }: HttpContextContract) {
    const data = await Indeximage.findOrFail(params.id)

    return {
      data: data,
    }
  }

  public async destroy({ params }: HttpContextContract) {
    const data = await Indeximage.findOrFail(params.id)

    await data.delete()

    return {
      message: "Livro excluido com sucesso.",
      data: data
    }

  }

  public async update({ request, params }: HttpContextContract) {
    const body = request.only(Indeximage.fillable)
    body.bookrecords_id = params.id
    body.typebooks_id = params.id2
    body.seq = params.id3

    const data = await Indeximage
      .query()
      .where('bookrecords_id', '=', body.bookrecords_id)
      .where('typebooks_id', '=', body.typebooks_id)
      .where('seq', '=', body.seq)
    //const data = await Indeximage.findMany([3,10, 1] )

    await data.fill(body).save()

    return {
      message: 'Tipo de Livro cadastrado com sucesso!!',
      data: data,
      //body: body,
      params: params
    }

  }

  public async uploads({ auth, request, params }: HttpContextContract) {

    const authenticate = await auth.use('api').authenticate()

    const images = request.files('images', {
      size: '6mb',
      extnames: ['jpg', 'png', 'jpeg', 'pdf']
    })

    const files = await FileRename.transformFilesNameToId(images, params, authenticate.companies_id)
    console.log("passei pelo Upload...")

    return files

  }

  public async uploadCapture({ auth, request, params }) {
    
    const authenticate = await auth.use('api').authenticate()
    const { imageCapture } = request.requestData

    let base64Image = imageCapture.split(';base64,').pop();
    const folderPath = Application.tmpPath(`/uploads/Client_${authenticate.companies_id}`)
    
    try {
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath)
      }
    } catch (error) {
      return error
    }
    
    fs.writeFile(`${folderPath}/fileCapture.jpg`, base64Image, { encoding: 'base64' }, function (err) {
      console.log('File created', folderPath);
    });

   
    const file = await FileRename.transformFilesNameToId(`${folderPath}/L1(1).jpg`, params, authenticate.companies_id, true)

    return {sucesso:"sucesso", file, typebook: params.typebooks_id, imageCapture }


  }

  public async download({ auth, params }: HttpContextContract) {

    const fileName = params.id

    const authenticate = await auth.use('api').authenticate()
    const fileDownload = await FileRename.downloadImage(fileName, authenticate.companies_id)
    //const fileInformation = await Indeximage.findBy('file_name', fileName)

    console.log(">>>>>>>FILEINFORMATRION", fileName)

    return { fileDownload, fileName }//{fileDownload, ext: fileInformation.ext}

  }

  //*************************************************************** */
}
