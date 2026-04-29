import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Indeximage from 'App/Models/Indeximage'
import Application from '@ioc:Adonis/Core/Application'
import BadRequestException from 'App/Exceptions/BadRequestException'
import Format from '../../Services/Dates/format'
import Bookrecord from 'App/Models/Bookrecord'
import Company from 'App/Models/Company'
import Typebook from 'App/Models/Typebook'
import Document from 'App/Models/Document'
import Database from '@ioc:Adonis/Lucid/Database'

import sharp from 'sharp'

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
    
    // Arquivos sempre vêm por multipart
    const images = request.files('images', {
      size: '100mb',
      extnames: ['jpg', 'png', 'jpeg', 'pdf', 'JPG', 'PNG', 'JPEG', 'PDF', 'jfif', 'JFIF'],
    })
    
    /**
     * ✅ PADRÃO NOVO:
     * - dataImages vem em multipart como string JSON em request.input('dataImages')
     * ✅ COMPATIBILIDADE:
     * - se ainda vier do legado (request['requestBody']), ainda aceita
    */
   let dataImagesRaw: any = request.input('dataImages')
   
    // fallback legado (caso Vue antigo ainda mande via interceptor custom)
    if (!dataImagesRaw) {
      dataImagesRaw = request?.['requestBody']?.dataImages
    }

    let dataImages: any = {}
    if (dataImagesRaw) {
      try {
        dataImages = typeof dataImagesRaw === 'string' ? JSON.parse(dataImagesRaw) : dataImagesRaw
      } catch (err) {
        // se não for JSON, não quebra
        dataImages = dataImagesRaw
      }
    }

    /**
     * ✅ Flags padronizadas: via querystring (mantém teu padrão atual)
     * Ex: ?updateImage=true
     */
    const indexImagesInitial = request.input('indexImagesInitial') === 'true'
    const updateImage = request.input('updateImage') === 'true'
    const updateImageDocument = request.input('updateImageDocument') === 'true'

    // 🔹 Flag de paisagem (pode vir boolean/number/string dentro de dataImages)
    const landscape = !!(
      dataImages?.landscape === true ||
      dataImages?.landscape === 'true' ||
      dataImages?.landscape === 1 ||
      dataImages?.landscape === '1'
    )

    // Através do nome da imagem é recriado o registro no bookrecord
    if (indexImagesInitial) {
      const listFilesImages = images.map((image) => image.clientName)
      const listFiles = await FileRename.indeximagesinitial(
        '',
        authenticate.companies_id,
        company?.cloud,
        listFilesImages
      )

      for (const item of listFiles.bookRecord) {
        try {
          await Bookrecord.create(item)
        } catch (error) {
          console.log('ERRO BOOKRECORD::', error)
        }
      }
    }

    // ATUALIZAÇÃO DE LIVROS
    if (updateImage) {
      // ✅ evita 500 do ".where expects value to be defined"
      if (dataImages?.book === undefined || dataImages?.book === null || dataImages?.book === '') {
        return response.status(422).send({ message: 'Campo "book" é obrigatório em dataImages.' })
      }

      const query = Bookrecord.query()
        .where('typebooks_id', params.typebooks_id)
        .andWhere('companies_id', authenticate.companies_id)
        .andWhere('book', dataImages.book)

      if (dataImages.side) query.andWhere('side', dataImages.side)
      if (dataImages.sheet !== undefined && dataImages.sheet !== null && dataImages.sheet !== '')
        query.andWhere('sheet', dataImages.sheet)

      if (dataImages.indexBook) query.andWhere('indexbook', dataImages.indexBook)

      if (dataImages.approximateTerm) {
        query.andWhere('approximate_term', dataImages.approximateTerm)
      }

      const bookRecord = await query.first()

      if (!bookRecord || dataImages.sheet == 0) {
        const books_id = await Typebook.query()
          .where('id', params.typebooks_id)
          .andWhere('companies_id', authenticate.companies_id)
          .first()

        const codBookrecord = await Bookrecord.query()
          .where('typebooks_id', params.typebooks_id)
          .andWhere('companies_id', authenticate.companies_id)
          .max('cod as max_cod')
          .firstOrFail()

        if (dataImages.sheet == 0 && books_id) {
          const book = await Bookrecord.create({
            typebooks_id: params.typebooks_id,
            companies_id: authenticate.companies_id,
            cod: codBookrecord?.$extras.max_cod + 1,
            books_id: books_id.books_id,
            book: dataImages.book,
            sheet: dataImages.sheet,
            indexbook: dataImages.indexBook,
            approximate_term: dataImages.approximateTerm,
            letter: dataImages.letter,
          })

          dataImages.id = book.id
        } else if (books_id) {
          const book = await Bookrecord.create({
            typebooks_id: params.typebooks_id,
            companies_id: authenticate.companies_id,
            cod: codBookrecord?.$extras.max_cod + 1,
            books_id: books_id.books_id,
            book: dataImages.book,
            sheet: dataImages.sheet,
            side: dataImages.side,
            indexbook: dataImages.indexBook,
            approximate_term: dataImages.approximateTerm,
            letter: dataImages.letter,
          })
          dataImages.id = book.id
        }
      }
    } else if (updateImageDocument) {
      // ATUALIZAÇÃO DE DOCUMENTOS

      // ✅ evita 500 se cod vier vazio
      if (dataImages?.cod === undefined || dataImages?.cod === null || dataImages?.cod === '') {
        return response.status(422).send({ message: 'Campo "cod" é obrigatório em dataImages.' })
      }

      // SEMPRE CRIAR UM NOVO REGISTRO
      const verifyExistBookrecord = await Bookrecord.query()
        .where('companies_id', authenticate.companies_id)
        .andWhere('cod', dataImages.cod)
        .andWhere('typebooks_id', params.typebooks_id)
        .first()

      // SE EXISTIR CODIGO E LIVRO DE DOCUMENTO INCLUI IMAGEM NO MESMO REGISTRO
      if (verifyExistBookrecord) {
        dataImages.id = verifyExistBookrecord.id
      } else {
        const trx = await Database.beginGlobalTransaction()
        try {
          const bookRecord = await Bookrecord.create(
            {
              typebooks_id: params.typebooks_id,
              companies_id: authenticate.companies_id,
              cod: dataImages.cod,
              book: dataImages.book,
              side: dataImages.side,
              books_id: 13,
            },
            trx
          )

          const normalizeIntOrNull = (value: any) => {
            if (value === undefined || value === null || value === '') return null
            return Number(value)
          }


          await Document.create(
            {
              bookrecords_id: bookRecord.id,
              books_id: 13,
              typebooks_id: params.typebooks_id,
              companies_id: authenticate.companies_id,
              prot: dataImages.prot,
              documenttype_id: normalizeIntOrNull(dataImages?.documenttype_id),
              document_type_book_id: normalizeIntOrNull(dataImages.document_type_book_id),
              book_name: dataImages.book_name,
              book_number: dataImages.book_number,
              sheet_number: dataImages.sheet_number,
              free: dataImages.free ? 1 : 0,
              averb_anot: dataImages.averb_anot ? 1 : 0,
              obs: dataImages.obs,
            },
            trx
          )

          dataImages.id = bookRecord.id
          await trx.commit()
        } catch (error) {
          await trx.rollback()
          throw error
        }
      }
    }

    // 🔹 TRATAMENTO DE PAISAGEM COM SHARP
    if (landscape) {
      for (const image of images) {
        const ext = (image.extname || '').toLowerCase()
        if (!['jpg', 'jpeg', 'png', 'jfif'].includes(ext)) continue
        if (!image.tmpPath) continue

        try {
          const inputPath = image.tmpPath
          const tempOutputPath = `${inputPath}_landscape`

          const imgSharp = sharp(inputPath)
          const metadata = await imgSharp.metadata()

          if (metadata.width && metadata.height && metadata.height > metadata.width) {
            await imgSharp.rotate(-90).toFile(tempOutputPath)
            await fs.promises.rename(tempOutputPath, inputPath)
          }
        } catch (err) {
          console.error('Erro ao rotacionar imagem para paisagem:', err)
        }
      }
    }

    const files = await FileRename.transformFilesNameToId(
      images,
      params,
      authenticate.companies_id,
      company?.cloud,
      false,
      dataImages
    )

    return response.status(201).send({ files, message: 'Arquivo Salvo com sucesso!!!' })
  }

  public async uploadCapture({ auth, request, params }) {
    const authenticate = await auth.use('api').authenticate()
    const company = await Company.find(authenticate.companies_id)
    const { imageCaptureBase64, cod, id } = request.requestData
    let base64Image = imageCaptureBase64.split(';base64,').pop();

    const uploadsBasePath = Application.tmpPath('uploads')
    const folderPath = Application.tmpPath(`/uploads/Client_${authenticate.companies_id}`)
    try {
      if (!fs.existsSync(uploadsBasePath)) {
        fs.mkdirSync(uploadsBasePath)
      }
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

    const file = await FileRename.transformFilesNameToId(`${folderPath}/${file_name}.jpeg`, params, authenticate.companies_id, company?.cloud, true)
    return { sucesso: "sucesso", file, typebook: params.typebooks_id }
  }

  public async download({ auth, params, request }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const { typebook_id } = request.only(['typebook_id'])
    const body = request.only(Indeximage.fillable)
    const fileName = params.id
    const company = await Company.find(authenticate.companies_id)
    const fileDownload = await FileRename.downloadImage(fileName, typebook_id, authenticate.companies_id, company?.cloud)
    return { fileDownload: fileDownload.dataURI, fileName, extension: path.extname(fileName), body, size: fileDownload.size }

  }

  public async countProcessing({ auth, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    const result = await Indeximage.query()
      .where('companies_id', authenticate.companies_id)
      .andWhere('typebooks_id', params.typebooks_id)
      .whereNotNull('previous_file_name')
      .count('* as total')

    return response.ok({
      total: Number(result[0].$extras.total),
    })
  }

  //*************************************************************** */
}
