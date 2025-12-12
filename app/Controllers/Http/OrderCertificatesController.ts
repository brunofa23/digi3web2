import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import type { TransactionClientContract } from '@ioc:Adonis/Lucid/Database'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'
import { validator, schema } from '@ioc:Adonis/Core/Validator'

import MarriedCertificateValidator from 'App/Validators/MarriedCertificateValidator'

import OrderCertificate from 'App/Models/OrderCertificate'
import Person from 'App/Models/Person'
import MarriedCertificate from 'App/Models/MarriedCertificate'
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

    console.log("PASSEI AQUI CREATE PERSON", personData)

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

        dateBirth: personData.dateBirth
          ? DateTime.fromISO(personData.dateBirth.toString())
          : null,

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
    usrId: number | null, // ✅ modificação: aceita null
    trx: TransactionClientContract
  ): Promise<number> {
    try {
      // 🔹 Noivo (obrigatório)
      const groom = await this.upsertPerson(marriedData.groom, companiesId, trx)
      if (!groom) {
        throw new Error('Groom (noivo) é obrigatório')
      }

      // 🔹 Pai do noivo (opcional)
      const fatherGroom = await this.upsertPerson(
        marriedData.fatherGroom,
        companiesId,
        trx
      )

      // 🔹 Mãe do noivo (opcional)
      const motherGroom = await this.upsertPerson(
        marriedData.motherGroom,
        companiesId,
        trx
      )

      // 🔹 Noiva (obrigatória)
      const bride = await this.upsertPerson(
        marriedData.bride,
        companiesId,
        trx
      )
      if (!bride) {
        throw new Error('Bride (noiva) é obrigatória')
      }

      // 🔹 Pai da noiva (opcional)
      const fatherBride = await this.upsertPerson(
        marriedData.fatherBride,
        companiesId,
        trx
      )

      // 🔹 Mãe da noiva (opcional)
      const motherBride = await this.upsertPerson(
        marriedData.motherBride,
        companiesId,
        trx
      )

      // 🔹 Testemunha 1 (opcional)
      const witness1 = await this.upsertPerson(
        marriedData.witness1,
        companiesId,
        trx
      )

      // 🔹 Testemunha 2 (opcional)
      const witness2 = await this.upsertPerson(
        marriedData.witness2,
        companiesId,
        trx
      )

      // 🔹 Salva ou atualiza a certidão de casamento
      const marriedCertificate = await MarriedCertificate.updateOrCreate(
        { id: marriedData.id }, // se vier id, faz update; se não vier, cria
        {
          // contexto
          companiesId,
          usrId: usrId ?? null, // ✅ modificação: garante null

          // Noivo e pais
          groomPersonId: groom.id,
          fatherGroomPersonId: fatherGroom?.id ?? null,
          motherGroomPersonId: motherGroom?.id ?? null,

          // Noiva e pais
          bridePersonId: bride.id,
          fahterBridePersonId: fatherBride?.id ?? null, // (nome da coluna com typo mesmo)
          motherBridePersonId: motherBride?.id ?? null,

          // Testemunhas
          witnessPersonId: witness1?.id ?? null,
          witness2PersonId: witness2?.id ?? null,

          // Status
          statusId: marriedData.statusId ?? null,

          // Datas principais
          dthrSchedule:
            marriedData.dthrSchedule && marriedData.dthrSchedule.trim() !== ''
              ? DateTime.fromISO(marriedData.dthrSchedule, {
                zone: 'America/Sao_Paulo',
              })
              : null,

          dthrMarriage: marriedData.dthrMarriage
            ? DateTime.fromISO(marriedData.dthrMarriage)
            : null,

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

      //CHAMAR UPLOAD DAS IMAGENS


      // ⬇⬇⬇ ESSENCIAL: retornar o ID para ser usado no orderCertificate.certificateId
      return marriedCertificate.id
    } catch (error) {
      console.error('ERRO AO SALVAR MARRIAGE:', error)
      // mantém rollback da transaction no nível superior
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
        query.preload('groom', (query) => {
          query.select('name')
        })
        query.preload('bride', (query) => {
          query.select('name')
        })
      })
      .where('companies_id', authenticate.companies_id)
      .orderBy('id', 'asc')
  }

  /**
   * Mostra um pedido de certidão pelo ID
   */
  public async show({ auth, params, request, response }: HttpContextContract) {
    console.log('request:::', request.input('book_id'))
    console.log('request param:::', params)

    const authenticate = await auth.use('api').authenticate()
    const book_id = request.input('book_id')

    const query = OrderCertificate.query()
      .where('id', params.id)
      .andWhere('companies_id', authenticate.companies_id)
      .preload('book', (query) => {
        query.select('id', 'name')
      })

    if (book_id == 2) {
      query.preload('marriedCertificate', (query) => {
        query.preload('groom', (query) => {
          query.select('*')
        })
        query.preload('motherGroom', (query) => {
          query.select('*')
        })
        query.preload('fatherGroom', (query) => {
          query.select('*')
        })
        query.preload('bride', (query) => {
          query.select('*')
        })
        query.preload('motherBride', (query) => {
          query.select('*')
        })
        query.preload('fatherBride', (query) => {
          query.select('*')
        })
        query.preload('witness1', (query) => {
          query.select('*')
        })
        query.preload('witness2', (query) => {
          query.select('*')
        })
      })
    }

    const orderCertificate = await query.first()

    if (!orderCertificate) {
      return response.notFound({
        message: 'Pedido de certidão não encontrado',
      })
    }

    return orderCertificate
  }

  /**
   * Cria um novo pedido de certidão
   */
  /**
 * Cria um novo pedido de certidão
 */
  /**
   * Cria um novo pedido de certidão
   */
  public async store({ auth, request, response }: HttpContextContract) {
    const user = await auth.use('api').authenticate()
    const body = request.body()

    // 1️⃣ Validação simples
    const validationSchema = schema.create({
      certificateId: schema.number.optional([rules.unsigned()]),
      bookId: schema.number([rules.unsigned()]), // campo principal obrigatório
    })

    // 2️⃣ Valida o payload
    const payload: any = await request.validate({ schema: validationSchema })

    try {
      const orderCertificate = await Database.transaction(async (trx) => {
        let certificateId = payload.certificateId ?? null

        // 3️⃣ Se for CASAMENTO (livro 2), salva marriedCertificate primeiro
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

          // ✅ VALIDAÇÃO SIMPLES E CORRETA (Adonis v5)
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

          // ✅ só chega aqui se passou
          certificateId = await this.saveMarriage(
            parsedMarriage,
            user.companies_id,
            user.id,
            trx
          )
        }



        // 4️⃣ Cria o pedido principal
        const oc = new OrderCertificate()
        oc.useTransaction(trx)

        oc.merge({
          certificateId,
          bookId: payload.bookId,
          companiesId: user.companies_id,
          typeCertificate: payload.typeCertificate,
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
            marriedCertificateId: orderCertificate.certificateId, // id do MarriedCertificate
            file,
            description: cfg.description,
          })
        }
      }

      // 6️⃣ Recarrega relações após upload
      await orderCertificate.load('book')
      await orderCertificate.load('marriedCertificate')

      return response.created(orderCertificate)
    } catch (error: any) {
      if (error.code === 'E_VALIDATION_FAILURE') {
        return response.status(422).send({
          errors: error.messages.errors,
        })
      }

      console.error('❌ ERRO STORE:', error)
      return response.internalServerError({
        message: 'Erro ao criar pedido de certidão',
      })
    }

  }



  /**
   * Atualiza um pedido de certidão existente
   */
  /**
   * Atualiza um pedido de certidão existente
   */
  public async update({ auth, params, request, response }: HttpContextContract) {
    console.log('🔥🔥🔥 ENTROU NO UPDATE')

    const user = await auth.use('api').authenticate()

    const orderCertificate = await OrderCertificate.find(params.id)
    console.log('🔍 Registro encontrado:', orderCertificate ? 'SIM' : 'NÃO')

    if (!orderCertificate) {
      return response.notFound({ message: 'Pedido não encontrado' })
    }

    const body = request.body()
    console.log('📥 BODY RAW:', body)

    // 1️⃣ Validação do payload
    const validationSchema = schema.create({
      certificateId: schema.number.optional([rules.unsigned()]),
      bookId: schema.number([rules.unsigned()]),
    })

    const payload = await request.validate({ schema: validationSchema })

    console.log('📦 PAYLOAD VALIDADO:', payload)

    try {
      await Database.transaction(async (trx) => {
        console.log('🔧 INICIOU TRANSACTION')

        orderCertificate.useTransaction(trx)

        // 2️⃣ Atualiza dados principais
        orderCertificate.merge({
          certificateId: payload.certificateId,
          bookId: payload.bookId,
          companiesId: user.companies_id,
        })

        console.log('📝 CAMPOS APÓS MERGE:', orderCertificate.toJSON())
        await orderCertificate.save()

        // 3️⃣ Atualiza marriedCertificate (se livro 2)
        if (payload.bookId === 2 && body.marriedCertificate) {
          const parsedMarriage =
            typeof body.marriedCertificate === 'string'
              ? JSON.parse(body.marriedCertificate)
              : body.marriedCertificate

          await this.saveMarriage(
            parsedMarriage,
            user.companies_id,
            user.id,
            trx
          )
        }

        console.log('💾 SALVOU')
      })

      // 4️⃣ Após o commit, faz upload de arquivos novos (se enviados)
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

          // no UPDATE: se não mandou esse campo, mantém arquivos antigos
          if (!file) continue

          await uploadImage({
            companiesId,
            marriedCertificateId: orderCertificate.certificateId,
            file,
            description: cfg.description,
          })
        }
      }

      // 5️⃣ Recarrega relações
      await orderCertificate.load('book')
      await orderCertificate.load('marriedCertificate')

      return orderCertificate
    } catch (error: any) {
      console.error('❌ ERRO UPDATE:', error)
      return response.internalServerError({
        message: 'Erro ao atualizar pedido de certidão',
        error: error.message,
      })
    }
  }



  /**
   * Deleta um pedido de certidão
   */
  // public async destroy({ auth, params, response }: HttpContextContract) {
  //   await auth.use('api').authenticate()
  //
  //   const orderCertificate = await OrderCertificate.find(params.id)
  //   if (!orderCertificate) {
  //     return response.notFound({ message: 'Pedido de certidão não encontrado' })
  //   }
  //
  //   await orderCertificate.delete()
  //   return response.ok({ message: 'Pedido de certidão removido com sucesso' })
  // }
}
