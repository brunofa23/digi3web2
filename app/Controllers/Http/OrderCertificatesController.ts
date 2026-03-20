import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import type { TransactionClientContract } from '@ioc:Adonis/Lucid/Database'
import { schema, rules, validator } from '@ioc:Adonis/Core/Validator'
import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'

import OrderCertificate from 'App/Models/OrderCertificate'
import Person from 'App/Models/Person'
import MarriedCertificate from 'App/Models/MarriedCertificate'
import SecondcopyCertificate from 'App/Models/SecondcopyCertificate'
import { uploadImage } from 'App/Services/uploads/uploadImages'

export default class OrderCertificatesController {
  // =====================================================
  // Helpers de normalização/parse para multipart
  // =====================================================

  /** Normaliza números vindo do multipart (string) */
  private toNumber(v: any): number | null {
    if (v === null || v === undefined || v === '') return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }

  /**
   * Parse seguro de campo JSON vindo do multipart.
   * - aceita objeto já parseado
   * - aceita string JSON
   * - rejeita "[object Object]" (isso é front enviando errado)
   */
  private parseJsonFieldOrFail(
    response: HttpContextContract['response'],
    raw: any,
    fieldName: string
  ): any | null {
    if (raw === null || raw === undefined || raw === '') return null

    // já veio objeto
    if (typeof raw === 'object') return raw

    if (typeof raw === 'string') {
      const trimmed = raw.trim()

      // caso clássico do bug: FormData append(object) => "[object Object]"
      if (trimmed === '[object Object]') {
        response.badRequest({
          message: `${fieldName} inválido: veio como "[object Object]". No front, envie JSON.stringify(${fieldName}).`,
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

    // qualquer outro tipo (number/boolean etc)
    response.badRequest({ message: `${fieldName} inválido: tipo inesperado` })
    return null
  }

  private normalizeOptionalCpf(person: any) {
    if (!person) return person

    if (typeof person.cpf === 'string') {
      const cpf = person.cpf.replace(/\D/g, '').trim()
      person.cpf = cpf === '' ? null : cpf
    }

    return person
  }

  //********************************* */
  // 🔹 Helper para salvar/atualizar Person com TODOS os campos do model
  private async upsertPerson(
    personData: any | null | undefined,
    companiesId: number,
    trx: TransactionClientContract
  ): Promise<Person | null> {
    // Se não tem nada relevante, não faz nada
    if (!personData) return null

    const hasAny =
      String(personData?.name ?? '').trim() !== '' ||
      String(personData?.cpf ?? '').trim() !== '' ||
      this.toNumber(personData?.id) !== null

    if (!hasAny) return null

    const personId = this.toNumber(personData?.id)

    let person: Person
    if (personId) {
      // ✅ garante update no registro certo dentro da trx
      person = await Person.findOrFail(personId, { client: trx })
    } else {
      person = new Person()
    }

    person.useTransaction(trx)

    person.merge({
      companiesId,

      name: personData.name ?? '',
      nameMarried: personData.nameMarried ?? '',
      cpf: String(personData.cpf ?? '').trim() === '' ? null : String(personData.cpf),

      gender: personData.gender ?? '',
      deceased: personData.deceased ?? false,

      dateBirth: personData.dateBirth
        ? DateTime.fromISO(String(personData.dateBirth))
        : null,

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
    })

    await person.save()
    return person
  }

  // 🔹 Salva o formulário de casamento (pessoas + married_certificates)
  private async saveMarriage(
    marriedData: any,
    companiesId: number,
    usrId: number | null,
    trx: TransactionClientContract
  ): Promise<number> {
    try {
      const groom = await this.upsertPerson(marriedData.groom, companiesId, trx)
      if (!groom) throw new Error('Groom (noivo) é obrigatório')

      const fatherGroom = await this.upsertPerson(marriedData.fatherGroom, companiesId, trx)
      const motherGroom = await this.upsertPerson(marriedData.motherGroom, companiesId, trx)

      const bride = await this.upsertPerson(marriedData.bride, companiesId, trx)
      if (!bride) throw new Error('Bride (noiva) é obrigatória')

      const fatherBride = await this.upsertPerson(marriedData.fatherBride, companiesId, trx)
      const motherBride = await this.upsertPerson(marriedData.motherBride, companiesId, trx)

      const witness1 = await this.upsertPerson(marriedData.witness1, companiesId, trx)
      const witness2 = await this.upsertPerson(marriedData.witness2, companiesId, trx)

      const marriedCertificate = await MarriedCertificate.updateOrCreate(
        { id: marriedData.id },
        {
          companiesId,
          usrId: usrId ?? null,

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

          cerimonyLocation: marriedData.cerimonyLocation ?? '',
          otherCerimonyLocation: marriedData.otherCerimonyLocation ?? '',

          nameFormerSpouse: marriedData.nameFormerSpouse ?? '',
          dthrDivorceSpouse: marriedData.dthrDivorceSpouse ?? null,
          nameFormerSpouse2: marriedData.nameFormerSpouse2 ?? '',
          dthrDivorceSpouse2: marriedData.dthrDivorceSpouse2 ?? null,

          inactive: marriedData.inactive ?? false,
          statusForm: marriedData.statusForm ?? '',
        },
        { client: trx }
      )

      return marriedCertificate.id
    } catch (error) {
      console.error('ERRO AO SALVAR MARRIAGE:', error)
      throw error
    }
  }

  // 🔹 Salva o formulário de 2ª via (pessoas + secondcopy_certificates)
  private async saveSecondcopy(
    secondData: any,
    companiesId: number,
    usrId: number | null,
    trx: TransactionClientContract
  ): Promise<number> {
    try {
      const toId = (v: any) => {
        if (v === null || v === undefined || v === '') return null
        const n = Number(v)
        return Number.isFinite(n) && n > 0 ? n : null
      }

      const resolvePersonId = async (idField: any, personObj: any): Promise<number | null> => {
        // ✅ se veio objeto, sempre tenta salvar/atualizar primeiro
        if (personObj && (personObj.id || personObj.name || personObj.cpf)) {
          const p = await this.upsertPerson(personObj, companiesId, trx)
          if (p?.id) return p.id
        }

        // senão, cai pro id puro
        const id = this.toNumber(idField)
        return id ?? null
      }

      // ✅ prioridade correta: PersonObj antes do id (mas aceita id também)
      const applicantPersonObj = secondData?.applicantPerson ?? null
      const registered1PersonObj = secondData?.registered1Person ?? null
      const registered2PersonObj = secondData?.registered2Person ?? null

      const applicantId = await resolvePersonId(secondData?.applicant, applicantPersonObj)
      if (!applicantId) throw new Error('Applicant (requerente) é obrigatório')

      const registered1Id = await resolvePersonId(secondData?.registered1, registered1PersonObj)
      if (!registered1Id) throw new Error('Registered1 (registrado 1) é obrigatório')

      const registered2Id = await resolvePersonId(secondData?.registered2, registered2PersonObj)

      // ✅ aqui é o ponto crítico: atualizar pelo ID CERTO
      const secondcopyId = toId(secondData?.id)

      let secondcopy: SecondcopyCertificate
      if (secondcopyId) {
        secondcopy = await SecondcopyCertificate.findOrFail(secondcopyId, { client: trx })
      } else {
        secondcopy = new SecondcopyCertificate()
      }

      secondcopy.useTransaction(trx)
      secondcopy.merge({
        companiesId,
        documenttypeId: secondData?.documenttypeId ?? null,
        paymentMethod: secondData?.paymentMethod ?? null,

        applicant: applicantId,
        registered1: registered1Id,

        typebookId: secondData.typebookId ?? null,
        book1: secondData?.book1 ?? null,
        sheet1: secondData?.sheet1 ?? null,
        city1: secondData?.city1 ?? null,
        term1: secondData?.term1 ?? null,

        registered2: registered2Id ?? null,
        book2: secondData?.book2 ?? null,
        sheet2: secondData?.sheet2 ?? null,
        city2: secondData?.city2 ?? null,

        obs: secondData?.obs ?? null,
        inactive: secondData?.inactive ?? null,
      })

      await secondcopy.save()

      return secondcopy.id
    } catch (error) {
      console.error('ERRO AO SALVAR SECONDCOPY:', error)
      throw error
    }
  }

  // =====================================================
  // Index / Show
  // =====================================================
  public async index({ auth, request }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    const dateStartOrderCertificate = request.input('dateStartOrderCertificate')
    const dateEndtOrderCertificate = request.input('dateEndOrderCertificate')

    //TIPO DE CERTIDÃO
    const bookId = request.input('bookId') || null

    // pega cpf (se vier) e tira máscara
    const cpf = request.input('cpf')
      ? String(request.input('cpf')).replace(/\D/g, '')
      : null

    // 🔍 novo filtro por nome
    const name = request.input('name')
      ? String(request.input('name')).trim()
      : null

    // 🔍 novos filtros em receipt
    const securitySheet = request.input('securitySheet')
      ? String(request.input('securitySheet')).trim()
      : null

    const habilitationProccess = request.input('habilitationProccess')
      ? String(request.input('habilitationProccess')).trim()
      : null

    // paginação
    const page = Number(request.input('page', 1)) || 1
    const perPageInput = Number(request.input('perPage', 50)) || 50
    const perPage = perPageInput > 100 ? 100 : perPageInput

    // RECEIPT***************************************************
    const freeReceipt = request.input('freeReceipt')

    // FILTER FOR DATE RECEIPT
    const dateStartReceipt = request.input('dateStartReceipt') || null
    const dateEndReceipt = request.input('dateEndReceipt') || null

    // dateProtocol
    const dateStartProtocol = request.input('dateStartProtocol') || null
    const dateEndProtocol = request.input('dateEndProtocol') || null

    // dateStamp
    const dateStartStamp = request.input('dateStartStamp') || null
    const dateEndStamp = request.input('dateEndStamp') || null

    // datePrevision
    const dateStartPrevision = request.input('dateStartPrevision') || null
    const dateEndPrevision = request.input('dateEndPrevision') || null

    // dateMarriage
    const dateStartMarriage = request.input('dateStartMarriage') || null
    const dateEndMarriage = request.input('dateEndMarriage') || null

    //TRIBUTATION LIST
    const tributationList = (request.input('tributationIds', []) || [])
      .map((id) => Number(id))
      .filter((id) => !Number.isNaN(id))

    //SERVICE ID
    const serviceList = (request.input('serviceIds', []) || [])
      .map((id) => Number(id))
      .filter((id) => !Number.isNaN(id))

    // filter for receipt_id
    const receiptId = request.input('receiptId') || null

    // employee_verification
    const employeeVerificationId = request.input('employeeVerificationId') || null

    // emolument code (para filtrar por código de emolumento)
    const emolumentCode = request.input('emolumentCode') || null

    const query = OrderCertificate.query()
      .preload('book', (query) => query.select('id', 'name'))
      .preload('marriedCertificate', (query) => {
        query.select('id', 'groomPersonId', 'bridePersonId')
        query.preload('groom', (q) => q.select('name', 'cpf'))
        query.preload('bride', (q) => q.select('name', 'cpf'))
      })
      .preload('secondcopyCertificate', (q) => {
        q.select('*')
        q.preload('applicantPerson', (p) => p.select('name', 'cpf'))
        q.preload('registered1Person', (p) => p.select('name', 'cpf'))
        q.preload('registered2Person', (p) => p.select('name', 'cpf'))
      })
      .preload('receipt', (q) => {
        q.select([
          'id',
          'order_certificate_id',
          'date_prevision',
          'date_protocol',
          'date_stamp',
          'service_id',
          'user_id',
          'tributation_id',
          'free',
          'stamps',
          'date_marriage',
          'security_sheet',
          'habilitation_proccess',
          'status',
        ])

        q.preload('tributation', (q) => {
          q.select(['id', 'description'])
        })

        q.preload('service', (q) => {
          q.select(['id', 'description'])
        })

        q.preload('items', (q) => {
          q.select(['emolument_id'])
          q.preload('emolument', (q) => {
            q.select(['code'])
          })
        })
      })
      .where('companies_id', authenticate.companies_id)

    if (dateStartOrderCertificate)
      query.andWhere('created_at', '>=', dateStartOrderCertificate)

    if (dateEndtOrderCertificate) {
      query.andWhere('created_at', '<=', dateEndtOrderCertificate)
    }

    if (bookId)
      query.andWhere('book_id', bookId)

    // RECEIPT***************************************************
    // RECEIPT ID
    if (receiptId) {
      query.whereHas('receipt', (r) => {
        r.where('id', receiptId)
      })
    }

    //RECEIPT FREE
    if (freeReceipt === 'true') {
      query.whereHas('receipt', (r) => {
        r.where('free', true)
      })
    } else if (freeReceipt === 'false') {
      query.whereHas('receipt', (r) => {
        r.where('free', false)
      })
    }

    // 🔍 Filtro por security_sheet
    if (securitySheet) {
      query.whereHas('receipt', (r) => {
        r.where('security_sheet', 'like', `%${securitySheet}%`)
      })
    }

    // 🔍 Filtro por habilitation_proccess
    if (habilitationProccess) {
      query.whereHas('receipt', (r) => {
        r.where('habilitation_proccess', 'like', `%${habilitationProccess}%`)
      })
    }

    //TRIBUTATION IDS
    if (tributationList.length) {
      query.whereHas('receipt', (r) => {
        r.whereIn('tributation_id', tributationList)
      })
    }

    //SERVICE IDS
    if (serviceList.length) {
      query.whereHas('receipt', (r) => {
        r.whereIn('service_id', serviceList)
      })
    }

    // 🔍 Filtro por data do RECEIPT (created_at da tabela receipts)
    if (dateStartReceipt || dateEndReceipt) {
      query.whereHas('receipt', (r) => {
        if (dateStartReceipt) {
          r.where('created_at', '>=', dateStartReceipt)
        }
        if (dateEndReceipt) {
          r.where('created_at', '<=', dateEndReceipt)
        }
      })
    }

    // 🔍 Filtro por data do PROTOCOL
    if (dateStartProtocol || dateEndProtocol) {
      query.whereHas('receipt', (r) => {
        if (dateStartProtocol) {
          r.where('date_protocol', '>=', dateStartProtocol)
        }
        if (dateEndProtocol) {
          r.where('date_protocol', '<=', dateEndProtocol)
        }
      })
    }

    // 🔍 Filtro por data de SELO
    if (dateStartStamp || dateEndStamp) {
      query.whereHas('receipt', (r) => {
        if (dateStartStamp) {
          r.where('date_stamp', '>=', dateStartStamp)
        }
        if (dateEndStamp) {
          r.where('date_stamp', '<=', dateEndStamp)
        }
      })
    }

    // 🔍 Filtro por data de PREVISION
    if (dateStartPrevision || dateEndPrevision) {
      query.whereHas('receipt', (r) => {
        if (dateStartPrevision) {
          r.where('date_prevision', '>=', dateStartPrevision)
        }
        if (dateEndPrevision) {
          r.where('date_prevision', '<=', dateEndPrevision)
        }
      })
    }

    // 🔍 Filtro por data de MARRIED
    if (dateStartMarriage || dateEndMarriage) {
      query.whereHas('receipt', (r) => {
        if (dateStartPrevision) {
          r.where('date_marriage', '>=', dateStartMarriage)
        }
        if (dateEndMarriage) {
          r.where('date_marriage', '<=', dateEndMarriage)
        }
      })
    }

    // ✅ Filtro por employee_verification_id na pivot employee_verification_x_receipts
    if (employeeVerificationId) {
      query.whereHas('receipt', (r) => {
        r.whereHas('employeeVerificationXReceipts', (evxr) => {
          evxr
            .where('employeeVerificationId', employeeVerificationId)
            .where('companiesId', authenticate.companies_id)
        })
      })
    }

    // ✅ Filtro por código de EMOLUMENT (via receipt_items -> emoluments)
    if (emolumentCode) {
      query.whereHas('receipt', (r) => {
        r.whereHas('items', (it) => {
          it.whereHas('emolument', (e) => {
            e.where('code', emolumentCode)
            e.where('companiesId', authenticate.companies_id)
          })
        })
      })
    }

    // ***********************************************************
    // 🔍 Filtro por CPF em marriedCertificate -> groom ou bride
    //     OU em secondcopyCertificate (applicant/registered1/registered2)
    if (cpf) {
      query.where((q) => {
        // --- marriedCertificate: groom ou bride ---
        q.whereHas('marriedCertificate', (mc) => {
          mc
            .whereHas('groom', (g) => {
              g.where('cpf', cpf)
            })
            .orWhereHas('bride', (b) => {
              b.where('cpf', cpf)
            })
        })

        // --- secondcopyCertificate: applicant / registered1 / registered2 ---
        q.orWhereHas('secondcopyCertificate', (sc) => {
          sc
            .whereHas('applicantPerson', (p) => {
              p.where('cpf', cpf)
            })
            .orWhereHas('registered1Person', (p) => {
              p.where('cpf', cpf)
            })
            .orWhereHas('registered2Person', (p) => {
              p.where('cpf', cpf)
            })
        })
      })
    }

    // ***********************************************************
    // 🔍 Filtro por NAME em marriedCertificate -> groom ou bride
    //     OU em secondcopyCertificate (applicant/registered1/registered2)
    if (name) {
      const likeName = `%${name}%`

      query.where((q) => {
        // --- marriedCertificate: groom ou bride ---
        q.whereHas('marriedCertificate', (mc) => {
          mc
            .whereHas('groom', (g) => {
              g.where('name', 'like', likeName)
            })
            .orWhereHas('bride', (b) => {
              b.where('name', 'like', likeName)
            })
        })

        // --- secondcopyCertificate: applicant / registered1 / registered2 ---
        q.orWhereHas('secondcopyCertificate', (sc) => {
          sc
            .whereHas('applicantPerson', (p) => {
              p.where('name', 'like', likeName)
            })
            .orWhereHas('registered1Person', (p) => {
              p.where('name', 'like', likeName)
            })
            .orWhereHas('registered2Person', (p) => {
              p.where('name', 'like', likeName)
            })
        })
      })
    }

    const paginated = await query
      .orderBy('id', 'asc')
      .paginate(page, perPage)

    const result = paginated.all().map((order) => {
      const json = order.toJSON()

      if (json.receipt) {
        const codeList = (json.receipt.items || [])
          .map((item) => item.emolument?.code)
          .filter((code) => !!code)
          .join(',')

        json.receipt.emolumentCode = codeList
        delete json.receipt.items
      }

      return json
    })

    return {
      meta: paginated.getMeta(),
      data: result,
    }
  }

  public async show({ auth, params, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const book_id = request.input('book_id')

    const query = OrderCertificate.query()
      .where('id', params.id)
      .andWhere('companies_id', authenticate.companies_id)
      .preload('book', (q) => q.select('id', 'name'))

    if (book_id == 2) {
      query.preload('marriedCertificate', (q) => {
        q.preload('groom', (qq) => qq.select('*'))
        q.preload('motherGroom', (qq) => qq.select('*'))
        q.preload('fatherGroom', (qq) => qq.select('*'))
        q.preload('bride', (qq) => qq.select('*'))
        q.preload('motherBride', (qq) => qq.select('*'))
        q.preload('fatherBride', (qq) => qq.select('*'))
        q.preload('witness1', (qq) => qq.select('*'))
        q.preload('witness2', (qq) => qq.select('*'))
      })
    }

    if (book_id == 21) {
      query.preload('secondcopyCertificate', (q) => {
        q.preload('applicantPerson', (p) => p.select('*'))
        q.preload('registered1Person', (p) => p.select('*'))
        q.preload('registered2Person', (p) => p.select('*'))
        q.preload('documenttype', (d) => d.select('*'))
      })
    }

    const orderCertificate = await query.first()
    if (!orderCertificate) {
      return response.notFound({ message: 'Pedido de certidão não encontrado' })
    }

    return orderCertificate
  }

  // =====================================================
  // Store
  // =====================================================

  public async store({ auth, request, response }: HttpContextContract) {
    const user = await auth.use('api').authenticate()
    const body = request.body()

    // Normaliza campos (multipart manda string)
    const bookId = this.toNumber(body.bookId ?? body.book_id)
    const certificateId = this.toNumber(body.certificateId ?? body.certificate_id)
    const typeCertificate = this.toNumber(body.typeCertificate ?? body.type_certificate)

    if (!bookId) {
      return response.badRequest({ message: 'bookId é obrigatório' })
    }

    try {
      const orderCertificate = await Database.transaction(async (trx) => {
        let finalCertificateId: number | null = certificateId ?? null

        // ✅ CASAMENTO
        if (bookId === 2 && body.marriedCertificate) {
          const parsedMarriage = this.parseJsonFieldOrFail(response, body.marriedCertificate, 'marriedCertificate')
          if (!parsedMarriage) return null as any

          await validator.validate({
            schema: schema.create({
              groom: schema.object().members({
                name: schema.string({ trim: true }),
                cpf: schema.string({ trim: true }),
              }),
              bride: schema.object().members({
                name: schema.string({ trim: true }),
                cpf: schema.string({ trim: true }),
              }),
            }),
            data: parsedMarriage,
            messages: {
              'groom.required': 'O noivo é obrigatório',
              'groom.name.required': 'Nome do noivo é obrigatório',
              'groom.cpf.required': 'CPF do noivo é obrigatório',
              'bride.required': 'A noiva é obrigatória',
              'bride.name.required': 'Nome da noiva é obrigatório',
              'bride.cpf.required': 'CPF da noiva é obrigatório',
            },
          })

          finalCertificateId = await this.saveMarriage(parsedMarriage, user.companies_id, user.id, trx)
        }

        // ✅ 2ª VIA
        if (bookId === 21 && (body.secondcopyCertificate || body.secondCopyCertificate)) {
          const rawSecond = body.secondcopyCertificate ?? body.secondCopyCertificate
          const parsedSecond = this.parseJsonFieldOrFail(response, rawSecond, 'secondcopyCertificate')
          if (!parsedSecond) return null as any

          const applicant = this.normalizeOptionalCpf(
            parsedSecond?.applicantPerson ?? parsedSecond?.applicant
          )
          const registered1 = this.normalizeOptionalCpf(
            parsedSecond?.registered1Person ?? parsedSecond?.registered1
          )

          await validator.validate({
            schema: schema.create({
              applicant: schema.object().members({
                name: schema.string({ trim: true }),
                cpf: schema.string.optional({ trim: true }, [rules.regex(/^\d{11}$/)]),
              }),
              registered1: schema.object().members({
                name: schema.string({ trim: true }),
                cpf: schema.string({ trim: true }, [rules.regex(/^\d{11}$/)]),
              }),
            }),
            data: { applicant, registered1 },
            messages: {
              'applicant.required': 'O requerente é obrigatório',
              'applicant.name.required': 'Nome do requerente é obrigatório',
              'applicant.cpf.regex': 'CPF do requerente inválido',
              'registered1.required': 'O registrado 1 é obrigatório',
              'registered1.name.required': 'Nome do registrado 1 é obrigatório',
              'registered1.cpf.required': 'CPF do registrado 1 é obrigatório',
              'registered1.cpf.regex': 'CPF do registrado 1 inválido',
            },
          })

          finalCertificateId = await this.saveSecondcopy(parsedSecond, user.companies_id, user.id, trx)
        }

        const oc = new OrderCertificate()
        oc.useTransaction(trx)

        oc.merge({
          certificateId: finalCertificateId,
          bookId,
          companiesId: user.companies_id,
          typeCertificate: typeCertificate ?? undefined,
        })

        await oc.save()
        return oc
      })

      if (!orderCertificate) return

      // Upload após commit (apenas casamento)
      if (orderCertificate.bookId === 2 && orderCertificate.certificateId) {
        const companiesId = user.companies_id

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
          extnames: ['jpg', 'png', 'jpeg', 'pdf', 'xls', 'JPG', 'PNG', 'JPEG', 'PDF', 'XLS'],
        } as const

        for (const cfg of fileFields) {
          const file = request.file(cfg.field, fileOptions)
          if (!file) continue

          await uploadImage({
            companiesId,
            marriedCertificateId: orderCertificate.certificateId,
            file,
            description: cfg.description,
          })
        }
      }

      await orderCertificate.load('book')
      if (orderCertificate.bookId === 2) await orderCertificate.load('marriedCertificate')
      if (orderCertificate.bookId === 21) await orderCertificate.load('secondcopyCertificate')

      return response.created(orderCertificate)
    } catch (error: any) {
      if (error.code === 'E_VALIDATION_FAILURE') {
        return response.status(422).send({ errors: error.messages.errors })
      }

      console.error('❌ ERRO STORE:', error)
      return response.internalServerError({ message: 'Erro ao criar pedido de certidão' })
    }
  }

  // =====================================================
  // Update
  // =====================================================
  public async update({ auth, params, request, response }: HttpContextContract) {
    const user = await auth.use('api').authenticate()

    const orderCertificate = await OrderCertificate.find(params.id)
    if (!orderCertificate) {
      return response.notFound({ message: 'Pedido não encontrado' })
    }

    const body = request.body()

    const bookId = this.toNumber(body.bookId ?? body.book_id)
    const certificateIdFromBody = this.toNumber(body.certificateId ?? body.certificate_id)
    const typeCertificate = this.toNumber(body.typeCertificate ?? body.type_certificate)

    if (!bookId) {
      return response.badRequest({ message: 'bookId é obrigatório' })
    }

    try {
      await Database.transaction(async (trx) => {
        orderCertificate.useTransaction(trx)

        // ⚠️ não zera certificateId se não veio no body
        const patch: any = {
          bookId,
          companiesId: user.companies_id,
          typeCertificate: typeCertificate ?? undefined,
        }
        if (certificateIdFromBody !== null) patch.certificateId = certificateIdFromBody

        orderCertificate.merge(patch)
        await orderCertificate.save()

        // ✅ Atualiza CASAMENTO
        if (bookId === 2 && body.marriedCertificate) {
          const parsedMarriage = this.parseJsonFieldOrFail(response, body.marriedCertificate, 'marriedCertificate')
          if (!parsedMarriage) return

          await this.saveMarriage(parsedMarriage, user.companies_id, user.id, trx)
        }

        // ✅ Atualiza 2ª via
        if (bookId === 21 && (body.secondcopyCertificate || body.secondCopyCertificate || body.secondcopyCertificate)) {
          const rawSecond = body.secondcopyCertificate ?? body.secondcopyCertificate ?? body.secondCopyCertificate

          const parsedSecond = this.parseJsonFieldOrFail(response, rawSecond, 'secondcopyCertificate')
          if (!parsedSecond) return

          const applicant = this.normalizeOptionalCpf(
            parsedSecond?.applicantPerson ?? parsedSecond?.applicant
          )
          const registered1 = this.normalizeOptionalCpf(
            parsedSecond?.registered1Person ?? parsedSecond?.registered1
          )

          await validator.validate({
            schema: schema.create({
              applicant: schema.object().members({
                name: schema.string({ trim: true }),
                cpf: schema.string.optional({ trim: true }, [rules.regex(/^\d{11}$/)]),
              }),
              registered1: schema.object().members({
                name: schema.string({ trim: true }),
                cpf: schema.string({ trim: true }, [rules.regex(/^\d{11}$/)]),
              }),
            }),
            data: { applicant, registered1 },
            messages: {
              'applicant.required': 'O requerente é obrigatório',
              'applicant.name.required': 'Nome do requerente é obrigatório',
              'applicant.cpf.regex': 'CPF do requerente inválido',
              'registered1.required': 'O registrado 1 é obrigatório',
              'registered1.name.required': 'Nome do registrado 1 é obrigatório',
              'registered1.cpf.required': 'CPF do registrado 1 é obrigatório',
              'registered1.cpf.regex': 'CPF do registrado 1 inválido',
            },
          })

          const secondcopyId =
            this.toNumber(body.certificateId ?? body.certificate_id) ??
            orderCertificate.certificateId ??
            this.toNumber(parsedSecond?.id)

          if (!secondcopyId) {
            return response.badRequest({
              message: 'Não foi possível determinar o ID da certidão (secondcopy). Envie certificateId ou garanta o vínculo no pedido.',
            })
          }

          parsedSecond.id = secondcopyId
          const savedSecondcopyId = await this.saveSecondcopy(parsedSecond, user.companies_id, user.id, trx)

          if (!orderCertificate.certificateId) {
            orderCertificate.certificateId = savedSecondcopyId
            await orderCertificate.save()
          }
        }
      })

      // Upload no update (só casamento)
      if (orderCertificate.bookId === 2 && orderCertificate.certificateId) {
        const companiesId = user.companies_id

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
          extnames: ['jpg', 'png', 'jpeg', 'pdf', 'xls', 'JPG', 'PNG', 'JPEG', 'PDF', 'XLS'],
        } as const

        for (const cfg of fileFields) {
          const file = request.file(cfg.field, fileOptions)
          if (!file) continue

          await uploadImage({
            companiesId,
            marriedCertificateId: orderCertificate.certificateId,
            file,
            description: cfg.description,
          })
        }
      }

      await orderCertificate.load('book')
      if (orderCertificate.bookId === 2) await orderCertificate.load('marriedCertificate')
      if (orderCertificate.bookId === 21) await orderCertificate.load('secondcopyCertificate')

      const check = await SecondcopyCertificate.find(orderCertificate.certificateId)
      //console.log('CHECK SECOND COPY AFTER UPDATE:', check?.toJSON())

      return orderCertificate
    } catch (error: any) {
      if (error.code === 'E_VALIDATION_FAILURE') {
        return response.status(422).send({ errors: error.messages.errors })
      }

      console.error('❌ ERRO UPDATE:', error)
      return response.internalServerError({
        message: 'Erro ao atualizar pedido de certidão',
        error: error.message,
      })
    }
  }
}
