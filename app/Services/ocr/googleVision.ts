import vision from '@google-cloud/vision'
import { existsSync } from 'fs'
import { join } from 'path'
import { PDFParse } from 'pdf-parse'

let client: vision.ImageAnnotatorClient | null = null

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
  const parser = new PDFParse({ data: pdfBuffer })

  try {
    const result = await parser.getText()
    const text = normalizeExtractedText(result?.text || '')

    return text.length >= 10 ? text : ''
  } finally {
    await parser.destroy()
  }
}

export async function extractTextFromFileBuffer(fileBuffer: Buffer, fileNameOrExtension: string): Promise<string> {
  const normalizedFileName = String(fileNameOrExtension || '').toLowerCase()

  if (normalizedFileName === 'pdf' || normalizedFileName.endsWith('.pdf')) {
    return extractPdfSearchableTextFromBuffer(fileBuffer)
  }

  return extractDocumentTextFromBuffer(fileBuffer)
}
