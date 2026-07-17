import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import type { TransactionClientContract } from '@ioc:Adonis/Lucid/Database'
import { schema, rules, validator } from '@ioc:Adonis/Core/Validator'
import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'
import crypto from 'crypto'

import BadRequestException from 'App/Exceptions/BadRequestException'
import OrderCertificate from 'App/Models/OrderCertificate'
import Person from 'App/Models/Person'
import MarriedCertificate from 'App/Models/MarriedCertificate'
import PublicOrderCertificateLink from 'App/Models/PublicOrderCertificateLink'
import { uploadImage } from 'App/Services/uploads/uploadImages'
import { extractTextFromFileBuffer } from 'App/Services/ocr/googleVision'

const MARRIAGE_LINK_TYPE = 'marriage'
const PUBLIC_SUBMIT_RATE_LIMIT_MAX = 5
const PUBLIC_SUBMIT_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const PUBLIC_OCR_RATE_LIMIT_MAX = 20
const PUBLIC_OCR_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const PUBLIC_DUPLICATE_WINDOW_MINUTES = 10
const PUBLIC_CHALLENGE_TTL_MS = 15 * 60 * 1000
const publicSubmitAttempts = new Map<string, number[]>()
const publicOcrAttempts = new Map<string, number[]>()
const publicHumanChallenges = new Map<string, { token: string; ip: string; answer: string; expiresAt: number }>()

export default class PublicOrderCertificatesController {
  private normalizeText(value: string) {
    return String(value || '')
      .replace(/\r/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }

  private onlyDigits(value: any) {
    return String(value || '').replace(/\D/g, '')
  }

  private cleanValue(value: any) {
    return String(value || '')
      .replace(/^[\s:.-]+/, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
  }

  private normalizeName(value: any) {
    const cleaned = this.cleanValue(value)
      .replace(/^(?:\d+[A-Z]?\s*)?(?:NOME\s*\/\s*NAME|NOME\s+E\s+SOBRENOME|NOME\s+CIVIL|NOME\s+COMPLETO|NOME|NAME|FILIA[CÇ][AÃ]O|PAI|M[ÃA]E)\b\s*[:\-]?/i, '')
      .replace(/\b(CPF|RG|REGISTRO|NASCIMENTO|DATA|SEXO|FILIA[CÇ][AÃ]O|VALIDADE)\b.*$/i, '')
      .replace(/[^A-Za-zÀ-ÖØ-öø-ÿ'\s]/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()

    if (cleaned.length < 3) return null

    const normalized = cleaned.toUpperCase()
    const ignoredCandidate = /(ATUALIZADO|VERIFIQUE|AUTENTICIDADE|QR\s*CODE|APP\s*VIO|HABILITA[CÇ][AÃ]O|CARTEIRA\s+NACIONAL|REP[ÚU]BLICA|MINIST[ÉE]RIO|SECRETARIA|V[ÁA]LIDA|TERRIT[ÓO]RIO|ASSINATURA|PORTADOR|HIST[ÓO]RICO|EMISS[ÕO]ES)/i

    if (ignoredCandidate.test(normalized)) return null
    if (/^(?:E\s+)?SOBRENOME$|^(?:E\s+)?NOME\s+E\s+SOBRENOME$|^NAME$|^NOME$/i.test(normalized)) return null
    if (normalized.split(/\s+/).length < 2) return null

    return normalized
  }

  private getLines(text: string) {
    return this.normalizeText(text)
      .split('\n')
      .map((line) => this.cleanValue(line))
      .filter(Boolean)
  }

  private extractByLineLabel(lines: string[], labels: RegExp[]) {
    for (let index = 0; index < lines.length; index++) {
      const line = lines[index]

      for (const label of labels) {
        if (!label.test(line)) continue

        const sameLine = this.cleanValue(line.replace(label, ''))
        if (sameLine) return sameLine

        for (let nextIndex = index + 1; nextIndex < Math.min(lines.length, index + 4); nextIndex++) {
          const nextLine = this.cleanValue(lines[nextIndex])
          if (nextLine && !labels.some((item) => item.test(nextLine))) return nextLine
        }
      }
    }

    return null
  }

  private formatDateToIso(value: any) {
    const raw = String(value || '').trim()
    const match = raw.match(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})\b/)
    if (!match) return null
    return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`
  }

  private extractCpf(text: string) {
    const match = text.match(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/)
    return match ? this.onlyDigits(match[0]) : null
  }

  private extractDateBirth(lines: string[], text: string) {
    const labeled = this.extractByLineLabel(lines, [
      /(?:DATA\s+DE\s+NASCIMENTO|NASCIMENTO|DATA\s+NASC\.?|DT\.?\s*NASC\.?)/i,
    ])
    const labeledDate = this.formatDateToIso(labeled)
    if (labeledDate) return labeledDate

    const match = text.match(/\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{4}\b/)
    return match ? this.formatDateToIso(match[0]) : null
  }

  private extractGender(lines: string[]) {
    const labeled = this.extractByLineLabel(lines, [/(?:SEXO|G[ÊE]NERO)/i])
    const value = String(labeled || '').toUpperCase()

    if (/\b(M|MASC|MASCULINO)\b/.test(value)) return 'M'
    if (/\b(F|FEM|FEMININO)\b/.test(value)) return 'F'

    return null
  }

  private extractParents(lines: string[]) {
    let father: string | null = this.normalizeName(this.extractByLineLabel(lines, [/\bPAI\b/i]))
    let mother: string | null = this.normalizeName(this.extractByLineLabel(lines, [/\bM[ÃA]E\b/i]))

    const filiationIndex = lines.findIndex((line) => /FILIA[CÇ][AÃ]O/i.test(line))
    if (filiationIndex >= 0) {
      const stopLabels = /(NATURALIDADE|DATA|DOC\.?\s*ORIGEM|CPF|PIS|ASSINATURA|LEI|REGISTRO|VALIDADE|EXPEDI[CÇ][AÃ]O|NACIONALIDADE)/i
      const sameLine = this.normalizeName(lines[filiationIndex].replace(/.*FILIA[CÇ][AÃ]O\s*[:\-]?/i, ''))
      const candidates: string[] = []

      if (sameLine) candidates.push(sameLine)

      for (const line of lines.slice(filiationIndex + 1, filiationIndex + 7)) {
        if (stopLabels.test(line)) break

        const name = this.normalizeName(line)
        if (name) candidates.push(name)
      }

      if (!father && candidates[0]) father = candidates[0]
      if (!mother && candidates[1]) mother = candidates[1]
    }

    return { father, mother }
  }

  private extractDocumentNumber(lines: string[], text: string) {
    const labeled = this.extractByLineLabel(lines, [
      /\b(?:RG|REGISTRO\s+GERAL|DOC\.?\s*IDENTIDADE|DOC(?:UMENTO)?\.?\s+DE\s+IDENTIDADE|IDENTIDADE)\b/i,
    ])
    const cleaned = this.cleanValue(labeled)

    if (cleaned && /\d/.test(cleaned)) {
      const identityMatch = cleaned.match(/\b[A-Z]{1,3}[-\s]?\d[\d.]{4,}[-\w]?\b/i)
      if (identityMatch) return identityMatch[0].replace(/\s/g, '')

      const cpfMatch = cleaned.match(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/)
      if (cpfMatch) return this.onlyDigits(cpfMatch[0])

      const numericMatch = cleaned.match(/\b\d{1,2}\.?\d{3}\.?\d{3}[-\w]?\b/)
      if (numericMatch) return numericMatch[0]
    }

    const rgMatch = text.match(/\b(?:[A-Z]{1,3}[-\s]?)?\d{1,2}\.?\d{3}\.?\d{3}[-\w]?\b/)
    return rgMatch ? rgMatch[0] : null
  }

  private extractCnhDocumentNumber(lines: string[], text: string) {
    const docIdentityIndex = lines.findIndex((line) =>
      /DOC\.?\s*IDENTIDADE|DOC(?:UMENTO)?\.?\s+DE\s+IDENTIDADE/i.test(line)
    )

    if (docIdentityIndex >= 0) {
      for (const line of lines.slice(docIdentityIndex, Math.min(lines.length, docIdentityIndex + 4))) {
        const identityMatch = line.match(/\b[A-Z]{1,3}[-\s]?\d[\d.]{4,}[-\w]?\b/i)
        if (identityMatch) return identityMatch[0].replace(/\s/g, '')
      }
    }

    return this.extractDocumentNumber(lines, text)
  }

  private extractNameByExactLabel(lines: string[]) {
    const nameLabel = /(?:^|\b)(?:\d+[A-Z]?\s*)?(?:NOME\s*\/\s*NAME|NOME\s+E\s+SOBRENOME|NOME\s+CIVIL|NOME\s+COMPLETO|NAME|NOME(?!\s+E\s+SOBRENOME))\s*[:\-]?\s*(.+)$/i
    const isolatedNameLabel = /^\s*(?:\d+[A-Z]?\s*)?(?:NOME\s*\/\s*NAME|NOME\s+E\s+SOBRENOME|NOME\s+CIVIL|NOME\s+COMPLETO|NOME|NAME)\s*$/i
    const stopLabels = /(CPF|REGISTRO|DATA|NASCIMENTO|NACIONALIDADE|NATURALIDADE|FILIA[CÇ][AÃ]O|DOC\.?|VALIDADE|EXPEDI[CÇ][AÃ]O|ASSINATURA|CARTEIRA|REP[ÚU]BLICA)/i

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index]
      const sameLine = line.match(nameLabel)
      const sameLineName = this.normalizeName(sameLine?.[1])

      if (sameLineName) return sameLineName
      if (!isolatedNameLabel.test(line)) continue

      for (let nextIndex = index + 1; nextIndex < Math.min(lines.length, index + 4); nextIndex++) {
        if (stopLabels.test(lines[nextIndex])) break

        const nextLineName = this.normalizeName(lines[nextIndex])
        if (nextLineName) return nextLineName
      }
    }

    return null
  }

  private extractCnhName(lines: string[]) {
    const nameLabelIndex = lines.findIndex((line) => /\bNOME\s+E\s+SOBRENOME\b/i.test(line))
    if (nameLabelIndex < 0) return null

    const stopLabels = /(CPF|DATA|NASCIMENTO|VALIDADE|DOC\.?|IDENTIDADE|REGISTRO|FILIA[CÇ][AÃ]O|NACIONALIDADE|CAT\.?\s*HAB|ACC|LOCAL|EMISS[ÃA]O)/i

    for (let nextIndex = nameLabelIndex + 1; nextIndex < Math.min(lines.length, nameLabelIndex + 6); nextIndex++) {
      if (stopLabels.test(lines[nextIndex])) break

      const nextLineName = this.normalizeName(lines[nextIndex])
      if (nextLineName) return nextLineName
    }

    return null
  }

  private isCnhDocument(text: string, documentKind: string) {
    if (documentKind !== 'identity_document') return null

    return /HABILITA[CÇ][AÃ]O|DRIVER\s*LICENSE|PERMISO\s+DE\s+CONDUCCI[ÓO]N|CARTEIRA\s+NACIONAL/i.test(text)
  }

  private resolveDocumentType(_text: string, documentKind: string) {
    if (documentKind !== 'identity_document') return null

    return 'RG'
  }

  private extractName(lines: string[]) {
    const name = this.extractNameByExactLabel(lines)
    if (name) return name

    const ignored = /(ATUALIZADO|VERIFIQUE|AUTENTICIDADE|QR\s*CODE|APP\s*VIO|REP[ÚU]BLICA|CARTEIRA|IDENTIDADE|HABILITA[CÇ][AÃ]O|CPF|REGISTRO|NASCIMENTO|VALIDADE|FILIA[CÇ][AÃ]O)/i
    return lines.map((line) => this.normalizeName(line)).find((line) => line && !ignored.test(line)) || null
  }

  private extractNationality(lines: string[]) {
    const labeled = this.extractByLineLabel(lines, [/\bNACIONALIDADE\b/i])
    const normalized = this.normalizeName(labeled)

    if (normalized) return normalized

    const nationalityIndex = lines.findIndex((line) => /\bNACIONALIDADE\b/i.test(line))
    if (nationalityIndex < 0) return null

    for (const line of lines.slice(nationalityIndex + 1, nationalityIndex + 4)) {
      const nationality = this.normalizeName(line)
      if (nationality) return nationality
    }

    return null
  }

  private extractAddress(lines: string[], text: string) {
    const zipMatch = text.match(/\b\d{5}-?\d{3}\b/)
    const zipCode = zipMatch ? this.onlyDigits(zipMatch[0]) : null
    const address = this.extractByLineLabel(lines, [
      /\b(?:ENDERE[CÇ]O|LOGRADOURO|RUA|AVENIDA|AV\.?)\b/i,
    ])
    const district = this.extractByLineLabel(lines, [/\b(?:BAIRRO)\b/i])
    const cityState = this.extractByLineLabel(lines, [/\b(?:CIDADE|MUNIC[IÍ]PIO)\b/i])
    const stateMatch = text.match(/\b(?:UF|ESTADO)\s*:?\s*([A-Z]{2})\b/i)

    return {
      zipCode,
      address: address ? this.cleanValue(address) : null,
      district: district ? this.cleanValue(district) : null,
      city: cityState ? this.cleanValue(cityState).replace(/\s*[-/]\s*[A-Z]{2}$/i, '') : null,
      state: stateMatch ? stateMatch[1].toUpperCase() : null,
    }
  }

  private resolveTarget(description: string | null) {
    const key = String(description || '').toLowerCase()

    if (key.includes('groom')) return 'groom'
    if (key.includes('bride')) return 'bride'
    if (key.includes('witness1')) return 'witness1'
    if (key.includes('witness2')) return 'witness2'

    return null
  }

  private resolveDocumentKind(description: string | null) {
    const key = String(description || '').toLowerCase()

    if (key.includes('proofresidence')) return 'proof_residence'
    if (key.includes('birthcertificate')) return 'birth_certificate'
    if (key.includes('marriagecertificate')) return 'marriage_certificate'
    if (key.includes('document')) return 'identity_document'

    return 'unknown'
  }

  private extractCertificateImageData(text: string, description: string | null) {
    const normalizedText = this.normalizeText(text)
    const lines = this.getLines(normalizedText)
    const documentKind = this.resolveDocumentKind(description)
    const targetPerson = this.resolveTarget(description)
    const { father, mother } = this.extractParents(lines)
    const address = this.extractAddress(lines, normalizedText)
    const isCnh = this.isCnhDocument(normalizedText, documentKind)
    const documentType = this.resolveDocumentType(normalizedText, documentKind)

    return {
      targetPerson,
      documentKind,
      person: {
        cpf: this.extractCpf(normalizedText),
        name: isCnh ? this.extractCnhName(lines) || this.extractName(lines) : this.extractName(lines),
        dateBirth: this.extractDateBirth(lines, normalizedText),
        gender: this.extractGender(lines),
        nationality: this.extractNationality(lines),
        father,
        mother,
        documentType,
        documentNumber: isCnh
          ? this.extractCnhDocumentNumber(lines, normalizedText)
          : this.extractDocumentNumber(lines, normalizedText),
        ...address,
      },
    }
  }

  private async assertSuperuser(auth: HttpContextContract['auth'], response: HttpContextContract['response']) {
    const authenticate = await auth.use('api').authenticate()

    if (!authenticate.superuser) {
      response.forbidden({ message: 'Acesso permitido apenas para superusuário' })
      return null
    }

    return authenticate
  }

  private serializeManageLink(link: PublicOrderCertificateLink) {
    return {
      id: link.id,
      companiesId: link.companiesId,
      type: link.type,
      token: link.token,
      active: Boolean(link.active),
      createdAt: link.createdAt,
      updatedAt: link.updatedAt,
    }
  }

  private async getOrCreateMarriageLink(companiesId: number) {
    let link = await PublicOrderCertificateLink.query()
      .where('companies_id', companiesId)
      .where('type', MARRIAGE_LINK_TYPE)
      .first()

    if (!link) {
      link = await PublicOrderCertificateLink.create({
        companiesId,
        type: MARRIAGE_LINK_TYPE,
        token: crypto.randomBytes(32).toString('hex'),
        active: true,
      })
    }

    return link
  }

  private toNumber(v: any): number | null {
    if (v === null || v === undefined || v === '') return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }

  private parseJsonFieldOrFail(
    response: HttpContextContract['response'],
    raw: any,
    fieldName: string
  ): any | null {
    if (raw === null || raw === undefined || raw === '') return null
    if (typeof raw === 'object') return raw

    if (typeof raw === 'string') {
      const trimmed = raw.trim()

      if (trimmed === '[object Object]') {
        response.badRequest({
          message: `${fieldName} inválido: veio como "[object Object]". Envie JSON.stringify(${fieldName}).`,
        })
        return null
      }

      try {
        return JSON.parse(trimmed)
      } catch {
        response.badRequest({ message: `${fieldName} inválido (JSON malformado)` })
        return null
      }
    }

    response.badRequest({ message: `${fieldName} inválido: tipo inesperado` })
    return null
  }

  private normalizeCpf(value: any): string | null {
    const cpf = String(value ?? '').replace(/\D/g, '').trim()
    return cpf === '' ? null : cpf
  }

  private isValidCpf(value: any): boolean {
    const cpf = this.normalizeCpf(value)
    if (!cpf || cpf.length !== 11) return false
    if (/^(\d)\1{10}$/.test(cpf)) return false

    let sum = 0
    for (let i = 0; i < 9; i += 1) {
      sum += Number(cpf[i]) * (10 - i)
    }

    let firstCheck = (sum * 10) % 11
    if (firstCheck === 10 || firstCheck === 11) firstCheck = 0
    if (firstCheck !== Number(cpf[9])) return false

    sum = 0
    for (let i = 0; i < 10; i += 1) {
      sum += Number(cpf[i]) * (11 - i)
    }

    let secondCheck = (sum * 10) % 11
    if (secondCheck === 10 || secondCheck === 11) secondCheck = 0

    return secondCheck === Number(cpf[10])
  }

  private isTruthy(value: any): boolean {
    if (value === true || value === 1) return true

    const normalized = String(value ?? '').trim().toLowerCase()
    return ['true', '1', 'yes', 'sim'].includes(normalized)
  }

  private getPublicRequestIp(request: HttpContextContract['request']): string {
    return request.header('x-forwarded-for')?.split(',')?.[0]?.trim() || request.ip()
  }

  private cleanupPublicHumanChallenges(now = Date.now()) {
    for (const [challengeId, challenge] of publicHumanChallenges.entries()) {
      if (challenge.expiresAt <= now) publicHumanChallenges.delete(challengeId)
    }
  }

  private createPublicHumanChallenge(token: string, ip: string) {
    const now = Date.now()
    this.cleanupPublicHumanChallenges(now)

    const options = [
      { value: 'lock', label: 'cadeado', icon: 'mdi-lock-outline' },
      { value: 'house', label: 'casa', icon: 'mdi-home-outline' },
      { value: 'heart', label: 'coração', icon: 'mdi-heart-outline' },
      { value: 'star', label: 'estrela', icon: 'mdi-star-outline' },
      { value: 'key', label: 'chave', icon: 'mdi-key-outline' },
      { value: 'flag', label: 'bandeira', icon: 'mdi-flag-outline' },
    ]

    const target = options[crypto.randomInt(options.length)]
    const challengeId = crypto.randomBytes(16).toString('hex')
    const shuffledOptions = [...options].sort(() => crypto.randomInt(3) - 1)

    publicHumanChallenges.set(challengeId, {
      token,
      ip,
      answer: target.value,
      expiresAt: now + PUBLIC_CHALLENGE_TTL_MS,
    })

    return {
      id: challengeId,
      question: `Clique na imagem do ${target.label}`,
      options: shuffledOptions,
    }
  }

  private assertPublicHumanChallenge(token: string, ip: string, body: any) {
    if (String(body.publicWebsite || '').trim()) {
      throw new BadRequestException('Não foi possível validar o envio. Atualize a página e tente novamente.', 422)
    }

    const challengeId = String(body.publicChallengeId || '').trim()
    const answer = String(body.publicChallengeAnswer || '').trim()
    const challenge = challengeId ? publicHumanChallenges.get(challengeId) : null

    if (
      !challenge ||
      challenge.token !== token ||
      challenge.ip !== ip ||
      challenge.expiresAt <= Date.now() ||
      challenge.answer !== answer
    ) {
      throw new BadRequestException('Confirme que você não é um robô antes de enviar a solicitação.', 422)
    }

    publicHumanChallenges.delete(challengeId)
  }

  private assertPublicSubmitRateLimit(token: string, ip: string) {
    const now = Date.now()
    const windowStart = now - PUBLIC_SUBMIT_RATE_LIMIT_WINDOW_MS
    const key = `${token}:${ip}`
    const recentAttempts = (publicSubmitAttempts.get(key) || []).filter((attemptAt) => attemptAt > windowStart)

    if (recentAttempts.length >= PUBLIC_SUBMIT_RATE_LIMIT_MAX) {
      throw new BadRequestException(
        'Muitas tentativas em pouco tempo. Aguarde alguns minutos antes de tentar novamente.',
        429
      )
    }

    recentAttempts.push(now)
    publicSubmitAttempts.set(key, recentAttempts)

    if (publicSubmitAttempts.size > 1000) {
      for (const [attemptKey, attempts] of publicSubmitAttempts.entries()) {
        const activeAttempts = attempts.filter((attemptAt) => attemptAt > windowStart)
        if (activeAttempts.length) {
          publicSubmitAttempts.set(attemptKey, activeAttempts)
        } else {
          publicSubmitAttempts.delete(attemptKey)
        }
      }
    }
  }

  private assertPublicOcrRateLimit(token: string, ip: string) {
    const now = Date.now()
    const windowStart = now - PUBLIC_OCR_RATE_LIMIT_WINDOW_MS
    const key = `${token}:${ip}`
    const recentAttempts = (publicOcrAttempts.get(key) || []).filter((attemptAt) => attemptAt > windowStart)

    if (recentAttempts.length >= PUBLIC_OCR_RATE_LIMIT_MAX) {
      throw new BadRequestException(
        'Muitas tentativas de leitura de documentos em pouco tempo. Aguarde alguns minutos antes de tentar novamente.',
        429
      )
    }

    recentAttempts.push(now)
    publicOcrAttempts.set(key, recentAttempts)

    if (publicOcrAttempts.size > 1000) {
      for (const [attemptKey, attempts] of publicOcrAttempts.entries()) {
        const activeAttempts = attempts.filter((attemptAt) => attemptAt > windowStart)
        if (activeAttempts.length) {
          publicOcrAttempts.set(attemptKey, activeAttempts)
        } else {
          publicOcrAttempts.delete(attemptKey)
        }
      }
    }
  }

  private async assertNoRecentDuplicateMarriageSubmission(
    linkId: number,
    groomCpf: string,
    brideCpf: string
  ) {
    const since = DateTime.now()
      .minus({ minutes: PUBLIC_DUPLICATE_WINDOW_MINUTES })
      .toFormat('yyyy-MM-dd HH:mm:ss')

    const duplicate = await Database
      .from('order_certificates as oc')
      .join('married_certificates as mc', 'mc.id', 'oc.certificate_id')
      .join('people as groom', 'groom.id', 'mc.groom_person_id')
      .join('people as bride', 'bride.id', 'mc.bride_person_id')
      .where('oc.origin', 'public')
      .where('oc.public_order_certificate_link_id', linkId)
      .where('oc.book_id', 2)
      .where('oc.type_certificate', 2)
      .where('oc.created_at', '>=', since)
      .where('groom.cpf', groomCpf)
      .where('bride.cpf', brideCpf)
      .first()

    if (duplicate) {
      throw new BadRequestException(
        'Já existe uma solicitação recente para esses contraentes. Aguarde alguns minutos antes de enviar novamente.',
        409
      )
    }
  }

  private hasAnyPersonData(personData: any | null | undefined) {
    if (!personData) return false

    return [
      'name',
      'cpf',
      'dateBirth',
      'gender',
      'zipCode',
      'address',
      'documentNumber',
      'phone',
      'cellphone',
      'email',
      'mother',
      'father',
    ].some((field) => String(personData?.[field] ?? '').trim() !== '')
  }

  private buildPersonCreatePayload(personData: any, companiesId: number) {
    return {
      companiesId,
      name: personData.name ?? '',
      nameMarried: personData.nameMarried ?? '',
      cpf: this.normalizeCpf(personData.cpf),
      gender: personData.gender ?? '',
      deceased: personData.deceased ?? false,
      dateBirth: personData.dateBirth ? DateTime.fromISO(String(personData.dateBirth)) : null,
      maritalStatus: personData.maritalStatus ?? '',
      illiterate: personData.illiterate ?? false,
      placeBirth: personData.placeBirth ?? '',
      nationality: personData.nationality ?? '',
      occupationId: personData.occupationId ?? null,
      zipCode: personData.zipCode ?? '',
      address: personData.address ?? '',
      streetNumber: personData.streetNumber ?? '',
      streetComplement: personData.streetComplement ?? '',
      district: personData.district ?? '',
      city: personData.city ?? '',
      state: personData.state ?? '',
      documentType: personData.documentType ?? '',
      documentNumber: personData.documentNumber ?? '',
      phone: personData.phone ?? '',
      cellphone: personData.cellphone ?? '',
      email: personData.email ?? '',
      mother: personData.mother ?? '',
      father: personData.father ?? '',
      inactive: personData.inactive ?? false,
    }
  }

  private buildPersonUpdatePatch(personData: any) {
    const patch: any = {}

    const assignText = (field: string, value: any) => {
      if (String(value ?? '').trim() !== '') patch[field] = value
    }

    assignText('name', personData.name)
    assignText('nameMarried', personData.nameMarried)
    assignText('cpf', this.normalizeCpf(personData.cpf))
    assignText('gender', personData.gender)
    assignText('maritalStatus', personData.maritalStatus)
    assignText('placeBirth', personData.placeBirth)
    assignText('nationality', personData.nationality)
    assignText('zipCode', personData.zipCode)
    assignText('address', personData.address)
    assignText('streetNumber', personData.streetNumber)
    assignText('streetComplement', personData.streetComplement)
    assignText('district', personData.district)
    assignText('city', personData.city)
    assignText('state', personData.state)
    assignText('documentType', personData.documentType)
    assignText('documentNumber', personData.documentNumber)
    assignText('phone', personData.phone)
    assignText('cellphone', personData.cellphone)
    assignText('email', personData.email)
    assignText('mother', personData.mother)
    assignText('father', personData.father)

    if (personData.dateBirth) {
      patch.dateBirth = DateTime.fromISO(String(personData.dateBirth))
    }

    if (personData.occupationId !== null && personData.occupationId !== undefined && personData.occupationId !== '') {
      patch.occupationId = personData.occupationId
    }

    if (typeof personData.deceased === 'boolean') patch.deceased = personData.deceased
    if (typeof personData.illiterate === 'boolean') patch.illiterate = personData.illiterate
    if (typeof personData.inactive === 'boolean') patch.inactive = personData.inactive

    return patch
  }

  private async resolvePersonByCpf(
    personData: any,
    companiesId: number,
    trx: TransactionClientContract
  ): Promise<Person | null> {
    if (!this.hasAnyPersonData(personData)) return null

    const cpf = this.normalizeCpf(personData?.cpf)
    let person: Person | null = null

    if (cpf) {
      const matches = await Person.query({ client: trx })
        .where('companies_id', companiesId)
        .where('cpf', cpf)
        .where((q) => {
          q.where('inactive', false).orWhereNull('inactive')
        })

      if (matches.length > 1) {
        throw new BadRequestException(
          'Existe mais de uma pessoa ativa cadastrada com o mesmo CPF. Procure o cartório para concluir a solicitação.',
          409
        )
      }

      person = matches[0] ?? null
    }

    if (!person) {
      person = new Person()
      person.useTransaction(trx)
      person.merge(this.buildPersonCreatePayload(personData, companiesId))
      await person.save()
      return person
    }

    person.useTransaction(trx)
    person.merge(this.buildPersonUpdatePatch(personData))
    await person.save()
    return person
  }

  private async saveMarriagePublic(
    marriedData: any,
    companiesId: number,
    trx: TransactionClientContract
  ): Promise<number> {
    const groom = await this.resolvePersonByCpf(marriedData.groom, companiesId, trx)
    if (!groom) throw new BadRequestException('Primeiro contraente é obrigatório', 400)

    const fatherGroom = await this.resolvePersonByCpf(marriedData.fatherGroom, companiesId, trx)
    const motherGroom = await this.resolvePersonByCpf(marriedData.motherGroom, companiesId, trx)

    const bride = await this.resolvePersonByCpf(marriedData.bride, companiesId, trx)
    if (!bride) throw new BadRequestException('Segundo contraente é obrigatório', 400)

    const fatherBride = await this.resolvePersonByCpf(marriedData.fatherBride, companiesId, trx)
    const motherBride = await this.resolvePersonByCpf(marriedData.motherBride, companiesId, trx)

    const witness1 = await this.resolvePersonByCpf(marriedData.witness1, companiesId, trx)
    const witness2 = await this.resolvePersonByCpf(marriedData.witness2, companiesId, trx)

    const marriedCertificate = new MarriedCertificate()
    marriedCertificate.useTransaction(trx)
    marriedCertificate.merge({
      companiesId,
      usrId: null,

      groomPersonId: groom.id,
      fatherGroomPersonId: fatherGroom?.id ?? null,
      motherGroomPersonId: motherGroom?.id ?? null,

      bridePersonId: bride.id,
      fahterBridePersonId: fatherBride?.id ?? null,
      motherBridePersonId: motherBride?.id ?? null,

      witnessPersonId: witness1?.id ?? null,
      witness2PersonId: witness2?.id ?? null,

      statusId: marriedData.statusId ?? null,
      dthrSchedule:
        marriedData.dthrSchedule && String(marriedData.dthrSchedule).trim() !== ''
          ? DateTime.fromISO(marriedData.dthrSchedule, { zone: 'America/Sao_Paulo' })
          : null,
      dthrMarriage: marriedData.dthrMarriage ? DateTime.fromISO(marriedData.dthrMarriage) : null,

      type: marriedData.type ?? '',
      obs: marriedData.obs ?? '',
      churchName: marriedData.churchName ?? '',
      churchCity: marriedData.churchCity ?? '',
      maritalRegime: marriedData.maritalRegime ?? '',
      prenup: marriedData.prenup ?? false,
      registryOfficePrenup: marriedData.registryOfficePrenup ?? '',
      addresRegistryOfficePrenup: marriedData.addresRegistryOfficePrenup ?? '',
      bookRegistryOfficePrenup: marriedData.bookRegistryOfficePrenup ?? null,
      sheetRegistryOfficePrenup: marriedData.sheetRegistryOfficePrenup ?? null,
      dthrPrenup: marriedData.dthrPrenup ?? null,
      documentScheduleDate: marriedData.documentScheduleDate ?? null,
      cerimonyLocation: marriedData.cerimonyLocation ?? '',
      otherCerimonyLocation: marriedData.otherCerimonyLocation ?? '',
      nameFormerSpouse: marriedData.nameFormerSpouse ?? '',
      dthrDivorceSpouse: marriedData.dthrDivorceSpouse ?? null,
      nameFormerSpouse2: marriedData.nameFormerSpouse2 ?? '',
      dthrDivorceSpouse2: marriedData.dthrDivorceSpouse2 ?? null,
      inactive: false,
      statusForm: marriedData.statusForm ?? 'finish',
    })

    await marriedCertificate.save()
    return marriedCertificate.id
  }

  private async getActiveMarriageLink(token: string) {
    return await PublicOrderCertificateLink.query()
      .where('token', token)
      .where('type', MARRIAGE_LINK_TYPE)
      .where('active', true)
      .preload('company')
      .first()
  }

  public async showMarriage({ params, request, response }: HttpContextContract) {
    const link = await this.getActiveMarriageLink(params.token)

    if (!link || !link.company) {
      return response.notFound({ message: 'Formulário público não encontrado ou inativo' })
    }

    return {
      type: MARRIAGE_LINK_TYPE,
      active: true,
      company: {
        name: link.company.name,
        shortname: link.company.shortname,
        city: link.company.city,
        state: link.company.state,
      },
      humanChallenge: this.createPublicHumanChallenge(params.token, this.getPublicRequestIp(request)),
    }
  }

  public async manageMarriageLink({ auth, response }: HttpContextContract) {
    const authenticate = await this.assertSuperuser(auth, response)
    if (!authenticate) return

    const link = await this.getOrCreateMarriageLink(authenticate.companies_id)
    return response.status(200).send(this.serializeManageLink(link))
  }

  public async toggleMarriageLink({ auth, request, response }: HttpContextContract) {
    const authenticate = await this.assertSuperuser(auth, response)
    if (!authenticate) return

    const payload = await request.validate({
      schema: schema.create({
        active: schema.boolean(),
      }),
    })

    const link = await this.getOrCreateMarriageLink(authenticate.companies_id)
    link.active = payload.active
    await link.save()

    return response.status(200).send(this.serializeManageLink(link))
  }

  public async visionOcrMarriageDocument({ params, request, response }: HttpContextContract) {
    const link = await this.getActiveMarriageLink(params.token)

    if (!link || !link.company) {
      return response.notFound({ message: 'Formulário público não encontrado ou inativo' })
    }

    try {
      const requestIp = this.getPublicRequestIp(request)
      this.assertPublicOcrRateLimit(params.token, requestIp)

      const description = String(request.input('description') || '')
      const file = request.file('file', {
        size: '8mb',
        extnames: ['jpg', 'png', 'jpeg', 'bmp', 'gif', 'tif', 'tiff', 'webp', 'pdf', 'JPG', 'PNG', 'JPEG', 'BMP', 'GIF', 'TIF', 'TIFF', 'WEBP', 'PDF'],
      })

      if (!file || !file.tmpPath) {
        throw new BadRequestException('Arquivo inválido ou não enviado', 422)
      }

      const fs = await import('fs/promises')
      const imageBuffer = await fs.readFile(file.tmpPath)
      const ocrFileName = file.clientName || file.extname || ''
      const indexText = await extractTextFromFileBuffer(imageBuffer, ocrFileName)

      if (/(\.pdf|^pdf)$/i.test(String(ocrFileName || '')) && !String(indexText || '').trim()) {
        throw new BadRequestException('PDF sem texto pesquisável disponível para extração', 422)
      }

      const extractedData = this.extractCertificateImageData(indexText, description)

      return response.ok({
        indexText,
        index_text: indexText,
        extractedData,
        extracted_data: extractedData,
      })
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        return response.status(error.status).send({ message: error.message })
      }

      console.error('ERRO PUBLIC MARRIAGE OCR:', error)
      return response.internalServerError({ message: 'Erro ao ler os dados do documento anexado' })
    }
  }

  public async storeMarriage({ params, request, response }: HttpContextContract) {
    const link = await this.getActiveMarriageLink(params.token)

    if (!link || !link.company) {
      return response.notFound({ message: 'Formulário público não encontrado ou inativo' })
    }

    try {
      const requestIp = this.getPublicRequestIp(request)
      this.assertPublicSubmitRateLimit(params.token, requestIp)

      const body = request.body()
      this.assertPublicHumanChallenge(params.token, requestIp, body)

      const parsedMarriage = this.parseJsonFieldOrFail(response, body.marriedCertificate, 'marriedCertificate')
      if (!parsedMarriage) return

      if (!this.isTruthy(body.lgpdConsentAccepted)) {
        throw new BadRequestException(
          'É necessário aceitar o uso dos dados pessoais e documentos para enviar a solicitação.',
          422
        )
      }

      const groom = {
        ...parsedMarriage?.groom,
        cpf: this.normalizeCpf(parsedMarriage?.groom?.cpf),
      }
      const bride = {
        ...parsedMarriage?.bride,
        cpf: this.normalizeCpf(parsedMarriage?.bride?.cpf),
      }

      await validator.validate({
        schema: schema.create({
          groom: schema.object().members({
            name: schema.string({ trim: true }),
            cpf: schema.string({ trim: true }, [rules.regex(/^\d{11}$/)]),
            dateBirth: schema.date({ format: 'yyyy-MM-dd' }),
            gender: schema.enum(['M', 'F'] as const),
          }),
          bride: schema.object().members({
            name: schema.string({ trim: true }),
            cpf: schema.string({ trim: true }, [rules.regex(/^\d{11}$/)]),
            dateBirth: schema.date({ format: 'yyyy-MM-dd' }),
            gender: schema.enum(['M', 'F'] as const),
          }),
        }),
        data: { groom, bride },
        messages: {
          'groom.name.required': 'Nome do primeiro contraente é obrigatório',
          'groom.cpf.required': 'CPF do primeiro contraente é obrigatório',
          'groom.cpf.regex': 'CPF do primeiro contraente inválido',
          'groom.dateBirth.required': 'Data de nascimento do primeiro contraente é obrigatória',
          'groom.gender.required': 'Sexo do primeiro contraente é obrigatório',
          'bride.name.required': 'Nome do segundo contraente é obrigatório',
          'bride.cpf.required': 'CPF do segundo contraente é obrigatório',
          'bride.cpf.regex': 'CPF do segundo contraente inválido',
          'bride.dateBirth.required': 'Data de nascimento do segundo contraente é obrigatória',
          'bride.gender.required': 'Sexo do segundo contraente é obrigatório',
        },
      })

      if (!this.isValidCpf(groom.cpf)) {
        throw new BadRequestException('CPF do primeiro contraente inválido', 422)
      }

      if (!this.isValidCpf(bride.cpf)) {
        throw new BadRequestException('CPF do segundo contraente inválido', 422)
      }

      await this.assertNoRecentDuplicateMarriageSubmission(link.id, groom.cpf, bride.cpf)

      parsedMarriage.groom = groom
      parsedMarriage.bride = bride

      const requestUserAgent = String(request.header('user-agent') ?? '').slice(0, 500) || null

      const orderCertificate = await Database.transaction(async (trx) => {
        const marriedCertificateId = await this.saveMarriagePublic(
          parsedMarriage,
          link.companiesId,
          trx
        )

        const oc = new OrderCertificate()
        oc.useTransaction(trx)
        oc.merge({
          certificateId: marriedCertificateId,
          bookId: 2,
          companiesId: link.companiesId,
          typeCertificate: 2,
          origin: 'public',
          publicOrderCertificateLinkId: link.id,
          lgpdConsentAccepted: true,
          lgpdConsentAcceptedAt: DateTime.now(),
          publicRequestIp: requestIp,
          publicRequestUserAgent: requestUserAgent,
        })
        await oc.save()

        return oc
      })

      const fileFields: { field: string; description: string }[] = [
        { field: 'DocumentGroom', description: 'DocNoivo' },
        { field: 'DocumentBride', description: 'DocNoiva' },
        { field: 'BirthCertificateGroom', description: 'CertidaoNoivo' },
        { field: 'BirthCertificateBride', description: 'CertidaoNoiva' },
        { field: 'ProofResidenceGroom', description: 'ResidenciaNoivo' },
        { field: 'ProofResidenceBride', description: 'ResidenciaNoiva' },
        { field: 'MarriageCertificateGroom', description: 'CertidaoCasamentoNoivo' },
        { field: 'MarriageCertificateBride', description: 'CertidaoCasamentoNoiva' },
        { field: 'DocumentWitness1', description: 'DocTestemunha1' },
        { field: 'DocumentWitness2', description: 'DocTestemunha2' },
      ]

      const fileOptions = {
        size: '8mb',
        extnames: ['jpg', 'png', 'jpeg', 'pdf', 'JPG', 'PNG', 'JPEG', 'PDF'],
      } as const

      for (const cfg of fileFields) {
        const file = request.file(cfg.field, fileOptions)
        if (!file) continue

        await uploadImage({
          companiesId: link.companiesId,
          marriedCertificateId: orderCertificate.certificateId,
          file,
          description: cfg.description,
        })
      }

      return response.created({
        id: orderCertificate.id,
        message: 'Solicitação enviada com sucesso',
      })
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        return response.status(error.status).send({ message: error.message })
      }

      if (error.code === 'E_VALIDATION_FAILURE') {
        return response.status(422).send({ errors: error.messages.errors })
      }

      console.error('ERRO PUBLIC MARRIAGE STORE:', error)
      return response.internalServerError({ message: 'Erro ao enviar solicitação pública de casamento' })
    }
  }
}
