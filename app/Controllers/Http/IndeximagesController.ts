import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Indeximage from 'App/Models/Indeximage'
import Application from '@ioc:Adonis/Core/Application'
import BadRequestException from 'App/Exceptions/BadRequestException'
import Format from '../../Services/Dates/format'
import Bookrecord from 'App/Models/Bookrecord'
import Company from 'App/Models/Company'
import Typebook from 'App/Models/Typebook'
import Document from 'App/Models/Document'
import ImageUploadJob from 'App/Models/ImageUploadJob'
import Database from '@ioc:Adonis/Lucid/Database'
import AuditLogger from 'App/Services/Audit/AuditLogger'

import sharp from 'sharp'

const formatDate = new Format(new Date)
const FileRename = require('../../Services/fileRename/fileRename')
const fs = require('fs')
const path = require('path')

async function createUploadJob(payload: {
  companiesId: number
  typebooksId: number | null
  source: string
  fileNames: string[]
  dataImages: any
}) {
  try {
    return await ImageUploadJob.create({
      companiesId: payload.companiesId,
      typebooksId: payload.typebooksId,
      status: 'RECEIVED',
      source: payload.source,
      fileNames: JSON.stringify(payload.fileNames || []),
      dataImages: JSON.stringify(payload.dataImages || {}),
    })
  } catch (error) {
    console.error('Erro ao criar image_upload_job:', error)
    return null
  }
}

async function updateUploadJob(uploadJob: ImageUploadJob | null, status: string, data: any = {}) {
  if (!uploadJob) return null

  try {
    uploadJob.merge({
      status,
      ...data,
    })
    await uploadJob.save()
  } catch (error) {
    console.error('Erro ao atualizar image_upload_job:', error)
  }

  return uploadJob
}

function serializeUploadJob(uploadJob: ImageUploadJob | null) {
  if (!uploadJob) return null

  return {
    id: uploadJob.id,
    status: uploadJob.status,
    source: uploadJob.source,
    errorMessage: uploadJob.errorMessage,
    updatedAt: uploadJob.updatedAt,
  }
}

function getUploadJobErrorMessage(error: any) {
  if (typeof error === 'string') return error
  return error?.message || error?.response?.message || 'Falha ao processar upload.'
}

function getExtnameFromMime(mimeType: string) {
  const subtype = mimeType?.split('/')?.[1]?.toLowerCase()
  if (!subtype) return 'jpeg'
  if (subtype === 'jpg') return 'jpeg'
  return subtype.split(';')[0]
}

function sanitizeUploadFileName(fileName: string, extname: string) {
  const fallback = `imagem_${Date.now()}.${extname}`
  const baseName = path.basename(fileName || fallback).replace(/[^\w.\-]/g, '_')
  return baseName.includes('.') ? baseName : `${baseName}.${extname}`
}

async function buildImageFromBase64Upload(payload: {
  imageBase64: string
  imageName?: string
  imageType?: string
}) {
  const match = String(payload.imageBase64 || '').match(/^data:([^;]+);base64,(.+)$/)
  const mimeType = payload.imageType || match?.[1] || 'image/jpeg'
  const base64 = match?.[2] || payload.imageBase64
  const extname = getExtnameFromMime(mimeType)
  const clientName = sanitizeUploadFileName(payload.imageName || '', extname)
  const buffer = Buffer.from(base64, 'base64')

  if (!buffer.length) {
    throw new BadRequestException('Arquivo base64 inválido.', 422)
  }

  const tmpDir = Application.tmpPath('uploads/base64')
  await fs.promises.mkdir(tmpDir, { recursive: true })

  const tmpPath = path.join(tmpDir, `${Date.now()}_${clientName}`)
  await fs.promises.writeFile(tmpPath, buffer)

  return {
    clientName,
    extname,
    subtype: extname,
    type: mimeType.split('/')[0] || 'image',
    tmpPath,
    size: buffer.length,
    isValid: true,
    errors: [],
    async move(folderPath: string, options: { name?: string } = {}) {
      await fs.promises.mkdir(folderPath, { recursive: true })
      const targetPath = path.join(folderPath, options.name || clientName)
      await fs.promises.copyFile(tmpPath, targetPath)
      return true
    },
  }
}


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

  public async destroy(ctx: HttpContextContract) {
    const { auth, params, response } = ctx
    const authenticate = await auth.use('api').authenticate()
    const companies_id = authenticate.companies_id
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

      await AuditLogger.deleted(ctx, {
        companiesId: companies_id,
        userId: authenticate.id,
        action: 'indeximage_delete',
        entityTable: 'indeximages',
        resourceKey: `indeximages:${params.typebooks_id}:${params.bookrecords_id}:${decodeURIComponent(params.file_name)}`,
        entityKey: {
          typebooks_id: Number(params.typebooks_id),
          bookrecords_id: Number(params.bookrecords_id),
          file_name: decodeURIComponent(params.file_name),
        },
        description: `Usuário ${authenticate.name || authenticate.username} excluiu a imagem ${decodeURIComponent(params.file_name)}`,
        beforeData: listOfImagesToDeleteGDrive,
        metadata: {
          file_name: decodeURIComponent(params.file_name),
        },
      })

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

  public async uploads(ctx: HttpContextContract) {
    const { auth, request, params, response } = ctx
    const authenticate = await auth.use('api').authenticate()
    const company = await Company.find(authenticate.companies_id)
    
    // Arquivos sempre vêm por multipart
    let images: any[] = request.files('images', {
      size: '100mb',
      extnames: ['jpg', 'png', 'jpeg', 'pdf', 'JPG', 'PNG', 'JPEG', 'PDF', 'jfif', 'JFIF', 'tiff', 'TIFF', 'bmp', 'BMP', 'tif', 'TIF', 'webp', 'WEBP'],
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

    const imageBase64 = request.input('imageBase64')
    if (!images.length && imageBase64) {
      images = [
        await buildImageFromBase64Upload({
          imageBase64,
          imageName: request.input('imageName'),
          imageType: request.input('imageType'),
        }),
      ]
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

    const source = updateImageDocument
      ? 'updateImageDocument'
      : updateImage
        ? 'updateImage'
        : indexImagesInitial
          ? 'indexImagesInitial'
          : 'uploads'

    const uploadJob = await createUploadJob({
      companiesId: authenticate.companies_id,
      typebooksId: Number(params.typebooks_id) || null,
      source,
      fileNames: images.map((image) => image.clientName),
      dataImages,
    })

    try {
      if (!images.length) {
        await updateUploadJob(uploadJob, 'FAILED', {
          errorMessage: 'Nenhum arquivo foi recebido no campo "images".',
        })

        return response.status(422).send({
          message: 'Nenhum arquivo foi recebido no campo "images".',
          uploadJob: serializeUploadJob(uploadJob),
        })
      }

      const invalidImages = images.filter((image) => !image.isValid)
      if (invalidImages.length) {
        const errorMessage = invalidImages
          .map((image) => `${image.clientName}: ${JSON.stringify(image.errors || [])}`)
          .join('; ')

        await updateUploadJob(uploadJob, 'FAILED', {
          errorMessage: errorMessage.slice(0, 1000),
        })

        return response.status(422).send({
          message: 'Um ou mais arquivos enviados são inválidos.',
          errors: invalidImages.map((image) => ({
            fileName: image.clientName,
            errors: image.errors,
          })),
          uploadJob: serializeUploadJob(uploadJob),
        })
      }

      await updateUploadJob(uploadJob, 'PREPARING_RECORDS')

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
        await updateUploadJob(uploadJob, 'FAILED', {
          errorMessage: 'Campo "book" é obrigatório em dataImages.',
        })
        return response.status(422).send({
          message: 'Campo "book" é obrigatório em dataImages.',
          uploadJob: serializeUploadJob(uploadJob),
        })
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
        await updateUploadJob(uploadJob, 'FAILED', {
          errorMessage: 'Campo "cod" é obrigatório em dataImages.',
        })
        return response.status(422).send({
          message: 'Campo "cod" é obrigatório em dataImages.',
          uploadJob: serializeUploadJob(uploadJob),
        })
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

    await updateUploadJob(uploadJob, 'SAVING_FILES')

    const files = await FileRename.transformFilesNameToId(
      images,
      params,
      authenticate.companies_id,
      company?.cloud,
      false,
      dataImages
    )

    if (!files?.length) {
      await updateUploadJob(uploadJob, 'FAILED', {
        errorMessage: 'Nenhum arquivo foi enviado para o Google Drive.',
      })

      return response.status(422).send({
        files,
        uploadJob: serializeUploadJob(uploadJob),
        message: 'Nenhum arquivo foi enviado para o Google Drive.',
      })
    }

    await updateUploadJob(uploadJob, 'COMPLETED', {
      resultFiles: JSON.stringify(files || []),
    })

    await AuditLogger.imageUpload(ctx, {
      companiesId: authenticate.companies_id,
      userId: authenticate.id,
      entityTable: 'indeximages',
      resourceKey: `indeximages-upload:${params.typebooks_id}:${uploadJob?.id || Date.now()}`,
      entityKey: {
        typebooks_id: Number(params.typebooks_id),
      },
      description: `Usuário ${authenticate.name || authenticate.username} anexou ${files.length} imagem(ns)`,
      metadata: {
        source,
        upload_job_id: uploadJob?.id,
        file_names: files.map((file: any) => file.file_name || file.fileName || file.name).filter(Boolean),
        quantity: files.length,
      },
    })

    return response.status(201).send({
      files,
      uploadJob: serializeUploadJob(uploadJob),
      message: 'Arquivo Salvo com sucesso!!!',
    })
    } catch (error) {
      await updateUploadJob(uploadJob, 'FAILED', {
        errorMessage: getUploadJobErrorMessage(error).slice(0, 1000),
      })
      throw error
    }
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

  public async download(ctx: HttpContextContract) {
    const { auth, params, request } = ctx
    const authenticate = await auth.use('api').authenticate()
    const { typebook_id } = request.only(['typebook_id'])
    const body = request.only(Indeximage.fillable)
    const fileName = params.id
    const company = await Company.find(authenticate.companies_id)
    const indexImage = await Indeximage.query()
      .where('file_name', fileName)
      .andWhere('typebooks_id', typebook_id)
      .andWhere('companies_id', authenticate.companies_id)
      .first()
    const fileDownload = await FileRename.downloadImage(fileName, typebook_id, authenticate.companies_id, company?.cloud)
    await AuditLogger.imageView(ctx, {
      companiesId: authenticate.companies_id,
      userId: authenticate.id,
      entityTable: 'indeximages',
      resourceKey: `indeximages:${typebook_id}:${indexImage?.bookrecords_id || ''}:${indexImage?.seq || ''}:${fileName}`,
      entityKey: {
        typebooks_id: Number(typebook_id),
        bookrecords_id: indexImage?.bookrecords_id,
        seq: indexImage?.seq,
        file_name: fileName,
      },
      description: `Usuário ${authenticate.name || authenticate.username} visualizou a imagem ${fileName}`,
      metadata: {
        file_name: fileName,
        extension: path.extname(fileName),
        size: fileDownload.size,
      },
    })

    return {
      fileDownload: fileDownload.dataURI,
      fileName,
      extension: path.extname(fileName),
      body,
      size: fileDownload.size,
      index_text: indexImage?.index_text,
      bookrecords_id: indexImage?.bookrecords_id,
      typebooks_id: indexImage?.typebooks_id,
      seq: indexImage?.seq,
    }

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
