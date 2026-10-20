import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import Application from '@ioc:Adonis/Core/Application'
import crypto from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { PDFDocument } from 'pdf-lib'

const sessionTable = 'birth_mobile_capture_sessions'
const fileTable = 'birth_mobile_capture_files'
const maxPagesPerDocument = 5
const fields: Record<string, string> = {
  DocumentRegistered: 'Documento do registrado',
  DnvDocument: 'Declaração de Nascido Vivo (DNV)',
  DocumentFiliation1: 'Documento da filiação 1',
  ProofResidenceFiliation1: 'Comprovante de residência da filiação 1',
  DocumentFiliation2: 'Documento da filiação 2',
  ProofResidenceFiliation2: 'Comprovante de residência da filiação 2',
  DocumentDeclarant: 'Documento do declarante',
  ProofResidenceDeclarant: 'Comprovante de residência do declarante',
}

function captureDirectory(sessionId: string) {
  return Application.tmpPath('birth-mobile-captures', sessionId)
}

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export default class BirthMobileCapturesController {
  private async removeExpiredSessions() {
    const expired = await Database.from(sessionTable).whereRaw('expires_at <= CURRENT_TIMESTAMP')
    for (const session of expired) {
      await fs.rm(captureDirectory(session.id), { recursive: true, force: true })
    }
    if (expired.length) {
      await Database.from(sessionTable).whereIn('id', expired.map(({ id }) => id)).delete()
    }
  }

  private async getValidPublicSession(token: string) {
    await this.removeExpiredSessions()
    return Database.from(sessionTable)
      .where('token_hash', hashToken(token))
      .whereRaw('expires_at > CURRENT_TIMESTAMP')
      .first()
  }

  public async create({ auth, response }: HttpContextContract) {
    const user = await auth.use('api').authenticate()
    await this.removeExpiredSessions()

    const token = crypto.randomBytes(32).toString('hex')
    const id = crypto.randomUUID()
    await Database.table(sessionTable).insert({
      id,
      companies_id: user.companies_id,
      created_by: user.id,
      token_hash: hashToken(token),
      expires_at: Database.raw('DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 30 MINUTE)'),
      created_at: Database.raw('CURRENT_TIMESTAMP'),
    })

    const session = await Database.from(sessionTable).where('id', id).select('expires_at').first()
    return response.created({ id, token, expiresAt: session?.expires_at, fields })
  }

  public async showPublic({ request, response }: HttpContextContract) {
    response.header('Cache-Control', 'private, no-store, no-cache, must-revalidate')
    response.header('Pragma', 'no-cache')
    const token = String(request.header('x-capture-token') || '')
    if (!/^[a-f0-9]{64}$/i.test(token)) return response.badRequest({ message: 'O QR Code não trouxe um código de captura válido.' })
    const session = await this.getValidPublicSession(token)
    if (!session) return response.status(410).send({ message: 'Sessão não encontrada ou expirada. Gere um novo QR Code no atendimento.' })

    const uploads = await Database.from(fileTable)
      .where('session_id', session.id)
      .select('field_key as fieldKey', 'file_name as fileName')
    const pageCounts: Record<string, number> = {}
    for (const upload of uploads) {
      try {
        const pdf = await PDFDocument.load(await fs.readFile(path.join(captureDirectory(session.id), upload.fileName)))
        pageCounts[upload.fieldKey] = pdf.getPageCount()
      } catch {
        pageCounts[upload.fieldKey] = 0
      }
    }
    return response.ok({
      fields,
      uploadedFields: uploads.map(({ fieldKey }) => fieldKey),
      pageCounts,
      expiresAt: session.expires_at,
    })
  }

  public async uploadPublic({ request, response }: HttpContextContract) {
    const token = String(request.header('x-capture-token') || '')
    if (!/^[a-f0-9]{64}$/i.test(token)) return response.badRequest({ message: 'O QR Code não trouxe um código de captura válido.' })
    const session = await this.getValidPublicSession(token)
    if (!session) return response.status(410).send({ message: 'Sessão não encontrada ou expirada. Gere um novo QR Code no atendimento.' })

    const fieldKey = String(request.input('fieldKey') || '')
    if (!fields[fieldKey]) return response.badRequest({ message: 'Tipo de documento inválido.' })
    const pageId = String(request.input('pageId') || '')
    if (!/^[a-f0-9-]{36}$/i.test(pageId)) return response.badRequest({ message: 'Identificador da foto inválido.' })

    const prior = await Database.from(fileTable).where('session_id', session.id).where('field_key', fieldKey).first()
    if (prior?.file_name === `${pageId}.pdf`) {
      let pageCount = 0
      const pdf = await PDFDocument.load(await fs.readFile(path.join(captureDirectory(session.id), prior.file_name)))
      pageCount = pdf.getPageCount()
      return response.ok({ fieldKey, label: fields[fieldKey], pageCount, duplicate: true })
    }

    const file = request.file('file', { size: '8mb', extnames: ['pdf'] })
    if (!file?.isValid || !file.tmpPath) return response.badRequest({ message: 'Envie a página como PDF de até 8 MB.' })
    if (path.basename(file.clientName || '') !== `${fieldKey}.pdf`) {
      return response.badRequest({ message: 'O arquivo não corresponde ao tipo de documento selecionado. Selecione o documento correto e fotografe novamente.' })
    }
    const header = await fs.open(file.tmpPath, 'r')
    const signature = Buffer.alloc(5)
    try {
      await header.read(signature, 0, 5, 0)
    } finally {
      await header.close()
    }
    if (signature.toString() !== '%PDF-') return response.badRequest({ message: 'O arquivo enviado não é um PDF válido.' })

    let incomingPdf: PDFDocument
    try {
      incomingPdf = await PDFDocument.load(await fs.readFile(file.tmpPath))
    } catch {
      return response.badRequest({ message: 'Não foi possível abrir a página enviada. Tente capturá-la novamente.' })
    }
    let existingPdf: PDFDocument | null = null
    if (prior) {
      try {
        existingPdf = await PDFDocument.load(await fs.readFile(path.join(captureDirectory(session.id), prior.file_name)))
      } catch {
        return response.internalServerError({ message: 'O PDF salvo não pôde ser atualizado. Tente novamente.' })
      }
    }
    const totalPages = (existingPdf?.getPageCount() || 0) + incomingPdf.getPageCount()
    if (totalPages > maxPagesPerDocument) {
      return response.badRequest({ message: `Este documento pode ter até ${maxPagesPerDocument} páginas.` })
    }

    const mergedPdf = existingPdf || await PDFDocument.create()
    if (existingPdf) {
      const newPages = await mergedPdf.copyPages(incomingPdf, incomingPdf.getPageIndices())
      newPages.forEach((page) => mergedPdf.addPage(page))
    } else {
      const newPages = await mergedPdf.copyPages(incomingPdf, incomingPdf.getPageIndices())
      newPages.forEach((page) => mergedPdf.addPage(page))
    }
    const mergedBytes = Buffer.from(await mergedPdf.save())
    const directory = captureDirectory(session.id)
    await fs.mkdir(directory, { recursive: true })
    const fileName = `${pageId}.pdf`
    const newFilePath = path.join(directory, fileName)
    await fs.writeFile(newFilePath, mergedBytes)
    try {
      await Database.transaction(async (trx) => {
        if (prior) await trx.from(fileTable).where('id', prior.id).delete()
        await trx.table(fileTable).insert({
          session_id: session.id,
          field_key: fieldKey,
          file_name: fileName,
          client_name: `${fieldKey}.pdf`,
          size: mergedBytes.length,
          created_at: Database.raw('CURRENT_TIMESTAMP'),
        })
      })
    } catch (error) {
      await fs.rm(newFilePath, { force: true })
      throw error
    }
    if (prior) await fs.rm(path.join(directory, prior.file_name), { force: true })

    return response.created({ fieldKey, label: fields[fieldKey], pageCount: totalPages })
  }

  public async resetPublicFile({ request, response }: HttpContextContract) {
    const token = String(request.header('x-capture-token') || '')
    if (!/^[a-f0-9]{64}$/i.test(token)) return response.badRequest({ message: 'O QR Code não trouxe um código de captura válido.' })
    const session = await this.getValidPublicSession(token)
    if (!session) return response.status(410).send({ message: 'Sessão não encontrada ou expirada. Gere um novo QR Code no atendimento.' })

    const fieldKey = String(request.input('fieldKey') || '')
    if (!fields[fieldKey]) return response.badRequest({ message: 'Tipo de documento inválido.' })
    const file = await Database.from(fileTable).where('session_id', session.id).where('field_key', fieldKey).first()
    if (!file) return response.ok({ fieldKey, cleared: false })

    await Database.from(fileTable).where('id', file.id).delete()
    await fs.rm(path.join(captureDirectory(session.id), file.file_name), { force: true })
    return response.ok({ fieldKey, cleared: true })
  }

  public async index({ auth, params, response }: HttpContextContract) {
    const user = await auth.use('api').authenticate()
    const session = await Database.from(sessionTable)
      .where('id', params.id)
      .where('companies_id', user.companies_id)
      .where('created_by', user.id)
      .whereRaw('expires_at > CURRENT_TIMESTAMP')
      .first()
    if (!session) return response.notFound({ message: 'Sessão de captura não encontrada ou expirada.' })

    const files = await Database.from(fileTable)
      .where('session_id', session.id)
      .select('id', 'field_key as fieldKey', 'client_name as name', 'size')
    return response.ok({ id: session.id, expiresAt: session.expires_at, files })
  }

  public async download({ auth, params, response }: HttpContextContract) {
    const user = await auth.use('api').authenticate()
    const file = await Database.from(fileTable)
      .join(sessionTable, `${sessionTable}.id`, `${fileTable}.session_id`)
      .where(`${fileTable}.id`, params.fileId)
      .where(`${sessionTable}.id`, params.id)
      .where(`${sessionTable}.companies_id`, user.companies_id)
      .where(`${sessionTable}.created_by`, user.id)
      .whereRaw(`${sessionTable}.expires_at > CURRENT_TIMESTAMP`)
      .select(`${fileTable}.file_name`, `${fileTable}.client_name`)
      .first()
    if (!file) return response.notFound({ message: 'Arquivo não encontrado ou sessão expirada.' })

    const filePath = path.join(captureDirectory(params.id), file.file_name)
    response.type('application/pdf')
    response.header('Cache-Control', 'private, no-store')
    response.header('Content-Disposition', `attachment; filename="${file.client_name}"`)
    return response.send(await fs.readFile(filePath))
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    const user = await auth.use('api').authenticate()
    const session = await Database.from(sessionTable)
      .where('id', params.id)
      .where('companies_id', user.companies_id)
      .where('created_by', user.id)
      .first()
    if (!session) return response.noContent()

    await fs.rm(captureDirectory(session.id), { recursive: true, force: true })
    await Database.from(sessionTable).where('id', session.id).delete()
    return response.noContent()
  }
}
