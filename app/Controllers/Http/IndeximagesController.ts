import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Indeximage from 'App/Models/Indeximage'
import Application from '@ioc:Adonis/Core/Application'
import { DateTime } from 'luxon'
import BadRequestException from 'App/Exceptions/BadRequestException'

const FileRename = require('../../Services/fileRename/fileRename')
const Date = require('../../Services/Dates/format')
const { Logtail } = require("@logtail/node");
const logtail = new Logtail("2QyWC3ehQAWeC6343xpMSjTQ");
const fs = require('fs')

export default class IndeximagesController {

  public async store({ request, response }: HttpContextContract) {
    const body = request.only(Indeximage.fillable)

    try {
      const data = await Indeximage.create(body)
      return response.status(201).send(data)

    } catch (error) {
      throw new BadRequestException('Bad Request', 401)
    }
    // return {
    //   message: "Criado com sucesso",
    //   data: data,
    // }

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

  public async update({ request, params, response }: HttpContextContract) {
    const body = request.only(Indeximage.fillable)
    body.bookrecords_id = params.id
    body.typebooks_id = params.id2
    body.seq = params.id

    try {
      const data = await Indeximage
        .query()
        .where('bookrecords_id', '=', body.bookrecords_id)
        .where('typebooks_id', '=', body.typebooks_id)
        .where('seq', '=', body.seq)
      await data.fill(body).save()
      return response.status(201).send(data)

      // return {
      //   message: 'Tipo de Livro cadastrado com sucesso!!',
      //   data: data,
      //   //body: body,
      //   params: params
      // }

    } catch (error) {

      throw new BadRequestException('Bad Request', 401)
    }



  }

  public async uploads({ auth, request, params }: HttpContextContract) {

    const authenticate = await auth.use('api').authenticate()

    const images = request.files('images', {
      size: '6mb',
      extnames: ['jpg', 'png', 'jpeg', 'pdf']
    })

    const files = await FileRename.transformFilesNameToId(images, params, authenticate.companies_id)
    return files

  }

  public async uploadCapture({ auth, request, params }) {

    logtail.info("Entrei no upload capture")
    const authenticate = await auth.use('api').authenticate()
    const { imageCaptureBase64, cod, id } = request.requestData

    logtail.info('request>>>', { cod, id })

    let base64Image = imageCaptureBase64.split(';base64,').pop();
    const folderPath = Application.tmpPath(`/uploads/Client_${authenticate.companies_id}`)

    try {
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath)
      }
    } catch (error) {
      return error
    }
    var dateNow = Date.format(DateTime.now())
    const file_name = `Id${id}_(${cod})_${params.typebooks_id}_${dateNow}`

    fs.writeFile(`${folderPath}/${file_name}.jpeg`, base64Image, { encoding: 'base64' }, function (err) {
      console.log('File created', folderPath);
      logtail.info('File created', { folderPath })
    });

    const file = await FileRename.transformFilesNameToId(`${folderPath}/${file_name}.jpeg`, params, authenticate.companies_id, true)
    console.log(">>>FINAL NO UPLOAD CAPTURE")
    logtail.info('>>>FINAL NO UPLOAD CAPTURE')

    return { sucesso: "sucesso", file, typebook: params.typebooks_id }


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
