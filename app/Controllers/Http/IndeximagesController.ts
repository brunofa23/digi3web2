import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Indeximage from 'App/Models/Indeximage'
import Application from '@ioc:Adonis/Core/Application'
import BadRequestException from 'App/Exceptions/BadRequestException'
import Format from '../../Services/Dates/format'
import Bookrecord from 'App/Models/Bookrecord'

import Typebook from 'App/Models/Typebook'

const formatDate = new Format(new Date)
const FileRename = require('../../Services/fileRename/fileRename')
const fs = require('fs')
const path = require('path')
const { Logtail } = require("@logtail/node");
//const logtail = new Logtail("2QyWC3ehQAWeC6343xpMSjTQ");

export default class IndeximagesController {

  public async store({ request, response }: HttpContextContract) {
    const body = request.only(Indeximage.fillable)

    try {
      const data = await Indeximage.create(body)
      return response.status(201).send(data)

    } catch (error) {
      throw new BadRequestException('Bad Request', 401, error)
    }

  }

  public async index({ auth, response }) {
    console.log("TESTE INDEX API......")
    await auth.use('api').authenticate()

    const data = await Indeximage.query()
      .preload('typebooks')
      .preload('company')
      .preload('bookrecord')
      .where('bookrecords_id', '=', 12394)
      .andWhere('typebooks_id', '=', 2)
      .andWhere('companies_id', '=', 16)



    // const data = await Typebook.query()
    //   .preload('company')
    //   .where('id', '=', 2)
    //   .andWhere('companies_id', 16)

    return response.send({ data })
  }


  public async show({ params }: HttpContextContract) {
    const data = await Indeximage.findOrFail(params.id)

    return {
      data: data,
    }
  }

  public async destroy({ auth, request, params, response }: HttpContextContract) {

    const { companies_id } = await auth.use('api').authenticate()
    try {
      //excluir imagens do google drive
      const listOfImagesToDeleteGDrive = await Indeximage.query()
        .preload('typebooks')
        .where('typebooks_id', '=', params.typebooks_id)
        .andWhere('bookrecords_id', "=", params.bookrecords_id)
        .andWhere('companies_id', "=", companies_id)
        .andWhere('file_name', "like", params.file_name)

      if (listOfImagesToDeleteGDrive.length > 0) {
        var file_name = listOfImagesToDeleteGDrive.map(function (item) {
          return { file_name: item.file_name, path: item.typebooks.path }   //retorna o item original elevado ao quadrado
        });
        console.log("entrei do delete...", file_name)
        FileRename.deleteFile(file_name)
      }

      await Indeximage.query()
        .where('typebooks_id', '=', params.typebooks_id)
        .andWhere('bookrecords_id', "=", params.bookrecords_id)
        .andWhere('companies_id', "=", companies_id)
        .andWhere('file_name', "like", params.file_name)
        .delete()

      return response.status(201).send({ message: "Excluido com sucesso!!" })
    } catch (error) {
      return error

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
    } catch (error) {

      throw new BadRequestException('Bad Request', 401)
    }

  }

  public async uploads({ auth, request, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const images = request.files('images', {
      size: '6mb',
      extnames: ['jpg', 'png', 'jpeg', 'pdf', 'JPG', 'PNG', 'JPEG', 'PDF']
    })
    const { dataImages } = request['requestBody']
    const { indexImagesInitial } = request['requestData']


    if (indexImagesInitial == 'true') {
      const listFilesImages = images.map((image) => {
        const imageName = image.clientName
        return imageName
      })
      const listFiles = await FileRename.indeximagesinitial("", authenticate.companies_id, listFilesImages)
      //console.log("LISTA DE ARQUIVOS...", sendFiles)
      for (const item of listFiles.bookRecord) {
        try {
          await Bookrecord.create(item)
          console.log("CREATE>>>>", item)
        } catch (error) {
          console.log("ERRO BOOKRECORD::", error)
        }
      }
      for (const item of listFiles.indexImages) {
        try {
          await Indeximage.create(item)
        } catch (error) {
          console.log("ERRO indeximage::", error)

        }
      }
    }

    const files = await FileRename.transformFilesNameToId(images, params, authenticate.companies_id, false, dataImages)
    return response.status(201).send({ files, message: "Arquivo Salvo com sucesso!!!" })

  }

  public async uploadCapture({ auth, request, params }) {

    const authenticate = await auth.use('api').authenticate()
    const { imageCaptureBase64, cod, id } = request.requestData
    let base64Image = imageCaptureBase64.split(';base64,').pop();
    const folderPath = Application.tmpPath(`/uploads/Client_${authenticate.companies_id}`)
    try {
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath)
      }
    } catch (error) {
      return error
    }

    const dateNow = formatDate.formatDate(new Date)
    const file_name = `Id${id}_(${cod})_${params.typebooks_id}_${dateNow}`
    console.log("FILENAME:::", file_name)

    fs.writeFile(`${folderPath}/${file_name}.jpeg`, base64Image, { encoding: 'base64' }, function (err) {
      //logtail.info('File created', { folderPath })
      console.log('File created', { folderPath })
    });

    const file = await FileRename.transformFilesNameToId(`${folderPath}/${file_name}.jpeg`, params, authenticate.companies_id, true)
    return { sucesso: "sucesso", file, typebook: params.typebooks_id }
  }

  public async download({ auth, params, request }: HttpContextContract) {

    const authenticate = await auth.use('api').authenticate()
    const { typebook_id } = request.only(['typebook_id'])
    const body = request.only(Indeximage.fillable)
    const fileName = params.id
    const fileDownload = await FileRename.downloadImage(fileName, typebook_id, authenticate.companies_id)

    return { fileDownload, fileName, extension: path.extname(fileName), body }

  }

  //*************************************************************** */
}
