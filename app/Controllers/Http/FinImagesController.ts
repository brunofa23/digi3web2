import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BadRequestException from 'App/Exceptions/BadRequestException'
import FinImage from 'App/Models/FinImage'
import Application from '@ioc:Adonis/Core/Application'
import {
  sendUploadFiles,
  sendCreateFolder,
  sendSearchFile,
  sendDownloadFile,
  sendDeleteFile,
  sendListAllFiles,
  sendRenameFile
} from "App/Services/googleDrive/googledrive"

import Company from 'App/Models/Company'

export default class FinImagesController {

  public async index({ auth, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    try {
      const data = await FinImage.query()
      return response.status(200).send(data)
    } catch (error) {
      throw new BadRequestException('Bad Request', 401, error)
    }
  }

  // public async store({ auth, request, response }: HttpContextContract) {
  //   await auth.use('api').authenticate()
  //   const body = request.only(FinImage.fillable)
  //   try {
  //     const data = await FinImage.create(body)
  //     return response.status(201).send(data)

  //   } catch (error) {
  //     throw new BadRequestException('Bad Request', 401, error)
  //   }
  // }
  public async store({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()


    const body = request.only(FinImage.fillable)
    const image = request.file('file', {
      size: '8mb',
      extnames: [
        'jpg',
        'png',
        'jpeg',
        'pdf',
        'JPG',
        'PNG',
        'JPEG',
        'PDF',
        'XLS',
        'xls',
      ],
    });

    //console.log(">>>", body, image)

    if (!image || !image.isValid) {
      throw new BadRequestException('Erro', 401, 'Arquivo inválido ou não enviado.');
    }

    try {

      const data = await FinImage.create(body)

      const company = await Company.findOrFail(authenticate.companies_id)
      await image.move(Application.tmpPath(`/finuploads/Client_${company.id}`))

      //Verifica se existe a pasta no googleDrive
      const parent = await sendSearchFile(`${company.foldername}.FINANCIAL`, company.cloud)
      //SENÃO EXISTIR CRIA
      if (parent.length == 0) {
        const idFolderCompany = await sendSearchFile(`${company.foldername}`, company.cloud)
        console.log("ID FOLDER", idFolderCompany)
        const createFolder = await sendCreateFolder(`${company.foldername}.FINANCIAL`, company.cloud, idFolderCompany[0].id)
      }

      //const sendUpload = await sendUploadFiles()


      return response.status(201).send(data)

    } catch (error) {
      throw new BadRequestException('Bad Request', 401, error)
    }
  }

  public async show({ auth, params, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    try {
      const data = await FinImage.findOrFail(params.id)
      return response.status(200).send(data)
    } catch (error) {
      throw new BadRequestException('Bad Request', 401, error)
    }
  }


  public async update({ auth, params, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const body = request.only(FinImage.fillable)
    try {
      const data = await FinImage.query()
        .where('companies_id', authenticate.companies_id)
        .andWhere('id', params.id)
        .update(body)

      return response.status(201).send(data)

    } catch (error) {
      throw new BadRequestException('Bad Request', 401, error)
    }

  }

  public async destroy({ }: HttpContextContract) { }


}
