// Services/uploads/uploadImages.ts
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
import type { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser'

interface UploadImageParams {
  companiesId: number
  marriedCertificateId?: number | null
  bornCertificateId?: number | null
  mandateCertificateId?: number | null
  file: MultipartFileContract
  description?: string
}

async function uploadImage({
  companiesId,
  marriedCertificateId,
  bornCertificateId,
  mandateCertificateId,
  file,
  description,
}: UploadImageParams) {

  if (!file || !file.isValid) {
    console.log('Arquivo inválido ou inexistente, ignorando.')
    return
  }

  let bookId: number | undefined
  let clientName: string

  // Busca última seq
  const query = ImageCertificate.query()
    .where('companies_id', companiesId)

  if (marriedCertificateId) {
    bookId = 2
    query.andWhere('married_certificate_id', marriedCertificateId)
  }

  if (bornCertificateId) {
    bookId = 3
    query.andWhere('born_certificate_id', bornCertificateId)
  }

  if (mandateCertificateId) {
    bookId = 24
    query.andWhere('mandate_certificate_id', mandateCertificateId)
  }

  const lastImage = await query.orderBy('seq', 'desc').first()
  const newSeq = lastImage?.seq ? lastImage.seq + 1 : 1

  const timestamp = DateTime.now().toFormat('yyyy-MM-dd_HH-mm-ss')
  const baseName = file.clientName.split('.').slice(0, -1).join('.')

  if (bookId === 2 || bookId === 3 || bookId === 24) {
    const certificateId = bookId === 2 ? marriedCertificateId : bookId === 3 ? bornCertificateId : mandateCertificateId
    clientName = `${description || ''}_${baseName}_id${certificateId}_${timestamp}.${file.extname}`
  } else {
    clientName = `${baseName}_${timestamp}.${file.extname}`
  }



  const company = await Company.findOrFail(companiesId)
  const uploadPath = Application.tmpPath(`/certificatesUploads/Client_${company.id}`)

  await file.move(uploadPath, { name: clientName })



  let parentFolder = await sendSearchFile(`${company.foldername}.CERTIFICATES`, company.cloud)

  if (parentFolder.length === 0) {
    const mainFolder = await sendSearchFile(company.foldername, company.cloud)
    if (mainFolder.length === 0) {
      throw new BadRequestException('Pasta da empresa não encontrada no Google Drive.', 400)
    }

    await sendCreateFolder(`${company.foldername}.CERTIFICATES`, company.cloud, mainFolder[0].id)
    parentFolder = await sendSearchFile(`${company.foldername}.CERTIFICATES`, company.cloud)
  }

  await ImageCertificate.create({
    companiesId,
    bookId,
    marriedCertificateId: marriedCertificateId ?? null,
    bornCertificateId: bornCertificateId ?? null,
    mandateCertificateId: mandateCertificateId ?? null,
    ext: file.extname,
    fileName: clientName,
    description: description,
    seq: newSeq,
    path: `${company.foldername}.CERTIFICATES`,
  })

  const result = await sendUploadFiles(parentFolder[0].id, uploadPath, clientName, company.cloud)

  const fullFilePath = `${uploadPath}/${clientName}`
  try {
    await fs.unlink(fullFilePath)
    console.log(`Arquivo ${clientName} excluído de ${uploadPath}`)
  } catch (err: any) {
    console.error(`Erro ao excluir o arquivo local: ${err.message}`)
  }
  return result
}

export { uploadImage }
