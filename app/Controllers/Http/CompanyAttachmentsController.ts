import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import type { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser'
import Application from '@ioc:Adonis/Core/Application'
import BadRequestException from 'App/Exceptions/BadRequestException'
import Company from 'App/Models/Company'
import CompanyAttachment from 'App/Models/CompanyAttachment'
import {
  sendCreateFolder,
  sendDeleteFile,
  sendDownloadFile,
  sendUploadFiles,
} from 'App/Services/googleDrive/googledrive'
import { DateTime } from 'luxon'
import crypto from 'crypto'
import fs from 'fs/promises'
import path from 'path'

const allowedExtensions = [
  'pdf',
  'txt',
  'jpg',
  'jpeg',
  'png',
  'gif',
  'bmp',
  'webp',
  'tif',
  'tiff',
  'docx',
  'xls',
  'xlsx',
  'odt',
]

export default class CompanyAttachmentsController {
  private async authenticateSuperuser(auth: HttpContextContract['auth']) {
    const authenticate = await auth.use('api').authenticate()

    if (!authenticate.superuser) {
      throw new BadRequestException('Acesso permitido apenas para super usuário', 403, 'company_attachment_forbidden')
    }

    return authenticate
  }

  private normalizeDescription(value: string) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 80) || 'documento'
  }

  private getExtension(file: MultipartFileContract) {
    return String(file.extname || path.extname(file.clientName).replace('.', '') || '').toLowerCase()
  }

  private getMimeType(file: MultipartFileContract, extension: string) {
    const fileType = String(file.type || '').toLowerCase()
    const fileSubtype = String(file.subtype || '').toLowerCase()

    if (fileType && fileSubtype) {
      return `${fileType}/${fileSubtype}`
    }

    const mimeTypes = {
      pdf: 'application/pdf',
      txt: 'text/plain',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      bmp: 'image/bmp',
      webp: 'image/webp',
      tif: 'image/tiff',
      tiff: 'image/tiff',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      odt: 'application/vnd.oasis.opendocument.text',
    }

    return mimeTypes[extension] || 'application/octet-stream'
  }

  private async ensureCompanyDriveFolder(company: Company) {
    const digi3FolderId = await sendCreateFolder('Digi3', company.cloud)
    const companiesFolderId = await sendCreateFolder('Companies', company.cloud, digi3FolderId)
    const companyFolderId = await sendCreateFolder(String(company.id), company.cloud, companiesFolderId)

    return companyFolderId
  }

  private buildFileName(companyId: number, description: string, extension: string) {
    const normalizedDescription = this.normalizeDescription(description)
    const identifier = crypto.randomBytes(4).toString('hex')

    return `company_id_${companyId}_${normalizedDescription}_${identifier}.${extension}`
  }

  public async index({ auth, params, response }: HttpContextContract) {
    await this.authenticateSuperuser(auth)

    const companyId = Number(params.companyId)
    await Company.findOrFail(companyId)

    const data = await CompanyAttachment
      .query()
      .where('companies_id', companyId)
      .whereNull('deleted_at')
      .orderBy('created_at', 'desc')

    return response.status(200).send(data)
  }

  public async store({ auth, params, request, response }: HttpContextContract) {
    const authenticate = await this.authenticateSuperuser(auth)
    const companyId = Number(params.companyId)
    const company = await Company.findOrFail(companyId)
    const description = String(request.input('description') || '').trim()

    if (!description) {
      throw new BadRequestException('Descrição do documento é obrigatória', 400, 'company_attachment_description_required')
    }

    const file = request.file('file', {
      size: '20mb',
      extnames: allowedExtensions,
    })

    if (!file || !file.isValid) {
      throw new BadRequestException('Arquivo inválido ou não enviado', 400, 'company_attachment_invalid_file')
    }

    const extension = this.getExtension(file)

    if (!allowedExtensions.includes(extension)) {
      throw new BadRequestException('Extensão de arquivo não permitida', 400, 'company_attachment_invalid_extension')
    }

    const fileName = this.buildFileName(company.id, description, extension)
    const mimeType = this.getMimeType(file, extension)
    const uploadPath = Application.tmpPath(`/companyAttachments/Company_${company.id}`)
    let driveFileId: string | undefined

    await file.move(uploadPath, { name: fileName })

    try {
      const driveFolderId = await this.ensureCompanyDriveFolder(company)
      const uploadResult = await sendUploadFiles(driveFolderId, uploadPath, fileName, company.cloud, mimeType)
      driveFileId = uploadResult?.data?.id

      if (!driveFileId) {
        throw new BadRequestException('Upload não retornou o ID do arquivo no Google Drive', 400, 'company_attachment_drive_upload_error')
      }

      const attachment = await CompanyAttachment.create({
        companiesId: company.id,
        description,
        originalName: file.clientName,
        fileName,
        mimeType,
        extension,
        size: file.size || null,
        driveFileId,
        driveFolderId,
        uploadedBy: authenticate.id || null,
      })

      return response.status(201).send(attachment)
    } catch (error) {
      if (driveFileId) {
        await sendDeleteFile(driveFileId, company.cloud).catch(() => null)
      }

      throw error
    } finally {
      await fs.unlink(`${uploadPath}/${fileName}`).catch(() => null)
    }
  }

  public async download({ auth, params, response }: HttpContextContract) {
    await this.authenticateSuperuser(auth)

    const companyId = Number(params.companyId)
    const attachment = await CompanyAttachment
      .query()
      .where('id', params.id)
      .where('companies_id', companyId)
      .whereNull('deleted_at')
      .firstOrFail()

    const company = await Company.findOrFail(companyId)
    const download = await sendDownloadFile(attachment.driveFileId, `.${attachment.extension}`, company.cloud)

    return response.status(200).send({
      ...download,
      fileName: attachment.originalName || attachment.fileName,
      mimeType: attachment.mimeType,
    })
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    await this.authenticateSuperuser(auth)

    const companyId = Number(params.companyId)
    const attachment = await CompanyAttachment
      .query()
      .where('id', params.id)
      .where('companies_id', companyId)
      .whereNull('deleted_at')
      .firstOrFail()

    const company = await Company.findOrFail(companyId)
    await sendDeleteFile(attachment.driveFileId, company.cloud).catch(() => null)

    attachment.deletedAt = DateTime.now()
    await attachment.save()

    return response.status(200).send({ success: true })
  }
}
