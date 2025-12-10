import BadRequestException from 'App/Exceptions/BadRequestException'
import ImageCertificate from 'App/Models/ImageCertificate';
import Company from 'App/Models/Company';
import Application from '@ioc:Adonis/Core/Application'
import {
  sendUploadFiles,
  sendCreateFolder,
  sendSearchFile,
} from "App/Services/googleDrive/googledrive"
import { DateTime } from 'luxon';
import fs from 'fs/promises'

async function uploadImage(companiesId: number, marriedCertificateId: number | null, request) {

  console.log("PASSO 1 UPLOAD")
  const fileInput = request;
  const {description}=request.only(['description'])
  console.log("DESC: ", description)


  let bookId
  let clientName
  // Pegando o arquivo corretamente
  const image = fileInput.file('fileInput', {
    size: '8mb',
    extnames: ['jpg', 'png', 'jpeg', 'pdf', 'xls', 'JPG', 'PNG', 'JPEG', 'PDF', 'XLS'],
  });

  if (!image || !image.isValid) {
    return
  }

  console.log("PASSO 2 UPLOAD")


  // Obtém a sequência mais alta para o `fin_account_id`
  const query = ImageCertificate.query()
    .where('companies_id', companiesId)
  if (marriedCertificateId) {
    bookId = 2
    query.andWhere('married_certificate_id', marriedCertificateId)
      .orderBy('seq', 'desc')
      .first();

  }

  const lastImage = await query.first()

  const newSeq = lastImage?.seq ? lastImage.seq + 1 : 1;
  // Gera um nome de arquivo formatado
  const timestamp = DateTime.now().toFormat('yyyy-MM-dd_HH-mm-ss');
  const baseName = image.clientName.split('.').slice(0, -1).join('.');
  if(bookId==2)
    clientName = `${baseName}_${description ||''}_id${marriedCertificateId}_${timestamp}.${image.extname}`;
  else clientName =`${baseName}_${timestamp}.${image.extname}`;

  console.log("PASSO 3 UPLOAD")
  // Obtém informações da empresa
  const company = await Company.findOrFail(companiesId);
  const uploadPath = Application.tmpPath(`/certificatesUploads/Client_${company.id}`);

  // Move o arquivo para o diretório temporário
  await image.move(uploadPath, { name: clientName });

  console.log("PASSO 4 UPLOAD")
  // Verifica e cria pasta no Google Drive
  let parentFolder = await sendSearchFile(`${company.foldername}.CERTIFICATES`, company.cloud);

  console.log("PASSO 5 UPLOAD")
  if (parentFolder.length === 0) {
    const mainFolder = await sendSearchFile(company.foldername, company.cloud);
    if (mainFolder.length === 0) {
      throw new BadRequestException('Pasta da empresa não encontrada no Google Drive.', 400);
    }

    await sendCreateFolder(`${company.foldername}.CERTIFICATES`, company.cloud, mainFolder[0].id);
    console.log("PASSO 6 UPLOAD")
    parentFolder = await sendSearchFile(`${company.foldername}.CERTIFICATES`, company.cloud);
  }

  // Cria o registro no banco de dados
  await ImageCertificate.create({ companies_id: companiesId,book_id:bookId, marriedCertificateId, ext: image.extname, file_name: clientName, seq: newSeq, path: `${company.foldername}.CERTIFICATES` });

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

  console.log("PASSO 7 UPLOAD")
  return result;
}

export { uploadImage }
