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

export interface SheetNumberLine {
  text: string
  confidence: number | null
}

// Usado somente pela POC; o buffer contém apenas o recorte da numeração.
export async function extractSheetNumberLines(imageBuffer: Buffer): Promise<SheetNumberLine[]> {
  const [result] = await getClient().documentTextDetection(
    { image: { content: imageBuffer } },
    { timeout: 15000, retry: null }
  )
  if (result.error?.message) throw new Error('Falha no reconhecimento do recorte')
  const lines: SheetNumberLine[] = []
  for (const page of result.fullTextAnnotation?.pages || []) {
    for (const block of page.blocks || []) {
      for (const paragraph of block.paragraphs || []) {
        let words: string[] = []
        let confidences: (number | null)[] = []
        const flush = () => {
          if (!words.length) return
          lines.push({
            text: words.join(' '),
            confidence: confidences.some((value) => value === null) ? null : Math.min(...confidences as number[]),
          })
          words = []
          confidences = []
        }
        for (const word of paragraph.words || []) {
          const symbols = word.symbols || []
          words.push(symbols.map((symbol) => symbol.text || '').join(''))
          confidences.push(typeof word.confidence === 'number' ? word.confidence : null)
          const breakType = symbols[symbols.length - 1]?.property?.detectedBreak?.type
          if ([3, 5, 'EOL_SURE_SPACE', 'LINE_BREAK'].includes(breakType as any)) flush()
        }
        flush()
      }
    }
  }
  return lines
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
