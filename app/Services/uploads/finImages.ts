import BadRequestException from 'App/Exceptions/BadRequestException'
import FinImage from 'App/Models/FinImage';
import Company from 'App/Models/Company';
import Application from '@ioc:Adonis/Core/Application'
import {
  sendUploadFiles,
  sendCreateFolder,
  sendSearchFile,
} from "App/Services/googleDrive/googledrive"
import { DateTime } from 'luxon';
import fs from 'fs/promises'

async function uploadFinImage(companies_id: number, fin_account_id: number, request) {

  const fileInput = request;
  // Pegando o arquivo corretamente
  const image = fileInput.file('fileInput', {
    size: '8mb',
    extnames: ['jpg', 'png', 'jpeg', 'pdf', 'xls', 'JPG', 'PNG', 'JPEG', 'PDF', 'XLS'],
  });

  if (!image || !image.isValid) {
    return
  }

  // Obtém a sequência mais alta para o `fin_account_id`
  const lastImage = await FinImage.query()
    .where('companies_id', companies_id)
    .andWhere('fin_account_id', fin_account_id)
    .orderBy('seq', 'desc')
    .first();

  const newSeq = lastImage?.seq ? lastImage.seq + 1 : 1;
  // Gera um nome de arquivo formatado
  const timestamp = DateTime.now().toFormat('yyyy-MM-dd_HH-mm-ss');
  const baseName = image.clientName.split('.').slice(0, -1).join('.');
  const clientName = `${baseName}_id${fin_account_id}_${timestamp}.${image.extname}`;

  // Obtém informações da empresa
  const company = await Company.findOrFail(companies_id);
  const uploadPath = Application.tmpPath(`/finuploads/Client_${company.id}`);

  // Move o arquivo para o diretório temporário
  await image.move(uploadPath, { name: clientName });

  // Verifica e cria pasta no Google Drive
  let parentFolder = await sendSearchFile(`${company.foldername}.FINANCIAL`, company.cloud);

  if (parentFolder.length === 0) {
    const mainFolder = await sendSearchFile(company.foldername, company.cloud);
    if (mainFolder.length === 0) {
      throw new BadRequestException('Pasta da empresa não encontrada no Google Drive.', 400);
    }
    await sendCreateFolder(`${company.foldername}.FINANCIAL`, company.cloud, mainFolder[0].id);
    parentFolder = await sendSearchFile(`${company.foldername}.FINANCIAL`, company.cloud);
  }

  // Cria o registro no banco de dados
  await FinImage.create({ companies_id, fin_account_id, ext: image.extname, file_name: clientName, seq: newSeq, path: `${company.foldername}.FINANCIAL` });

  // Faz o upload do arquivo para o Google Drive
  const result = await sendUploadFiles(parentFolder[0].id, uploadPath, clientName, company.cloud);

  // Após o upload, exclui o arquivo local
  const fullFilePath = `${uploadPath}/${clientName}`;
  try {
    await fs.unlink(fullFilePath);
    console.log(`Arquivo ${clientName} excluído de ${uploadPath}`);
  } catch (err) {
    console.error(`Erro ao excluir o arquivo local: ${err.message}`);
  }

  return result;
}

export { uploadFinImage }
