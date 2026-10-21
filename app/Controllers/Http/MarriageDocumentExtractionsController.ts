import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { readFile } from 'fs/promises'
import { extractMarriageDocument } from 'App/Services/ai/MarriageDocumentExtraction'

export default class MarriageDocumentExtractionsController {
  public async store({ auth, request, response }: HttpContextContract) {
    const user = await auth.use('api').authenticate()
    const documentType = String(request.input('documentType') || '')
    const file = request.file('file', { size: '8mb', extnames: ['jpg', 'jpeg', 'png', 'pdf'] })

    if (!file?.isValid || !file.tmpPath) {
      return response.badRequest({ message: 'Envie uma imagem JPG/PNG ou PDF de até 8 MB.' })
    }

    try {
      return response.ok(await extractMarriageDocument({
        fileBuffer: await readFile(file.tmpPath),
        fileName: file.clientName || '',
        documentType,
        companiesId: user.companies_id,
        userId: user.id,
      }))
    } catch (error) {
      if (error instanceof Error && error.message === 'INVALID_DOCUMENT_TYPE') {
        return response.badRequest({ message: 'Tipo de documento inválido.' })
      }
      if (error instanceof Error && error.message === 'AI_NOT_CONFIGURED') {
        return response.serviceUnavailable({ message: 'Leitura automática indisponível no momento.' })
      }
      console.error('Erro na leitura de documento de casamento:', error instanceof Error ? error.message : error)
      return response.internalServerError({ message: 'Não foi possível ler o documento. Preencha os dados manualmente.' })
    }
  }
}
