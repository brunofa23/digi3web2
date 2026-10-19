import { extractTextFromFileBuffer } from 'App/Services/ocr/googleVision'
import { extractAiFields, ExtractedField } from './AiFieldExtractor'
import { DateTime } from 'luxon'

const personFields = ['name', 'cpf', 'dateBirth', 'birthCity', 'gender', 'nationality', 'documentType', 'documentNumber']
const addressFields = ['holderName', 'zipCode', 'address', 'streetNumber', 'district', 'city', 'state']

const documentFields: Record<string, string[]> = {
  DocumentRegistered: personFields,
  DnvDocument: ['dnvNumber'],
  DocumentFiliation1: [...personFields, 'grandfatherFiliation1', 'grandmotherFiliation1'],
  ProofResidenceFiliation1: addressFields,
  DocumentFiliation2: personFields,
  ProofResidenceFiliation2: addressFields,
  DocumentDeclarant: personFields,
  ProofResidenceDeclarant: addressFields,
}

const documentContext: Record<string, string> = {
  DocumentRegistered: 'Documento de identidade do registrado. Extraia os dados do titular, sem atribuir a ele dados dos pais. birthCity é o município de nascimento/naturalidade do titular, não o de residência ou emissão.',
  DnvDocument: 'Declaração de Nascido Vivo manuscrita. Extraia somente o número da DNV se estiver legível.',
  DocumentFiliation1: 'Documento de identidade da pessoa indicada como filiação 1. Extraia os dados do titular. birthCity é o município de nascimento/naturalidade do titular, não o de residência ou emissão. Os pais do titular são os avós da criança: o pai do titular é grandfatherFiliation1 e a mãe do titular é grandmotherFiliation1. Use apenas a filiação explicitamente identificada no documento.',
  ProofResidenceFiliation1: 'Comprovante de endereço apresentado para filiação 1. O titular pode ser outra pessoa; informe holderName separadamente.',
  DocumentFiliation2: 'Documento de identidade da pessoa indicada como filiação 2. Extraia os dados do titular. birthCity é o município de nascimento/naturalidade do titular, não o de residência ou emissão.',
  ProofResidenceFiliation2: 'Comprovante de endereço apresentado para filiação 2. O titular pode ser outra pessoa; informe holderName separadamente.',
  DocumentDeclarant: 'Documento de identidade do declarante. Extraia os dados do titular. birthCity é o município de nascimento/naturalidade do titular, não o de residência ou emissão.',
  ProofResidenceDeclarant: 'Comprovante de endereço apresentado para o declarante. O titular pode ser outra pessoa; informe holderName separadamente.',
}

function validCpf(value: string) {
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false
  for (const length of [9, 10]) {
    const sum = digits.slice(0, length).split('').reduce((total, digit, index) => total + Number(digit) * (length + 1 - index), 0)
    if ((sum * 10) % 11 % 10 !== Number(digits[length])) return false
  }
  return true
}

function cleanField(item: ExtractedField, allowed: string[], text: string): ExtractedField | null {
  if (!allowed.includes(item.field) || typeof item.value !== 'string' || typeof item.evidence !== 'string') return null
  let value = item.value.trim().slice(0, 255)
  const evidence = item.evidence.trim().slice(0, 300)
  const normalize = (source: string) => source.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('pt-BR')
  if (!value || !evidence || !normalize(text).includes(normalize(evidence))) return null
  if (['birthCity', 'grandfatherFiliation1', 'grandmotherFiliation1'].includes(item.field) && !normalize(evidence).includes(normalize(value))) return null
  if (item.field === 'cpf') {
    value = value.replace(/\D/g, '')
    if (!validCpf(value)) return null
  }
  if (item.field === 'zipCode') {
    value = value.replace(/\D/g, '')
    if (value.length !== 8) return null
  }
  if (item.field === 'state') {
    value = value.toUpperCase()
    if (!/^[A-Z]{2}$/.test(value)) return null
  }
  if (item.field === 'dateBirth' && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !DateTime.fromISO(value).isValid)) return null
  if (item.field === 'gender') {
    value = value.toUpperCase()
    if (!['M', 'F'].includes(value)) return null
  }
  if (item.field === 'documentType' && !['RG', 'CPF', 'CNH', 'Passaporte'].includes(value)) return null
  if (item.field === 'dnvNumber' && !/^[\d.\-\s]{5,30}$/.test(value)) return null
  return { field: item.field, value, evidence }
}

export async function extractBirthDocument(input: {
  fileBuffer: Buffer
  fileName: string
  documentType: string
  companiesId: number
  userId: number
}) {
  const fields = documentFields[input.documentType]
  if (!fields) throw new Error('INVALID_DOCUMENT_TYPE')
  const ocrText = await extractTextFromFileBuffer(input.fileBuffer, input.fileName)
  if (!ocrText.trim()) return { fields: [], message: 'Não foi possível ler texto neste documento.' }

  const textForAi = ocrText.slice(0, 15000)
  const suggestions = await extractAiFields({
    text: textForAi,
    documentType: input.documentType,
    context: documentContext[input.documentType],
    fields,
    companiesId: input.companiesId,
    userId: input.userId,
    useCase: 'birth_certificate_attachment',
  })
  const seen = new Set<string>()
  const checked = suggestions
    .map((item) => cleanField(item, fields, textForAi))
    .filter((item): item is ExtractedField => Boolean(item))
    .filter((item) => {
      if (seen.has(item.field)) return false
      seen.add(item.field)
      return true
    })
  return { fields: checked, message: checked.length ? '' : 'Nenhum campo pôde ser sugerido com evidência verificável.' }
}
