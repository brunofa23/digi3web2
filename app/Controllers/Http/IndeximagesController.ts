import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Indeximage from 'App/Models/Indeximage'
import Application from '@ioc:Adonis/Core/Application'
import BadRequestException from 'App/Exceptions/BadRequestException'
import Format from '../../Services/Dates/format'
import Bookrecord from 'App/Models/Bookrecord'
import Company from 'App/Models/Company'
import Typebook from 'App/Models/Typebook'
// import { logInJson } from "App/Services/util"
// import { base64 } from '@ioc:Adonis/Core/Helpers'
// import ConfigsController from './ConfigsController'

const formatDate = new Format(new Date)
const FileRename = require('../../Services/fileRename/fileRename')
const fs = require('fs')
const path = require('path')


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
    await auth.use('api').authenticate()
    const data = await Indeximage.query()
      .preload('typebooks', (queryIndex) => {
        queryIndex.where("id", 2)
          .andWhere('companies_id', '=', 16)
      })
      .where('bookrecords_id', '=', 12394)
      .andWhere('typebooks_id', '=', 2)
      .andWhere('companies_id', '=', 16)

    return response.send({ data })
  }


  public async show({ params }: HttpContextContract) {
    const data = await Indeximage.findOrFail(params.id)

    return {
      data: data,
    }
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    const { companies_id } = await auth.use('api').authenticate()
    try {
      //excluir imagens do google drive
      const query = Indeximage.query()
        .preload('typebooks', (query) => {
          query.where('id', params.typebooks_id)
            .andWhere('companies_id', companies_id)
        })
        // .preload('companies', query=>{
        //   query.where('companies_id', companies_id)
        // })
        .preload('company')
        .where('typebooks_id', '=', params.typebooks_id)
        .andWhere('bookrecords_id', "=", params.bookrecords_id)
        .andWhere('companies_id', "=", companies_id)
        .andWhere('file_name', "like", decodeURIComponent(params.file_name))

      const listOfImagesToDeleteGDrive = await query.first()
      if (listOfImagesToDeleteGDrive) {
        var file_name = { file_name: listOfImagesToDeleteGDrive.file_name, path: listOfImagesToDeleteGDrive.typebooks.path }
        FileRename.deleteFile([file_name], listOfImagesToDeleteGDrive.company.cloud)
      }

      await Indeximage.query()
        .where('typebooks_id', '=', params.typebooks_id)
        .andWhere('bookrecords_id', "=", params.bookrecords_id)
        .andWhere('companies_id', "=", companies_id)
        .andWhere('file_name', "like", decodeURIComponent(params.file_name))
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
    const company = await Company.find(authenticate.companies_id)
    const images = request.files('images', {
      size: '100mb',
      extnames: ['jpg', 'png', 'jpeg', 'pdf', 'JPG', 'PNG', 'JPEG', 'PDF'],
    })

    const { dataImages } = request['requestBody']
    const { indexImagesInitial, updateImage } = request['requestData']

    if (indexImagesInitial == 'true') {//Através do nome da imagem é recriado o registro no bookrecord
      const listFilesImages = images.map((image) => {
        const imageName = image.clientName
        return imageName
      })
      const listFiles = await FileRename.indeximagesinitial("", authenticate.companies_id, company?.cloud, listFilesImages)
      for (const item of listFiles.bookRecord) {
        try {
          await Bookrecord.create(item)
        } catch (error) {
          console.log("ERRO BOOKRECORD::", error)
        }
      }
    }
    if (updateImage) {
      const query = Bookrecord.query()
        .where('typebooks_id', params.typebooks_id)
        .andWhere('companies_id', authenticate.companies_id)
        .andWhere('book', dataImages.book)
        .andWhere('sheet', dataImages.sheet)
        .andWhere('side', dataImages.side)
      if (dataImages.indexBook)
        query.andWhere('indexbook', dataImages.indexBook)
      const bookRecord = await query.first()

      if (!bookRecord) {
        const books_id = await Typebook.query().where('id', params.typebooks_id)
          .andWhere('companies_id', authenticate.companies_id).first()

        const codBookrecord = await Bookrecord.query()
          .where('typebooks_id', params.typebooks_id)
          .andWhere('companies_id', authenticate.companies_id)
          .max('cod as max_cod').firstOrFail()

        if (books_id)
          await Bookrecord.create({
            typebooks_id: params.typebooks_id,
            companies_id: authenticate.companies_id,
            cod: (codBookrecord?.$extras.max_cod + 1),
            books_id: books_id.books_id,
            book: dataImages.book,
            sheet: dataImages.sheet,
            side: dataImages.side,
            indexbook: dataImages.indexBook
          })
      }

    }

    const files = await FileRename.transformFilesNameToId(images, params, authenticate.companies_id, company?.cloud, false, dataImages)
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
    fs.writeFile(`${folderPath}/${file_name}.jpeg`, base64Image, { encoding: 'base64' }, function (err) {
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
    const company = await Company.find(authenticate.companies_id)
    const fileDownload = await FileRename.downloadImage(fileName, typebook_id, authenticate.companies_id, company?.cloud)

    //console.log("file::::::::", fileDownload)

    return { fileDownload: fileDownload.dataURI, fileName, extension: path.extname(fileName), body, size: fileDownload.size }

  }

  //*************************************************************** */
}
