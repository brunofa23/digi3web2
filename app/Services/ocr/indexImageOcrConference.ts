import crypto from 'crypto'
import sharp from 'sharp'
import { extractOcrPageFromBuffer, extractTextFromFileBuffer, OcrPage } from './googleVision'

export type OcrEntity = {
  entity_type: 'name' | 'document' | 'sheet' | 'term'
  value: string
  normalized_value: string
  confidence: number
  evidence_text: string | null
}

type ExtractOcrEntitiesOptions = {
  detectedSheet?: number | null
  detectedTerm?: string | number | null
  sheetConfidence?: number
  termConfidence?: number
  sheetEvidence?: string | null
  termEvidence?: string | null
}

type OcrCheckResult = {
  detectedSheet: number | null
  detectedTerm: string | null
  confidence: number
  confidenceLevel: 'high' | 'medium' | 'low'
  evidenceText: string | null
  source: string
  entities: OcrEntity[]
}

type OcrExtractionOptions = {
  extractionRegion?: string
  positiveKeywords?: string[]
  negativeKeywords?: string[]
}

type Candidate = {
  value: string
  confidence: number
  evidence: string
  source: string
  priority: number
  lineIndex: number
}

type RatioCrop = {
  source: string
  left: number
  top: number
  width: number
  height: number
  priority: number
}

const DEFAULT_POSITIVE_KEYWORDS = ['LIVRO', 'FOLHAS', 'TERMO']
const DEFAULT_NEGATIVE_KEYWORDS = [
  'AS FOLHAS',
  'A FOLHAS',
  'DO LIVRO',
  'NO LIVRO',
  'SOB O TERMO',
  'EM DATA',
  'REGISTRADO',
  'REGISTRADA',
]

function normalizeSearchValue(value: string) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function normalizeEvidence(value: string) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500)
}

function normalizeMatchText(value: string) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
}

function normalizeKeywordText(value: string) {
  return normalizeMatchValue(value)
}

function normalizeMatchValue(value: string) {
  return normalizeMatchText(value)
    .replace(/[^A-Z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeKeywordList(keywords: string[] = []) {
  return Array.from(
    new Set(
      keywords
        .map((keyword) => normalizeKeywordText(keyword))
        .filter(Boolean)
    )
  )
}

function normalizeNumber(value: string) {
  const digits = String(value || '')
    .replace(/[Oo]/g, '0')
    .replace(/[Il]/g, '1')
    .replace(/\D/g, '')

  return digits ? Number(digits) : null
}

function normalizeDigitsText(value: string) {
  return String(value || '')
    .replace(/[Oo]/g, '0')
    .replace(/[Il]/g, '1')
    .replace(/\D/g, '')
}

function onlyDigits(value: string) {
  return String(value || '').replace(/\D/g, '')
}

function confidenceLevel(confidence: number): OcrCheckResult['confidenceLevel'] {
  if (confidence >= 0.92) return 'high'
  if (confidence >= 0.7) return 'medium'

  return 'low'
}

function isValidCpf(cpf: string) {
  const digits = onlyDigits(cpf)

  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false

  let sum = 0
  for (let index = 0; index < 9; index++) sum += Number(digits[index]) * (10 - index)
  const firstDigit = 11 - (sum % 11)
  if ((firstDigit >= 10 ? 0 : firstDigit) !== Number(digits[9])) return false

  sum = 0
  for (let index = 0; index < 10; index++) sum += Number(digits[index]) * (11 - index)
  const secondDigit = 11 - (sum % 11)

  return (secondDigit >= 10 ? 0 : secondDigit) === Number(digits[10])
}

function isValidCnpj(cnpj: string) {
  const digits = onlyDigits(cnpj)

  if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) return false

  const calc = (length: number) => {
    const weights = length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const sum = weights.reduce((total, weight, index) => total + Number(digits[index]) * weight, 0)
    const digit = 11 - (sum % 11)

    return digit >= 10 ? 0 : digit
  }

  return calc(12) === Number(digits[12]) && calc(13) === Number(digits[13])
}

function uniqueEntities(entities: OcrEntity[]) {
  const found = new Map<string, OcrEntity>()

  for (const entity of entities) {
    const key = `${entity.entity_type}:${entity.normalized_value}`
    const current = found.get(key)

    if (!current || entity.confidence > current.confidence) {
      found.set(key, entity)
    }
  }

  return Array.from(found.values())
}

function extractDocumentEntities(text: string): OcrEntity[] {
  const matches = text.match(/\b(?:\d{3}\.?\d{3}\.?\d{3}-?\d{2}|\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})\b/g) || []

  return matches
    .map((value) => onlyDigits(value))
    .filter((value) => isValidCpf(value) || isValidCnpj(value))
    .map((value) => ({
      entity_type: 'document' as const,
      value,
      normalized_value: value,
      confidence: 0.98,
      evidence_text: value,
    }))
}

function cleanName(value: string) {
  return String(value || '')
    .replace(/[^A-Za-zÀ-ÖØ-öø-ÿ' ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const NAME_PARTICLES = new Set(['A', 'AS', 'DA', 'DAS', 'DE', 'DI', 'DO', 'DOS', 'E'])
const NAME_REJECT_WORDS = new Set([
  'ACAO',
  'ADICIONAL',
  'ANO',
  'ART',
  'ARTS',
  'BASE',
  'BENS',
  'CARTORIO',
  'CAUSA',
  'CIDADE',
  'CIVEL',
  'COMARCA',
  'COMPARECEU',
  'COMPROMISSO',
  'CONFORME',
  'CURADOR',
  'CURADORA',
  'CURATELA',
  'DATA',
  'DECIDO',
  'DECRETO',
  'DESIGNACAO',
  'DIREITO',
  'DOCUMENTOS',
  'EMOLUMENTO',
  'ESTADO',
  'ETC',
  'FOLHA',
  'FOLHAS',
  'GERAIS',
  'GOVERNADOR',
  'HIPOTECA',
  'INCAPACIDADE',
  'INTERDICAO',
  'INTERDITANDA',
  'INTERROGATORIO',
  'JUIZ',
  'LAUDO',
  'LIVRO',
  'MANDADO',
  'MANIFESTACAO',
  'MATRICULA',
  'MINAS',
  'NATURAIS',
  'NOMEACAO',
  'OFICIAL',
  'PESSOA',
  'PESSOAS',
  'PERICIA',
  'PROVISORIA',
  'PROVISORIO',
  'PUBLIQUE',
  'RECEITA',
  'REGISTRAL',
  'REGISTRO',
  'RELATORIO',
  'REQUERENTE',
  'SENTENCA',
  'SERVICO',
  'SUBDISTRITO',
  'TERMO',
  'VALADARES',
  'VARA',
  'VISTOS',
])

const NAME_STOP_PATTERN = /\b(?:alegou|brasileir[ao]s?|casad[ao]s?|com|declar(?:a|ou|o)|domiciliad[ao]s?|em|estado|filh[ao]s?|homologad[ao]s?|natural|pediu|profiss[aã]o|qualificad[ao]s?|registrad[ao]s?|requer(?:eu|e|eram)|residentes?|solteir[ao]s?)\b.*$/i

function trimNameCandidate(value: string) {
  return cleanName(value)
    .replace(NAME_STOP_PATTERN, '')
    .replace(/\b(?:Dr|Dra|Sr|Sra|D)\b\.?/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function isPersonNameCandidate(value: string) {
  const name = trimNameCandidate(value)
  const words = name.split(' ').filter(Boolean)
  const meaningfulWords = words.filter((word) => !NAME_PARTICLES.has(normalizeMatchValue(word)))

  if (name.length < 8 || words.length < 2 || words.length > 8 || meaningfulWords.length < 2) return false

  let nameLikeWords = 0

  for (const word of meaningfulWords) {
    const normalizedWord = normalizeMatchValue(word)

    if (word.length < 2 || NAME_REJECT_WORDS.has(normalizedWord)) return false
    if (/^[A-ZÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ]/.test(word) || word === word.toUpperCase()) nameLikeWords++
  }

  return nameLikeWords >= 2
}

function pushNameEntity(entities: OcrEntity[], value: string, confidence: number, evidence: string) {
  const name = trimNameCandidate(value)

  if (!isPersonNameCandidate(name)) return

  entities.push({
    entity_type: 'name',
    value: name,
    normalized_value: normalizeSearchValue(name),
    confidence,
    evidence_text: normalizeEvidence(evidence),
  })
}

function extractUppercaseNameCandidates(line: string) {
  const matches = line.match(/\b[A-ZÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ]{2,}(?:\s+(?:D[AEIO]S?|E|[A-ZÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ]{2,})){1,7}\b/g) || []

  return matches.map((value) => trimNameCandidate(value)).filter(Boolean)
}

function extractNameEntities(text: string): OcrEntity[] {
  const entities: OcrEntity[] = []
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
  const labeledPatterns = [
    /(?:^|\b)nome\s*[:\-]?\s*([A-ZÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ][A-Za-zÀ-ÖØ-öø-ÿ' ]{5,})/i,
    /(?:^|\b)compareceu\s+([A-ZÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ][A-Za-zÀ-ÖØ-öø-ÿ' ]{5,})/i,
    /(?:^|\b)nasceu\s+([A-ZÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ][A-Za-zÀ-ÖØ-öø-ÿ' ]{5,})/i,
    /(?:^|\b)falec(?:eu|ido|ida)\s+([A-ZÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ][A-Za-zÀ-ÖØ-öø-ÿ' ]{5,})/i,
    /(?:^|\b)filh[ao]\s+(?:legitim[ao]\s+)?de\s+([A-ZÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ][A-Za-zÀ-ÖØ-öø-ÿ' ]{5,})/i,
    /(?:^|\b)(?:interdi[cç][aã]o|interditand[ao]|requerente|curador[ao]?|declarante)\s+(?:de\s+)?([A-ZÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ][A-Za-zÀ-ÖØ-öø-ÿ' ]{5,})/i,
  ]

  for (const line of lines) {
    for (const pattern of labeledPatterns) {
      const match = line.match(pattern)
      pushNameEntity(entities, match?.[1] || '', 0.88, line)
    }

    for (const name of extractUppercaseNameCandidates(line)) {
      pushNameEntity(entities, name, 0.82, line)
    }
  }

  for (const line of lines) {
    const name = cleanName(line)

    if (!/\d/.test(name) && name === name.toUpperCase()) {
      pushNameEntity(entities, name, 0.64, line)
    }
  }

  return entities.slice(0, 40)
}

function lineLimitByRegion(region?: string) {
  if (region === 'full_page') return Number.POSITIVE_INFINITY
  if (region === 'upper_half') return 90

  return 60
}

function cropRatioByRegion(region?: string) {
  if (region === 'full_page') return null
  if (region === 'upper_half') return 0.5

  return 0.35
}

function minimumPriorityByRegion(region?: string) {
  return region === 'full_page' ? 20 : 35
}

function extractHeaderCandidates(text: string, source: string, options: OcrExtractionOptions = {}) {
  const sheetCandidates: Candidate[] = []
  const termCandidates: Candidate[] = []
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
  const lineLimit = lineLimitByRegion(options.extractionRegion)
  const headerLines = Number.isFinite(lineLimit) ? lines.slice(0, lineLimit) : lines
  const positiveKeywords = normalizeKeywordList([
    ...DEFAULT_POSITIVE_KEYWORDS,
    ...(options.positiveKeywords || []),
  ])
  const negativeKeywords = normalizeKeywordList([
    ...DEFAULT_NEGATIVE_KEYWORDS,
    ...(options.negativeKeywords || []),
  ])

  const candidatePriority = (line: string, context: string) => {
    const normalizedLine = normalizeMatchText(line)
    const normalizedContext = normalizeMatchText(context)
    const searchableLine = normalizeMatchValue(line)
    const searchableContext = normalizeMatchValue(context)
    let priority = 0

    if (/\bLIVRO\b/.test(normalizedContext)) priority += 20
    if (/\bFOLHAS?\b|\bFLS\b/.test(normalizedContext)) priority += 20
    if (/\bTERMO\b|\bREGISTRO\b|\bMATRICULA\b/.test(normalizedContext)) priority += 20
    if (/\bSERVICO\b|\bREGISTRAL\b|\bPESSOAS\b|\bNATURAIS\b|\bTRANSCRICAO\b/.test(normalizedContext)) priority += 10
    if (/\bFOLHAS?\s*:/.test(normalizedLine)) priority += 20
    if (/\bTERMO\s*:/.test(normalizedLine)) priority += 20
    if (/\bFOLHAS?\b.*\bTERMO\b|\bTERMO\b.*\bFOLHAS?\b/.test(normalizedLine)) priority += 30
    if (source.includes('level_2')) priority += 5

    for (const keyword of positiveKeywords) {
      if (searchableLine.includes(keyword)) priority += 12
      else if (searchableContext.includes(keyword)) priority += 6
    }

    for (const keyword of negativeKeywords) {
      if (searchableLine.includes(keyword)) priority -= 45
      else if (searchableContext.includes(keyword)) priority -= 15
    }

    return priority
  }

  for (const [lineIndex, line] of headerLines.entries()) {
    const context = headerLines
      .slice(Math.max(0, lineIndex - 2), Math.min(headerLines.length, lineIndex + 3))
      .join(' ')
    const priority = candidatePriority(line, context)
    const confidence = Math.max(0.2, Math.min(0.98, 0.55 + (priority / 100)))
    const sheetMatch = line.match(/(?:folhas?|fls?\.?)\s*[:nº°o.\-]*\s*([0-9OoIl\s.\-]{1,10})/i)
    const termMatch = line.match(/(?:termo|registro|matr[ií]cula)\s*[:nº°o.\-]*\s*([0-9OoIl\s.\-]{1,14})/i)

    if (sheetMatch?.[1] && normalizeDigitsText(sheetMatch[1])) {
      sheetCandidates.push({
        value: sheetMatch[1],
        confidence,
        evidence: normalizeEvidence(line),
        source,
        priority,
        lineIndex,
      })
    }

    if (termMatch?.[1] && normalizeDigitsText(termMatch[1])) {
      termCandidates.push({
        value: termMatch[1],
        confidence,
        evidence: normalizeEvidence(line),
        source,
        priority,
        lineIndex,
      })
    }
  }

  return { sheetCandidates, termCandidates }
}

function isPdfFile(fileName: string) {
  return String(fileName || '').toLowerCase().endsWith('.pdf')
}

function sharpInput(fileBuffer: Buffer, fileName: string) {
  return isPdfFile(fileName)
    ? sharp(fileBuffer, { density: 200, page: 0, pages: 1 })
    : sharp(fileBuffer)
}

async function buildTopCrop(fileBuffer: Buffer, ratio: number, fileName: string) {
  const image = sharpInput(fileBuffer, fileName)
  const metadata = await image.metadata()
  const width = metadata.width || 0
  const height = metadata.height || 0

  if (!width || !height) return null

  return sharpInput(fileBuffer, fileName)
    .extract({ left: 0, top: 0, width, height: Math.max(1, Math.floor(height * ratio)) })
    .grayscale()
    .normalize()
    .sharpen()
    .resize({ width: Math.min(width * 2, 2400), withoutEnlargement: false })
    .jpeg({ quality: 92 })
    .toBuffer()
}

async function buildRatioCrop(fileBuffer: Buffer, crop: RatioCrop, fileName: string) {
  const image = sharpInput(fileBuffer, fileName)
  const metadata = await image.metadata()
  const imageWidth = metadata.width || 0
  const imageHeight = metadata.height || 0

  if (!imageWidth || !imageHeight) return null

  const left = Math.max(0, Math.floor(imageWidth * crop.left))
  const top = Math.max(0, Math.floor(imageHeight * crop.top))
  const width = Math.max(1, Math.min(imageWidth - left, Math.floor(imageWidth * crop.width)))
  const height = Math.max(1, Math.min(imageHeight - top, Math.floor(imageHeight * crop.height)))

  return sharpInput(fileBuffer, fileName)
    .extract({ left, top, width, height })
    .grayscale()
    .normalize()
    .sharpen()
    .resize({ width: Math.min(Math.max(width * 3, 900), 1800), withoutEnlargement: false })
    .jpeg({ quality: 92 })
    .toBuffer()
}

function firstCandidate(
  candidates: Candidate[],
  minimumPriority: number
): { candidate: Candidate | null, ambiguity: string | null } {
  const ranked = candidates
    .sort((current, next) => {
      if (next.priority !== current.priority) return next.priority - current.priority
      if (next.confidence !== current.confidence) return next.confidence - current.confidence

      return current.lineIndex - next.lineIndex
    })
  const candidate = ranked[0] || null

  if (!candidate || candidate.priority < minimumPriority) return { candidate: null, ambiguity: null }

  const selectedNumber = normalizeNumber(candidate.value)
  const conflict = ranked.find((item) =>
    item !== candidate &&
    item.priority >= minimumPriority &&
    item.priority >= candidate.priority - 15 &&
    normalizeNumber(item.value) !== selectedNumber
  )

  if (conflict) {
    return {
      candidate: null,
      ambiguity: `Números conflitantes: ${candidate.value.trim()} e ${conflict.value.trim()}`,
    }
  }

  return { candidate, ambiguity: null }
}

function extractProminentNumberCandidates(page: OcrPage): Candidate[] {
  const textHeights = page.words
    .filter((word) => /[A-Za-zÀ-ÖØ-öø-ÿ]{2}/.test(word.text))
    .map((word) => word.bottom - word.top)
    .filter((height) => height > 0)
    .sort((a, b) => a - b)
  const typicalHeight = textHeights.length
    ? textHeights[Math.floor(textHeights.length / 2)]
    : 0

  if (!typicalHeight) return []

  return page.words.flatMap((word, lineIndex) => {
    const value = word.text.trim().replace(/[.,;:]$/, '')
    const height = word.bottom - word.top
    const number = normalizeNumber(value)

    if (!/^[0-9OoIl]{1,4}$/.test(value) || !/\d/.test(value) || number === null || height <= 0) return []

    const sizeRatio = height / typicalHeight
    const nearestGap = page.words.reduce((nearest, other) => {
      if (other === word) return nearest

      const horizontalGap = Math.max(0, other.left - word.right, word.left - other.right)
      const verticalGap = Math.max(0, other.top - word.bottom, word.top - other.bottom)

      return Math.min(nearest, Math.hypot(horizontalGap, verticalGap))
    }, Number.POSITIVE_INFINITY)
    const isolated = nearestGap >= typicalHeight * 3

    if (sizeRatio < 1.35 && !isolated) return []

    const nearMargin = page.width > 0 && page.height > 0 && (
      word.left < page.width * 0.18 || word.right > page.width * 0.82 ||
      word.top < page.height * 0.15 || word.bottom > page.height * 0.85
    )
    const priority = 35 + Math.min(35, Math.max(0, sizeRatio - 1) * 30) +
      (isolated ? 20 : 0) + (nearMargin ? 5 : 0) + Math.min(10, Math.max(0, word.confidence) * 10)

    if (priority < 55) return []

    return [{
      value: String(number),
      confidence: Math.min(0.95, 0.45 + Math.min(0.25, Math.max(0, sizeRatio - 1) * 0.25) +
        (isolated ? 0.15 : 0) + Math.min(0.1, Math.max(0, word.confidence) * 0.1)),
      evidence: `Número destacado ${word.text} (${Math.round(sizeRatio * 10) / 10}x o texto, posição ${Math.round(word.left / (page.width || 1) * 100)}%/${Math.round(word.top / (page.height || 1) * 100)}%)`,
      source: 'google_vision_page_layout',
      priority,
      lineIndex,
    }]
  })
}

function buildCheckResult(
  fullText: string,
  sheet: Candidate | null,
  term: Candidate | null,
  defaultSource: string,
  ambiguity: string | null = null
): OcrCheckResult {
  const detectedSheet = sheet ? normalizeNumber(sheet.value) : null
  const detectedTerm = term ? normalizeDigitsText(term.value) || term.value : null
  const confidence = sheet?.confidence || 0
  const evidenceText = normalizeEvidence([ambiguity, sheet?.evidence, term?.evidence].filter(Boolean).join(' | ')) || null
  const source = sheet?.source || term?.source || defaultSource
  const entities = extractOcrEntitiesFromText(fullText, {
    detectedSheet,
    detectedTerm,
    sheetConfidence: sheet?.confidence || 0.7,
    termConfidence: term?.confidence || 0.7,
    sheetEvidence: sheet?.evidence || null,
    termEvidence: term?.evidence || null,
  })

  return {
    detectedSheet,
    detectedTerm,
    confidence,
    confidenceLevel: confidenceLevel(confidence),
    evidenceText,
    source,
    entities,
  }
}

export async function extractHeaderKeywordConference(
  fileBuffer: Buffer,
  fileName: string,
  options: OcrExtractionOptions = {}
): Promise<OcrCheckResult> {
  const page = await extractOcrPageFromBuffer(fileBuffer, fileName)
  const fullText = page.text
  const level1 = extractHeaderCandidates(fullText, 'google_vision_level_1', options)
  let sheetCandidates = [...level1.sheetCandidates, ...extractProminentNumberCandidates(page)]
  let termCandidates = [...level1.termCandidates]
  const cropRatio = cropRatioByRegion(options.extractionRegion)

  if (cropRatio) {
    let topCrop: Buffer | null = null

    try {
      topCrop = await buildTopCrop(fileBuffer, cropRatio, fileName)
    } catch {}

    if (topCrop) {
      const topText = await extractTextFromFileBuffer(topCrop, '.jpg')
      const level2 = extractHeaderCandidates(topText, 'google_vision_level_2_top', options)
      sheetCandidates = [...sheetCandidates, ...level2.sheetCandidates]
      termCandidates = [...termCandidates, ...level2.termCandidates]
    }
  }

  const minimumPriority = minimumPriorityByRegion(options.extractionRegion)
  const sheetSelection = firstCandidate(sheetCandidates, minimumPriority)
  const termSelection = firstCandidate(termCandidates, minimumPriority)

  if (!sheetSelection.candidate && !sheetSelection.ambiguity) {
    const cornerSelection = await extractTopNumberFromCrops(fileBuffer, fileName, 'top_right')
    sheetSelection.candidate = cornerSelection.candidate
    sheetSelection.ambiguity = cornerSelection.ambiguity
  }

  return buildCheckResult(
    fullText,
    sheetSelection.candidate,
    termSelection.candidate,
    'google_vision_level_1',
    sheetSelection.ambiguity || termSelection.ambiguity
  )
}

function topNumberCropsByRegion(region?: string): RatioCrop[] {
  const topRightFocused = {
    source: 'google_vision_top_number_right_focused',
    left: 0.78,
    top: 0.02,
    width: 0.18,
    height: 0.16,
    priority: 70,
  }
  const topRight = {
    source: 'google_vision_top_number_right',
    left: 0.68,
    top: 0,
    width: 0.32,
    height: 0.22,
    priority: 55,
  }
  const topLeft = {
    source: 'google_vision_top_number_left',
    left: 0,
    top: 0,
    width: 0.32,
    height: 0.22,
    priority: 55,
  }
  const topFull = {
    source: 'google_vision_top_number_full',
    left: 0,
    top: 0,
    width: 1,
    height: 0.18,
    priority: 25,
  }

  if (region === 'top_right') return [topRightFocused, topRight]
  if (region === 'top_left') return [topLeft, topFull]
  if (region === 'top_full') return [topFull]

  return [topRight, topLeft, topFull]
}

function extractTopNumberCandidates(text: string, source: string, sourcePriority: number) {
  const candidates: Candidate[] = []
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)

  for (const [lineIndex, line] of lines.entries()) {
    const searchableLine = normalizeMatchValue(line)
    const letters = searchableLine.replace(/[0-9 ]/g, '')
    const rawMatches = line.match(/[0-9OoIl]{1,4}/g) || []
    const numbers = rawMatches
      .map((value) => normalizeDigitsText(value))
      .filter((value) => value.length >= 1 && value.length <= 4)

    if (!numbers.length || rawMatches.length > 2 || letters.length > 2) continue

    for (const value of numbers) {
      const number = Number(value)

      if (!Number.isInteger(number) || number <= 0) continue

      let priority = sourcePriority

      if (lineIndex <= 2) priority += 20
      if (value.length <= 3) priority += 10
      if (normalizeEvidence(line).length <= 8) priority += 20
      if (source.includes('full')) priority -= 10

      candidates.push({
        value,
        confidence: Math.max(0.2, Math.min(0.98, 0.55 + (priority / 100))),
        evidence: normalizeEvidence(line),
        source,
        priority,
        lineIndex,
      })
    }
  }

  return candidates
}

async function extractTopNumberFromCrops(
  fileBuffer: Buffer,
  fileName: string,
  region: string,
  fullText = ''
) {
  let sheetCandidates: Candidate[] = []

  for (const crop of topNumberCropsByRegion(region)) {
    let croppedImage: Buffer | null = null

    try {
      croppedImage = await buildRatioCrop(fileBuffer, crop, fileName)
    } catch {}

    if (!croppedImage) continue

    const croppedText = await extractTextFromFileBuffer(croppedImage, '.jpg')
    sheetCandidates = [
      ...sheetCandidates,
      ...extractTopNumberCandidates(croppedText, crop.source, crop.priority),
    ]
  }

  if (!sheetCandidates.length && fullText) {
    sheetCandidates = extractTopNumberCandidates(fullText, 'google_vision_top_number_full_text', 25)
  }

  return firstCandidate(sheetCandidates, 50)
}

export async function extractTopIsolatedNumberConference(
  fileBuffer: Buffer,
  fileName: string,
  options: OcrExtractionOptions = {}
): Promise<OcrCheckResult> {
  const fullText = await extractTextFromFileBuffer(fileBuffer, fileName)
  const sheetSelection = await extractTopNumberFromCrops(
    fileBuffer,
    fileName,
    options.extractionRegion || 'top_external',
    fullText
  )

  return buildCheckResult(fullText, sheetSelection.candidate, null, 'google_vision_top_number', sheetSelection.ambiguity)
}

export function compareNumberStatus(expected: number | null | undefined, detected: number | null) {
  if (detected === null || detected === undefined) return 'not_found'
  if (expected === null || expected === undefined || Number.isNaN(Number(expected))) return 'detected'

  return Number(expected) === Number(detected) ? 'match' : 'divergent'
}

export function compareTermStatus(expected: string | null | undefined, detected: string | null) {
  const expectedValue = onlyDigits(String(expected || '')) || normalizeSearchValue(String(expected || ''))
  const detectedValue = onlyDigits(String(detected || '')) || normalizeSearchValue(String(detected || ''))

  if (!detectedValue) return 'not_found'
  if (!expectedValue) return 'detected'

  return expectedValue === detectedValue ? 'match' : 'divergent'
}

export function normalizeOcrSearchValue(value: string) {
  return normalizeSearchValue(value)
}

export function hashOcrSearchValue(value: string) {
  const normalized = normalizeOcrSearchValue(value)

  return normalized
    ? crypto.createHash('sha256').update(normalized).digest('hex')
    : ''
}

export function extractOcrEntitiesFromText(
  text: string,
  options: ExtractOcrEntitiesOptions = {}
) {
  const detectedTerm = options.detectedTerm !== null && options.detectedTerm !== undefined
    ? normalizeDigitsText(String(options.detectedTerm)) || String(options.detectedTerm).trim()
    : null
  const detectedSheet = options.detectedSheet !== null && options.detectedSheet !== undefined
    ? Number(options.detectedSheet)
    : null
  const entities: OcrEntity[] = [
    ...extractDocumentEntities(text),
    ...extractNameEntities(text),
  ]

  if (detectedSheet !== null && Number.isInteger(detectedSheet) && detectedSheet > 0) {
    entities.push({
      entity_type: 'sheet',
      value: String(detectedSheet),
      normalized_value: String(detectedSheet),
      confidence: options.sheetConfidence || 0.7,
      evidence_text: options.sheetEvidence || null,
    })
  }

  if (detectedTerm) {
    entities.push({
      entity_type: 'term',
      value: detectedTerm,
      normalized_value: normalizeSearchValue(detectedTerm),
      confidence: options.termConfidence || 0.7,
      evidence_text: options.termEvidence || null,
    })
  }

  return uniqueEntities(entities)
}
