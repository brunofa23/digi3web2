import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import type { TransactionClientContract } from '@ioc:Adonis/Lucid/Database'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'

import OrderCertificate from 'App/Models/OrderCertificate'
import Person from 'App/Models/Person'
import MarriedCertificate from 'App/Models/MarriedCertificate'

export default class OrderCertificatesController {
  //********************************* */
  // 🔹 Helper para salvar/atualizar Person com TODOS os campos do model
  private async upsertPerson(
    personData: any | null | undefined,
    companiesId: number,
    trx: TransactionClientContract
  ): Promise<Person | null> {
    if (!personData) {
      return null
    }

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
    usrId: number | null,
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
          usrId,

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
            marriedData.dthrSchedule &&
              marriedData.dthrSchedule.trim() !== ''
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
  public async store({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const body = request.body()
    //console.log(body)
    const validationSchema = schema.create({
      //typeCertificate: schema.number([rules.unsigned()]),
      // Pode vir no payload, mas para casamento vamos sobrescrever
      //certificateId: schema.number.optional([rules.unsigned()]),
      // Aceita tanto bookId direto quanto um objeto book.id (igual no update)
      bookId: schema.number.optional([rules.unsigned()]),
      book: schema.object.optional().members({
        id: schema.number([rules.unsigned()]),
      }),
    })

    console.log("PASSO 1", authenticate.id)
    const payload: any = await request.validate({ schema: validationSchema })
    console.log("PASSO 2", payload)

    // Normaliza book.id -> bookId
    if (payload.book?.id) {
      payload.bookId = payload.book.id
    }
    delete payload.book

    if (!payload.bookId) {
      return response.badRequest({
        message: 'bookId é obrigatório',
      })
    }

    try {
      const orderCertificate = await Database.transaction(async (trx) => {
        let certificateId //= payload.certificateId
        // 🔹 Se for casamento (livro 2), salva primeiro o marriedCertificate
        if (payload.bookId === 2 && body.marriedCertificate) {
          // IMPORTANTE: ajuste a função saveMarriage para retornar o ID do registro
          const marriageId = await this.saveMarriage(
            body.marriedCertificate,
            authenticate.companies_id,
            authenticate.id,
            trx
          )
          certificateId = marriageId
          console.log("PPPPPPPPPPPPP>>", certificateId)
        }

        const oc = new OrderCertificate()
        oc.useTransaction(trx)

        oc.merge({
          typeCertificate: payload.typeCertificate,
          bookId: payload.bookId,
          companiesId: authenticate.companies_id,
          certificateId: certificateId,
        })

        await oc.save()

        return oc
      })

      await orderCertificate.load('book')
      await orderCertificate.load('marriedCertificate')

      return response.created(orderCertificate)
    } catch (error: any) {
      console.error(error)
      return response.internalServerError({
        message: 'Erro ao criar pedido de certidão',
        error: error.message,
      })
    }
  }


  /**
   * Atualiza um pedido de certidão existente
   */
  public async update({ auth, params, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    const orderCertificate = await OrderCertificate.find(params.id)
    if (!orderCertificate) {
      return response.notFound({ message: 'Pedido de certidão não encontrado' })
    }

    const validationSchema = schema.create({
      certificateId: schema.number.optional([rules.unsigned()]),
      book: schema.object().members({
        id: schema.number([rules.unsigned()]),
      }),
    })

    const payload: any = await request.validate({ schema: validationSchema })
    const body = request.body()

    console.log(body)

    try {
      await Database.transaction(async (trx) => {
        // 🔹 Põe o orderCertificate dentro da mesma transaction
        orderCertificate.useTransaction(trx)

        // 🔹 Normaliza campo book.id → bookId
        if (payload.book?.id) {
          payload.bookId = payload.book.id
        }

        // 🔹 Remove o objeto book (não existe campo 'book' no model)
        delete payload.book

        // 🔹 Salva os dados do pedido
        orderCertificate.merge({
          certificateId: payload.certificateId,
          bookId: payload.bookId,
          companiesId: authenticate.companies_id,
        })

        await orderCertificate.save()

        // 🔹 Se for casamento, salva o form completo
        if (payload.bookId === 2 && body.marriedCertificate) {
          await this.saveMarriage(
            body.marriedCertificate,
            authenticate.companies_id,
            authenticate.id,
            trx
          )
        }
      })

      // 👉 Após commit, recarrega relações
      await orderCertificate.load('book')
      await orderCertificate.load('marriedCertificate')

      return orderCertificate
    } catch (error: any) {
      console.error(error)
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
