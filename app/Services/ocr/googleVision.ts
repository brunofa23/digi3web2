import vision from '@google-cloud/vision'
import { existsSync } from 'fs'
import { join } from 'path'
import { PDFParse } from 'pdf-parse'

let client: InstanceType<typeof vision.ImageAnnotatorClient> | null = null
const PDF_OCR_MAX_PAGES = Number(process.env.OCR_PDF_MAX_PAGES || 5)

function getClient() {
  if (!client) {
    const defaultKeyFilename = join(
      process.cwd(),
      'config',
      'credentials',
      'google-vision-service-account.json'
    )

    const keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS || defaultKeyFilename

    if (!existsSync(keyFilename)) {
      throw new Error(`Credencial do Google Vision não encontrada em: ${keyFilename}`)
    }

    client = new vision.ImageAnnotatorClient(
      { keyFilename }
    )
  }

  return client
}

export async function extractDocumentTextFromBuffer(imageBuffer: Buffer): Promise<string> {
  const [result] = await getClient().documentTextDetection({
    image: {
      content: imageBuffer,
    },
  })

  return result.fullTextAnnotation?.text || result.textAnnotations?.[0]?.description || ''
}

function normalizeExtractedText(value: string) {
  return String(value || '')
    .replace(/\r/g, '\n')
    .replace(/\n\s*--\s*\d+\s+of\s+\d+\s*--\s*/gi, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export async function extractPdfSearchableTextFromBuffer(pdfBuffer: Buffer): Promise<string> {
  const result = await extractPdfSearchableTextAndPageCount(pdfBuffer)

  return result.text
}

async function extractPdfSearchableTextAndPageCount(pdfBuffer: Buffer): Promise<{ text: string; totalPages: number | null }> {
  const parser = new PDFParse({ data: pdfBuffer })

  try {
    const result = await parser.getText()
    const text = normalizeExtractedText(result?.text || '')
    const totalPages = Number((result as any)?.total || (result as any)?.pages?.length || 0)

    return {
      text: text.length >= 10 ? text : '',
      totalPages: Number.isInteger(totalPages) && totalPages > 0 ? totalPages : null,
    }
  } finally {
    await parser.destroy()
  }
}

function getPdfOcrPageLimit(totalPages: number | null) {
  const maxPages = Number.isInteger(PDF_OCR_MAX_PAGES) && PDF_OCR_MAX_PAGES > 0
    ? Math.min(PDF_OCR_MAX_PAGES, 5)
    : 5

  return totalPages ? Math.min(totalPages, maxPages) : maxPages
}

export async function extractPdfOcrTextFromBuffer(
  pdfBuffer: Buffer,
  totalPages: number | null = null
): Promise<string> {
  const pageLimit = getPdfOcrPageLimit(totalPages)
  const pages = Array.from({ length: pageLimit }, (_, index) => index + 1)
  const [result] = await getClient().batchAnnotateFiles({
    requests: [{
      inputConfig: {
        content: pdfBuffer,
        mimeType: 'application/pdf',
      },
      features: [{
        type: 'DOCUMENT_TEXT_DETECTION',
      }],
      pages,
    }],
  } as any)
  const responses = result.responses?.[0]?.responses || []
  const texts = responses
    .map((responseItem) => responseItem.fullTextAnnotation?.text || responseItem.textAnnotations?.[0]?.description || '')
    .filter((text) => text.trim())

  return normalizeExtractedText(texts.join('\n\n'))
}

export async function extractTextFromFileBuffer(fileBuffer: Buffer, fileNameOrExtension: string): Promise<string> {
  const normalizedFileName = String(fileNameOrExtension || '').toLowerCase()

  if (normalizedFileName === 'pdf' || normalizedFileName.endsWith('.pdf')) {
    const searchable = await extractPdfSearchableTextAndPageCount(fileBuffer)

    if (searchable.text) return searchable.text

    try {
      return await extractPdfOcrTextFromBuffer(fileBuffer, searchable.totalPages)
    } catch {
      return ''
    }
  }

  return extractDocumentTextFromBuffer(fileBuffer)
}
