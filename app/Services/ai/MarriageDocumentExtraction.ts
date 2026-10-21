import { DateTime } from 'luxon'
import { extractTextFromFileBuffer } from 'App/Services/ocr/googleVision'
import { ExtractedField, extractAiFields } from './AiFieldExtractor'

const identityFields = ['name', 'cpf', 'dateBirth', 'gender', 'nationality', 'documentType', 'documentNumber', 'placeBirth', 'father', 'mother']
const addressFields = ['holderName', 'zipCode', 'address', 'streetNumber', 'district', 'city', 'state']
const brazilianStates = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']

const documentFields: Record<string, string[]> = {
  DocumentGroom: identityFields,
  DocumentBride: identityFields,
  BirthCertificateGroom: ['name', 'cpf', 'dateBirth', 'gender', 'nationality', 'placeBirth', 'father', 'mother'],
  BirthCertificateBride: ['name', 'cpf', 'dateBirth', 'gender', 'nationality', 'placeBirth', 'father', 'mother'],
  ProofResidenceGroom: addressFields,
  ProofResidenceBride: addressFields,
  MarriageCertificateGroom: ['name', 'dateBirth', 'nationality', 'placeBirth', 'father', 'mother'],
  MarriageCertificateBride: ['name', 'dateBirth', 'nationality', 'placeBirth', 'father', 'mother'],
  DocumentWitness1: identityFields,
  DocumentWitness2: identityFields,
}

const documentContext: Record<string, string> = {
  DocumentGroom: 'Documento de identidade do noivo. Extraia somente dados explicitamente identificados do titular e dos pais do titular.',
  DocumentBride: 'Documento de identidade da noiva. Extraia somente dados explicitamente identificados do titular e dos pais do titular.',
  BirthCertificateGroom: 'Certidão de nascimento do noivo. Extraia os dados do registrado e os nomes dos pais, sem confundir com outros nomes do texto.',
  BirthCertificateBride: 'Certidão de nascimento da noiva. Extraia os dados do registrado e os nomes dos pais, sem confundir com outros nomes do texto.',
  ProofResidenceGroom: 'Comprovante de residência apresentado pelo noivo. O titular pode ser outra pessoa; informe holderName separadamente dos dados de endereço.',
  ProofResidenceBride: 'Comprovante de residência apresentado pela noiva. O titular pode ser outra pessoa; informe holderName separadamente dos dados de endereço.',
  MarriageCertificateGroom: 'Certidão de casamento anterior apresentada pelo noivo. Extraia somente os dados do titular e de seus pais que estejam explícitos.',
  MarriageCertificateBride: 'Certidão de casamento anterior apresentada pela noiva. Extraia somente os dados do titular e de seus pais que estejam explícitos.',
  DocumentWitness1: 'Documento de identidade da primeira testemunha. Extraia somente dados explicitamente identificados do titular.',
  DocumentWitness2: 'Documento de identidade da segunda testemunha. Extraia somente dados explicitamente identificados do titular.',
}

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('pt-BR')
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

function cleanField(item: ExtractedField, allowedFields: string[], ocrText: string): ExtractedField | null {
  if (!allowedFields.includes(item.field) || typeof item.value !== 'string' || typeof item.evidence !== 'string') return null
  let value = item.value.trim().slice(0, 255)
  const evidence = item.evidence.trim().slice(0, 300)
  if (!value || !evidence || !normalize(ocrText).includes(normalize(evidence))) return null
  if (['name', 'father', 'mother', 'placeBirth', 'holderName'].includes(item.field) && !normalize(evidence).includes(normalize(value))) return null
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
    if (!brazilianStates.includes(value)) return null
  }
  if (item.field === 'dateBirth' && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !DateTime.fromISO(value).isValid)) return null
  if (item.field === 'gender' && !['M', 'F', 'MASCULINO', 'FEMININO'].includes(value.toUpperCase())) return null
  if (item.field === 'documentType' && !['RG', 'CPF', 'CNH', 'PASSAPORTE'].includes(value.toUpperCase())) return null
  return { field: item.field, value, evidence }
}

export async function extractMarriageDocument(input: {
  fileBuffer: Buffer
  fileName: string
  documentType: string
  companiesId: number
  userId: number | null
}) {
  const fields = documentFields[input.documentType]
  if (!fields) throw new Error('INVALID_DOCUMENT_TYPE')
  const ocrText = await extractTextFromFileBuffer(input.fileBuffer, input.fileName)
  if (!ocrText.trim()) return { fields: [], message: 'Não foi possível ler o documento. Você pode preencher os dados manualmente.' }

  const text = ocrText.slice(0, 15000)
  const suggestions = await extractAiFields({
    text,
    documentType: input.documentType,
    context: documentContext[input.documentType],
    fields,
    companiesId: input.companiesId,
    userId: input.userId,
    useCase: 'marriage_certificate_attachment',
  })
  const seen = new Set<string>()
  const checked = suggestions
    .map((item) => cleanField(item, fields, text))
    .filter((item): item is ExtractedField => Boolean(item))
    .filter((item) => {
      if (seen.has(item.field)) return false
      seen.add(item.field)
      return true
    })

  return {
    fields: checked,
    message: checked.length ? '' : 'Não encontramos dados legíveis. Você pode preencher os campos manualmente.',
  }
}
