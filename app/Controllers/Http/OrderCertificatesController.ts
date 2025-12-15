import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import type { TransactionClientContract } from '@ioc:Adonis/Lucid/Database'
import { schema, rules, validator } from '@ioc:Adonis/Core/Validator'
import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'

// (não estava sendo usado aqui, mantive fora pra não dar “unused import”)
// import MarriedCertificateValidator from 'App/Validators/MarriedCertificateValidator'

import OrderCertificate from 'App/Models/OrderCertificate'
import Person from 'App/Models/Person'
import MarriedCertificate from 'App/Models/MarriedCertificate'
import SecondcopyCertificate from 'App/Models/SecondcopyCertificate'
import { uploadImage } from 'App/Services/uploads/uploadImages'

export default class OrderCertificatesController {
  //********************************* */
  // 🔹 Helper para salvar/atualizar Person com TODOS os campos do model
  private async upsertPerson(
    personData: any | null | undefined,
    companiesId: number,
    trx: TransactionClientContract
  ): Promise<Person | null> {
    if (!personData || (!personData.companiesId && !personData.name && !personData.cpf)) {
      return null
    }

    //console.log('PASSEI AQUI CREATE PERSON', personData)

    return await Person.updateOrCreate(
      { id: personData.id },
      {
        companiesId,

        // === Dados pessoais ===
        name: personData.name ?? '',
        nameMarried: personData.nameMarried ?? '',
        cpf: personData.cpf?.trim() === '' ? null : personData.cpf,
        gender: personData.gender ?? '',
        deceased: personData.deceased ?? false,

        dateBirth: personData.dateBirth ? DateTime.fromISO(personData.dateBirth.toString()) : null,

        maritalStatus: personData.maritalStatus ?? '',
        illiterate: personData.illiterate ?? false,

        // === Naturalidade / Nacionalidade / Profissão ===
        placeBirth: personData.placeBirth ?? '',
        nationality: personData.nationality ?? '',
        occupationId: personData.occupationId ?? null,

        // === Endereço ===
        zipCode: personData.zipCode ?? '',
        address: personData.address ?? '',
        streetNumber: personData.streetNumber ?? '',
        streetComplement: personData.streetComplement ?? '',
        district: personData.district ?? '',
        city: personData.city ?? '',
        state: personData.state ?? '',

        // === Documento ===
        documentType: personData.documentType ?? '',
        documentNumber: personData.documentNumber ?? '',

        // === Contatos ===
        phone: personData.phone ?? '',
        cellphone: personData.cellphone ?? '',
        email: personData.email ?? '',

        // Controle
        inactive: personData.inactive ?? false,
      },
      { client: trx }
    )
  }

  // 🔹 Salva o formulário de casamento (pessoas + married_certificates)
  private async saveMarriage(
    marriedData: any,
    companiesId: number,
    usrId: number | null,
    trx: TransactionClientContract
  ): Promise<number> {
    try {
      // 🔹 Noivo (obrigatório)
      const groom = await this.upsertPerson(marriedData.groom, companiesId, trx)
      if (!groom) throw new Error('Groom (noivo) é obrigatório')

      // 🔹 Pai do noivo (opcional)
      const fatherGroom = await this.upsertPerson(marriedData.fatherGroom, companiesId, trx)

      // 🔹 Mãe do noivo (opcional)
      const motherGroom = await this.upsertPerson(marriedData.motherGroom, companiesId, trx)

      // 🔹 Noiva (obrigatória)
      const bride = await this.upsertPerson(marriedData.bride, companiesId, trx)
      if (!bride) throw new Error('Bride (noiva) é obrigatória')

      // 🔹 Pai da noiva (opcional)
      const fatherBride = await this.upsertPerson(marriedData.fatherBride, companiesId, trx)

      // 🔹 Mãe da noiva (opcional)
      const motherBride = await this.upsertPerson(marriedData.motherBride, companiesId, trx)

      // 🔹 Testemunha 1 (opcional)
      const witness1 = await this.upsertPerson(marriedData.witness1, companiesId, trx)

      // 🔹 Testemunha 2 (opcional)
      const witness2 = await this.upsertPerson(marriedData.witness2, companiesId, trx)

      // 🔹 Salva ou atualiza a certidão de casamento
      const marriedCertificate = await MarriedCertificate.updateOrCreate(
        { id: marriedData.id },
        {
          // contexto
          companiesId,
          usrId: usrId ?? null,

          // Noivo e pais
          groomPersonId: groom.id,
          fatherGroomPersonId: fatherGroom?.id ?? null,
          motherGroomPersonId: motherGroom?.id ?? null,

          // Noiva e pais
          bridePersonId: bride.id,
          fahterBridePersonId: fatherBride?.id ?? null, // typo na coluna
          motherBridePersonId: motherBride?.id ?? null,

          // Testemunhas
          witnessPersonId: witness1?.id ?? null,
          witness2PersonId: witness2?.id ?? null,

          // Status
          statusId: marriedData.statusId ?? null,

          // Datas principais
          dthrSchedule:
            marriedData.dthrSchedule && marriedData.dthrSchedule.trim() !== ''
              ? DateTime.fromISO(marriedData.dthrSchedule, { zone: 'America/Sao_Paulo' })
              : null,

          dthrMarriage: marriedData.dthrMarriage ? DateTime.fromISO(marriedData.dthrMarriage) : null,

          // Tipo e observação
          type: marriedData.type ?? '',
          obs: marriedData.obs ?? '',

          // Igreja
          churchName: marriedData.churchName ?? '',
          churchCity: marriedData.churchCity ?? '',

          // Regime de bens
          maritalRegime: marriedData.maritalRegime ?? '',

          // Pacto antenupcial
          prenup: marriedData.prenup ?? false,
          registryOfficePrenup: marriedData.registryOfficePrenup ?? '',
          addresRegistryOfficePrenup: marriedData.addresRegistryOfficePrenup ?? '',
          bookRegistryOfficePrenup: marriedData.bookRegistryOfficePrenup ?? null,
          sheetRegistryOfficePrenup: marriedData.sheetRegistryOfficePrenup ?? null,
          dthrPrenup: marriedData.dthrPrenup ?? null,

          // Local da cerimônia
          cerimonyLocation: marriedData.cerimonyLocation ?? '',
          otherCerimonyLocation: marriedData.otherCerimonyLocation ?? '',

          // Ex-cônjuges
          nameFormerSpouse: marriedData.nameFormerSpouse ?? '',
          dthrDivorceSpouse: marriedData.dthrDivorceSpouse ?? null,
          nameFormerSpouse2: marriedData.nameFormerSpouse2 ?? '',
          dthrDivorceSpouse2: marriedData.dthrDivorceSpouse2 ?? null,

          // Controle
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
      /**
       * ✅ FRONT está enviando applicant/registered1 como null
       * e preenchendo applicantPerson/registered1Person.
       * Então aqui fazemos fallback automático.
       */
      const applicantData = secondData?.applicant ?? secondData?.applicantPerson
      const registered1Data = secondData?.registered1 ?? secondData?.registered1Person
      const registered2Data = secondData?.registered2 ?? secondData?.registered2Person

      // 🔹 Requerente (obrigatório)
      const applicant = await this.upsertPerson(applicantData, companiesId, trx)
      if (!applicant) throw new Error('Applicant (requerente) é obrigatório')

      // 🔹 Registrado 1 (obrigatório)
      const registered1 = await this.upsertPerson(registered1Data, companiesId, trx)
      if (!registered1) throw new Error('Registered1 (registrado 1) é obrigatório')

      // 🔹 Registrado 2 (opcional)
      const registered2 = await this.upsertPerson(registered2Data, companiesId, trx)

      // 🔹 Salva/atualiza secondcopy
      const secondcopy = await SecondcopyCertificate.updateOrCreate(
        { id: secondData?.id },
        {
          companiesId,
          documenttypeId: secondData?.documenttypeId ?? null,
          paymentMethod: secondData?.paymentMethod ?? null,

          applicant: applicant.id,
          registered1: registered1.id,

          book1: secondData?.book1 ?? null,
          sheet1: secondData?.sheet1 ?? null,
          city1: secondData?.city1 ?? null,

          registered2: registered2?.id ?? null,
          book2: secondData?.book2 ?? null,
          sheet2: secondData?.sheet2 ?? null,
          city2: secondData?.city2 ?? null,
        },
        { client: trx }
      )

      return secondcopy.id
    } catch (error) {
      console.error('ERRO AO SALVAR SECONDCOPY:', error)
      throw error
    }
  }


  /**
   * Lista todos os pedidos de certidão da empresa do usuário
   */
  public async index({ auth }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    return await OrderCertificate.query()
      .preload('book', (query) => {
        query.select('id', 'name')
      })
      .preload('marriedCertificate', (query) => {
        query.select('id', 'groomPersonId', 'bridePersonId')
        query.preload('groom', (q) => q.select('name'))
        query.preload('bride', (q) => q.select('name'))
      })
      .preload('secondcopyCertificate', (q) => {
        q.select('id', 'applicant', 'registered1', 'registered2')
        q.preload('applicantPerson', (p) => p.select('name'))
        q.preload('registered1Person', (p) => p.select('name'))
        q.preload('registered2Person', (p) => p.select('name'))
      })
      .where('companies_id', authenticate.companies_id)
      .orderBy('id', 'asc')
  }

  /**
   * Mostra um pedido de certidão pelo ID
   */
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

  /**
   * Cria um novo pedido de certidão
   */
  public async store({ auth, request, response }: HttpContextContract) {

    const user = await auth.use('api').authenticate()
    const body = request.body()

    // 1️⃣ Validação simples
    const validationSchema = schema.create({
      certificateId: schema.number.optional([rules.unsigned()]),
      bookId: schema.number([rules.unsigned()]),
      // se você usa typeCertificate aqui, descomente:
      // typeCertificate: schema.number.optional([rules.unsigned()]),
    })

    const payload: any = await request.validate({ schema: validationSchema })

    try {
      const orderCertificate = await Database.transaction(async (trx) => {
        let certificateId = payload.certificateId ?? null

        // console.log("PASSEI AQUI......PASSO 0", body.marriedCertificate)
        // console.log("PASSEI AQUI......PASSO 1", body.secondcopyCertificate)

        // ✅ CASAMENTO (livro 2)
        if (payload.bookId === 2 && body.marriedCertificate) {
          let parsedMarriage: any

          try {
            parsedMarriage =
              typeof body.marriedCertificate === 'string'
                ? JSON.parse(body.marriedCertificate)
                : body.marriedCertificate
          } catch {
            return response.badRequest({
              message: 'marriedCertificate inválido (JSON malformado)',
            })
          }

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

          certificateId = await this.saveMarriage(parsedMarriage, user.companies_id, user.id, trx)
        }

        // ✅ SEGUNDA VIA (livro 21)
        if (payload.bookId === 21 && body.secondcopyCertificate) {
          let parsedSecond: any
          console.log("PASSEI AQUI......PASSO 1")
          try {
            parsedSecond =
              typeof body.secondcopyCertificate === 'string'
                ? JSON.parse(body.secondcopyCertificate)
                : body.secondcopyCertificate
          } catch {
            return response.badRequest({
              message: 'secondcopyCertificate inválido (JSON malformado)',
            })
          }

          console.log("PASSEI AQUI......PASSO 2")
          const teste = await validator.validate({
            schema: schema.create({
              applicant: schema.object().members({
                name: schema.string({ trim: true }),
                cpf: schema.string({ trim: true }),
              }),
              registered1: schema.object().members({
                name: schema.string({ trim: true }),
                cpf: schema.string({ trim: true }),
              }),
            }),
            data: parsedSecond,
            messages: {
              'applicant.required': 'O requerente é obrigatório',
              'applicant.name.required': 'Nome do requerente é obrigatório',
              'applicant.cpf.required': 'CPF do requerente é obrigatório',
              'registered1.required': 'O registrado 1 é obrigatório',
              'registered1.name.required': 'Nome do registrado 1 é obrigatório',
              'registered1.cpf.required': 'CPF do registrado 1 é obrigatório',
            },
          })

          console.log("PASSEI AQUI......PASSO 3", teste)
          certificateId = await this.saveSecondcopy(parsedSecond, user.companies_id, user.id, trx)
        }

        // 4️⃣ Cria o pedido principal
        const oc = new OrderCertificate()
        oc.useTransaction(trx)

        oc.merge({
          certificateId,
          bookId: payload.bookId,
          companiesId: user.companies_id,
          typeCertificate: payload.typeCertificate, // se não existir no payload, pode remover
        })

        await oc.save()
        return oc
      })

      // 5️⃣ Após o commit, faz upload dos arquivos (se houver e se for casamento)
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

      // 6️⃣ Recarrega relações após upload
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

  /**
   * Atualiza um pedido de certidão existente
   */
  public async update({ auth, params, request, response }: HttpContextContract) {
    const user = await auth.use('api').authenticate()

    const orderCertificate = await OrderCertificate.find(params.id)
    if (!orderCertificate) {
      return response.notFound({ message: 'Pedido não encontrado' })
    }

    const body = request.body()

    const validationSchema = schema.create({
      certificateId: schema.number.optional([rules.unsigned()]),
      bookId: schema.number([rules.unsigned()]),
    })

    const payload: any = await request.validate({ schema: validationSchema })

    try {
      await Database.transaction(async (trx) => {
        orderCertificate.useTransaction(trx)

        orderCertificate.merge({
          certificateId: payload.certificateId,
          bookId: payload.bookId,
          companiesId: user.companies_id,
        })

        await orderCertificate.save()

        // ✅ Atualiza CASAMENTO
        if (payload.bookId === 2 && body.marriedCertificate) {
          const parsedMarriage =
            typeof body.marriedCertificate === 'string'
              ? JSON.parse(body.marriedCertificate)
              : body.marriedCertificate

          await this.saveMarriage(parsedMarriage, user.companies_id, user.id, trx)
        }

        // ✅ Atualiza 2ª via
        if (payload.bookId === 21 && body.secondcopyCertificate) {
          const parsedSecond =
            typeof body.secondcopyCertificate === 'string'
              ? JSON.parse(body.secondcopyCertificate)
              : body.secondcopyCertificate

          await this.saveSecondcopy(parsedSecond, user.companies_id, user.id, trx)
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

      // Recarrega relações
      await orderCertificate.load('book')
      if (orderCertificate.bookId === 2) await orderCertificate.load('marriedCertificate')
      if (orderCertificate.bookId === 21) await orderCertificate.load('secondcopyCertificate')

      return orderCertificate
    } catch (error: any) {
      console.error('❌ ERRO UPDATE:', error)
      return response.internalServerError({
        message: 'Erro ao atualizar pedido de certidão',
        error: error.message,
      })
    }
  }
}
