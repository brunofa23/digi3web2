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
const path = require('path')

import Company from 'App/Models/Company'
import { DateTime } from 'luxon'

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
  //   try {
  //     console.log("passei no store....1500")
  //     const user = await auth.use('api').authenticate();
  //     const body = request.only(FinImage.fillable);
  //     // Validação do arquivo
  //     const image = request.file('file', {
  //       size: '8mb',
  //       extnames: ['jpg', 'png', 'jpeg', 'pdf', 'xls', 'JPG', 'PNG', 'JPEG', 'PDF', 'XLS'],
  //     });

  //     if (!image || !image.isValid) {
  //       throw new BadRequestException('Erro', 401, 'Arquivo inválido ou não enviado.');
  //     }

  //     // Obtém a sequência mais alta para o `fin_account_id`
  //     const lastImage = await FinImage.query()
  //       .where('companies_id', user.companies_id)
  //       .andWhere('fin_account_id', body.fin_account_id)
  //       .orderBy('seq', 'desc')
  //       .first();

  //     const newSeq = lastImage?.seq ? lastImage.seq + 1 : 1;

  //     // Gera um nome de arquivo formatado
  //     const timestamp = DateTime.now().toFormat('yyyy-MM-dd_HH-mm-ss');
  //     const baseName = image.clientName.split('.').slice(0, -1).join('.');
  //     const clientName = `${baseName}_id${body.fin_account_id}_${timestamp}.${image.extname}`;

  //     // Cria o registro no banco de dados
  //     const data = await FinImage.create({ ...body, file_name: clientName, seq: newSeq });

  //     // Obtém informações da empresa
  //     const company = await Company.findOrFail(user.companies_id);
  //     const uploadPath = Application.tmpPath(`/finuploads/Client_${company.id}`);

  //     // Move o arquivo para o diretório temporário
  //     await image.move(uploadPath, { name: clientName });

  //     // Verifica e cria pasta no Google Drive
  //     let parentFolder = await sendSearchFile(`${company.foldername}.FINANCIAL`, company.cloud);

  //     if (parentFolder.length === 0) {
  //       const mainFolder = await sendSearchFile(company.foldername, company.cloud);
  //       if (mainFolder.length === 0) {
  //         throw new BadRequestException('Pasta da empresa não encontrada no Google Drive.', 400);
  //       }
  //       await sendCreateFolder(`${company.foldername}.FINANCIAL`, company.cloud, mainFolder[0].id);
  //       parentFolder = await sendSearchFile(`${company.foldername}.FINANCIAL`, company.cloud);
  //     }

  //     // Faz o upload do arquivo para o Google Drive
  //     await sendUploadFiles(parentFolder[0].id, uploadPath, clientName, company.cloud);

  //     return response.created(data);
  //   } catch (error) {
  //     throw new BadRequestException('Erro ao processar a requisição.', 400, error);
  //   }
  // }

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


  public async downloadfinimage({ auth, request, response }: HttpContextContract) {
    console.log("passo 1 1522")
    const authenticate = await auth.use('api').authenticate()
    const { file_name, path_file } = request.only(['file_name', 'path_file'])
    const company = await Company.find(authenticate.companies_id)


    const parent = await sendSearchFile(path_file, company.cloud)
    const extension = path.extname(file_name);
    const fileId = await sendSearchFile(file_name, company.cloud, parent[0].id)
    console.log('ext:', extension)
    console.log('filename:', file_name, 'path:', path_file)
    console.log("parente::::", parent[0].id)
    console.log("nome do arquivo::::", fileId[0].id)
    const download = await sendDownloadFile(fileId[0].id, extension, company?.cloud)
    console.log("DOWNLOAD::::", download)
     return response.status(201).send(download)
    //return download



  }



  public async destroy({ }: HttpContextContract) { }




}
