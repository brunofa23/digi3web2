import { spawn } from 'child_process'
import { createHash } from 'crypto'
import path from 'path'
import { performance } from 'perf_hooks'
import type { SheetNumberLine } from '../ocr/googleVision'

export const MAX_IMAGE_BYTES = 50 * 1024 * 1024
export const ANALYSIS_VERSION = 'image-analysis-poc-1'
export const REGIONS = ['top_full', 'top_left', 'top_right'] as const
type Region = typeof REGIONS[number]
type Reader = (buffer: Buffer) => Promise<SheetNumberLine[]>

export class ImageAnalysisError extends Error {
  constructor(public code: string, public status: number, message: string) {
    super(message)
  }
}

interface PreparedImage {
  quality: {
    status: string
    width: number
    height: number
    sample_width: number
    sample_height: number
    sharpness: number
    brightness: number
    contrast: number
    dark_fraction: number
    white_fraction: number
    alerts: string[]
  }
  crop: { region: string; box: number[]; width: number; height: number; jpeg_base64: string }
  quality_ms: number
}

function prepareImage(buffer: Buffer, region: Region): Promise<PreparedImage> {
  return new Promise((resolve, reject) => {
    const script = path.resolve(__dirname, '../../../poc/image-analysis/analyze.py')
    const child = spawn('python3', [script, region], { stdio: ['pipe', 'pipe', 'pipe'] })
    let output = ''
    let settled = false
    const finish = (error?: Error, result?: PreparedImage) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (error) reject(error)
      else resolve(result!)
    }
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      finish(new ImageAnalysisError('quality_timeout', 504, 'A avaliação de qualidade excedeu 20 segundos.'))
    }, 20000)
    child.on('error', () => finish(new ImageAnalysisError('python_unavailable', 503, 'Python indisponível para a análise experimental.')))
    child.stdin.on('error', () => { /* A saída do processo informa a falha. */ })
    child.stderr.on('data', () => { /* Não expor caminhos ou detalhes internos. */ })
    child.stdout.on('data', (chunk) => {
      output += chunk.toString()
      if (output.length > 8 * 1024 * 1024) {
        child.kill('SIGKILL')
        finish(new ImageAnalysisError('quality_output_limit', 502, 'Resposta de análise maior que o limite permitido.'))
      }
    })
    child.on('close', (code) => {
      if (settled) return
      try {
        const result = JSON.parse(output)
        if (result.error) {
          return finish(new ImageAnalysisError(result.error, 422, 'Imagem não suportada: use uma fotografia válida de até 50 MB e 20 megapixels, com uma única página.'))
        }
        if (code !== 0 || !result.quality || !result.crop?.jpeg_base64) throw new Error('invalid_output')
        finish(undefined, result)
      } catch {
        finish(new ImageAnalysisError('quality_unavailable', 503, 'Avaliação de qualidade indisponível. Verifique a instalação das dependências Python da POC.'))
      }
    })
    child.stdin.end(buffer)
  })
}

// Somente texto e confiança extraídos do recorte, nunca a folha esperada.
export function detectSheet(lines: SheetNumberLine[]) {
  const candidates: { value: number; confidence: number | null; evidence: string }[] = []
  for (const line of lines) {
    const text = line.text.trim()
    const labeled = [...text.matchAll(/\b(?:folhas?|fls?\.?)\s*[:.\-]?\s*(?:n[º°o.]\s*)?(\d{1,5})(?![\d.,/\-])/gi)]
    const narrative = /(?:^|\s)(?:[aà]s?|nas?|pelas?)\s+folhas?\b/i.test(text)
    const isolated = text.match(/^\s*(\d{1,5})\s*[FfVv]?\s*$/)
    const values = !narrative && labeled.length ? labeled.map((match) => match[1]) : isolated ? [isolated[1]] : []
    for (const value of values) {
      if (Number(value) <= 0) continue
      const confidence = Number.isFinite(line.confidence) ? Math.max(0, Math.min(1, line.confidence!)) : null
      candidates.push({ value: Number(value), confidence, evidence: labeled.length ? 'Folha ' + Number(value) : value })
    }
  }
  const distinct = new Set(candidates.map((item) => item.value))
  candidates.sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
  const best = candidates[0]
  const status = distinct.size > 1 ? 'ambiguous' : !best ? 'not_found'
    : best.confidence === null || best.confidence < 0.8 ? 'low_confidence' : 'detected'
  return {
    status,
    detected_sheet: status === 'detected' ? best.value : null,
    confidence: distinct.size === 1 ? best.confidence : null,
    confidence_kind: 'ocr_score_not_calibrated',
    candidates: candidates.slice(0, 10),
    candidate_count: distinct.size,
  }
}

export async function analyzeImage(buffer: Buffer, region: Region = 'top_full', reader?: Reader) {
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) {
    throw new ImageAnalysisError('invalid_size', 422, 'A imagem deve ter entre 1 byte e 50 MB.')
  }
  if (!REGIONS.includes(region)) throw new ImageAnalysisError('invalid_region', 422, 'Região de análise inválida.')
  const started = performance.now()
  const prepared = await prepareImage(buffer, region)
  const ocrStarted = performance.now()
  let sheet: ReturnType<typeof detectSheet> & { error?: string } = detectSheet([])
  try {
    const read = reader || (await import('../ocr/googleVision')).extractSheetNumberLines
    sheet = detectSheet(await read(Buffer.from(prepared.crop.jpeg_base64, 'base64')))
  } catch {
    sheet = { ...sheet, status: 'unavailable', error: 'A leitura da numeração está indisponível. A avaliação de qualidade foi concluída; tente novamente.' }
  }
  return {
    version: ANALYSIS_VERSION,
    analyzed_sha256: createHash('sha256').update(buffer).digest('hex'),
    quality: prepared.quality,
    sheet_detection: sheet,
    crop: prepared.crop,
    timings: {
      quality_ms: prepared.quality_ms,
      ocr_ms: Math.round(performance.now() - ocrStarted),
      analysis_ms: Math.round(performance.now() - started),
    },
  }
}
