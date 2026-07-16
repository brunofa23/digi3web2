import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import type { TransactionClientContract } from '@ioc:Adonis/Lucid/Database'
import { schema, rules, validator } from '@ioc:Adonis/Core/Validator'
import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'

import BadRequestException from 'App/Exceptions/BadRequestException'
import OrderCertificate from 'App/Models/OrderCertificate'
import Person from 'App/Models/Person'
import MarriedCertificate from 'App/Models/MarriedCertificate'
import PublicOrderCertificateLink from 'App/Models/PublicOrderCertificateLink'
import { uploadImage } from 'App/Services/uploads/uploadImages'

const MARRIAGE_LINK_TYPE = 'marriage'

export default class PublicOrderCertificatesController {
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

  public async showMarriage({ params, response }: HttpContextContract) {
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
    }
  }

  public async storeMarriage({ params, request, response }: HttpContextContract) {
    const link = await this.getActiveMarriageLink(params.token)

    if (!link || !link.company) {
      return response.notFound({ message: 'Formulário público não encontrado ou inativo' })
    }

    const body = request.body()
    const parsedMarriage = this.parseJsonFieldOrFail(response, body.marriedCertificate, 'marriedCertificate')
    if (!parsedMarriage) return

    try {
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

      parsedMarriage.groom = groom
      parsedMarriage.bride = bride

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
