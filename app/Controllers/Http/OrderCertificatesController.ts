import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import type { TransactionClientContract } from '@ioc:Adonis/Lucid/Database'
import OrderCertificate from 'App/Models/OrderCertificate'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Database from '@ioc:Adonis/Lucid/Database'
import Person from 'App/Models/Person'
import MarriedCertificate from 'App/Models/MarriedCertificate'
export default class OrderCertificatesController {

  //********************************* */
  // 🔹 Função separada só pra tratar o formulário de casamento
  private async saveMarriage(
    marriedData: any,
    companiesId: number,
    trx: TransactionClientContract
  ) {
    try {
      // 🔹 Noivo
      const groom = await Person.updateOrCreate(
        { id: marriedData.groom?.id },
        {
          companiesId,
          name: marriedData.groom?.name,
          cpf: marriedData.groom?.cpf,
          gender: marriedData.groom?.gender,
          zipCode: marriedData.groom?.zipCode,
          address: marriedData.groom?.address,
          city: marriedData.groom?.city,
          state: marriedData.groom?.state,
          phone: marriedData.groom?.phone,
          cellphone: marriedData.groom?.cellphone,
          email: marriedData.groom?.email,
        },
        { client: trx }
      )

      // 🔹 Pai do noivo (opcional)
      const fatherGroom = marriedData.fatherGroom
        ? await Person.updateOrCreate(
          { id: marriedData.fatherGroom?.id },
          {
            companiesId,
            name: marriedData.fatherGroom?.name,
            cpf: marriedData.fatherGroom?.cpf,
            gender: marriedData.fatherGroom?.gender,
            zipCode: marriedData.fatherGroom?.zipCode,
            address: marriedData.fatherGroom?.address,
            city: marriedData.fatherGroom?.city,
            state: marriedData.fatherGroom?.state,
            phone: marriedData.fatherGroom?.phone,
            cellphone: marriedData.fatherGroom?.cellphone,
            email: marriedData.fatherGroom?.email,
          },
          { client: trx }
        )
        : null

      // 🔹 Mãe do noivo (opcional)
      const motherGroom = marriedData.motherGroom
        ? await Person.updateOrCreate(
          { id: marriedData.motherGroom?.id },
          {
            companiesId,
            name: marriedData.motherGroom?.name,
            cpf: marriedData.motherGroom?.cpf,
            gender: marriedData.motherGroom?.gender,
            zipCode: marriedData.motherGroom?.zipCode,
            address: marriedData.motherGroom?.address,
            city: marriedData.motherGroom?.city,
            state: marriedData.motherGroom?.state,
            phone: marriedData.motherGroom?.phone,
            cellphone: marriedData.motherGroom?.cellphone,
            email: marriedData.motherGroom?.email,
          },
          { client: trx }
        )
        : null

      // 🔹 Noiva
      const bride = await Person.updateOrCreate(
        { id: marriedData.bride?.id },
        {
          companiesId,
          name: marriedData.bride?.name,
          cpf: marriedData.bride?.cpf,
          gender: marriedData.bride?.gender,
          zipCode: marriedData.bride?.zipCode,
          address: marriedData.bride?.address,
          city: marriedData.bride?.city,
          state: marriedData.bride?.state,
          phone: marriedData.bride?.phone,
          cellphone: marriedData.bride?.cellphone,
          email: marriedData.bride?.email,
        },
        { client: trx }
      )

      // 🔹 Pai da noiva (opcional)
      const fatherBride = marriedData.fatherBride
        ? await Person.updateOrCreate(
          { id: marriedData.fatherBride?.id },
          {
            companiesId,
            name: marriedData.fatherBride?.name,
            cpf: marriedData.fatherBride?.cpf,
            gender: marriedData.fatherBride?.gender,
            zipCode: marriedData.fatherBride?.zipCode,
            address: marriedData.fatherBride?.address,
            city: marriedData.fatherBride?.city,
            state: marriedData.fatherBride?.state,
            phone: marriedData.fatherBride?.phone,
            cellphone: marriedData.fatherBride?.cellphone,
            email: marriedData.fatherBride?.email,
          },
          { client: trx }
        )
        : null

      // 🔹 Mãe da noiva (opcional)
      const motherBride = marriedData.motherBride
        ? await Person.updateOrCreate(
          { id: marriedData.motherBride?.id },
          {
            companiesId,
            name: marriedData.motherBride?.name,
            cpf: marriedData.motherBride?.cpf,
            gender: marriedData.motherBride?.gender,
            zipCode: marriedData.motherBride?.zipCode,
            address: marriedData.motherBride?.address,
            city: marriedData.motherBride?.city,
            state: marriedData.motherBride?.state,
            phone: marriedData.motherBride?.phone,
            cellphone: marriedData.motherBride?.cellphone,
            email: marriedData.motherBride?.email,
          },
          { client: trx }
        )
        : null

      // 🔹 Testemunha 1 (opcional)
      const witness1 = marriedData.witness1
        ? await Person.updateOrCreate(
          { id: marriedData.witness1?.id },
          {
            companiesId,
            name: marriedData.witness1?.name,
            cpf: marriedData.witness1?.cpf,
            gender: marriedData.witness1?.gender,
            zipCode: marriedData.witness1?.zipCode,
            address: marriedData.witness1?.address,
            city: marriedData.witness1?.city,
            state: marriedData.witness1?.state,
            phone: marriedData.witness1?.phone,
            cellphone: marriedData.witness1?.cellphone,
            email: marriedData.witness1?.email,
          },
          { client: trx }
        )
        : null

      // 🔹 Testemunha 2 (opcional)
      const witness2 = marriedData.witness2
        ? await Person.updateOrCreate(
          { id: marriedData.witness2?.id },
          {
            companiesId,
            name: marriedData.witness2?.name,
            cpf: marriedData.witness2?.cpf,
            gender: marriedData.witness2?.gender,
            zipCode: marriedData.witness2?.zipCode,
            address: marriedData.witness2?.address,
            city: marriedData.witness2?.city,
            state: marriedData.witness2?.state,
            phone: marriedData.witness2?.phone,
            cellphone: marriedData.witness2?.cellphone,
            email: marriedData.witness2?.email,
          },
          { client: trx }
        )
        : null

      // 🔹 Salva a certidão de casamento com TODOS os campos do model
      await MarriedCertificate.updateOrCreate(
        { id: marriedData.id },
        {
          // contexto
          companiesId,

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

          // Usuário responsável (por enquanto usa o que vier no payload, depois podemos trocar pelo user logado)
          usrId: 17,//marriedData.usrId ?? 0, // se tiver restrição NOT NULL, depois passamos o user autenticado via parâmetro

          // Status
          statusId: marriedData.statusId ?? null,

          // Datas principais
          dthrSchedule: marriedData.dthrSchedule ?? null,
          dthrMarriage: marriedData.dthrMarriage ?? null,

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
    } catch (error) {
      console.error('ERRO AO SALVAR MARRIAGE:', error)
      throw error // mantém rollback da transaction
    }
  }




  /**
   * Lista todos os pedidos de certidão da empresa do usuário
   */
  public async index({ auth }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    return await OrderCertificate.query()
      .preload('book', query => {
        query.select('id', 'name')
      })
      .preload('marriedCertificate', query => {
        query.select('id', 'groomPersonId', 'bridePersonId')
        query.preload('groom', query => {
          query.select('name')
        })
        query.preload('bride', query => {
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

    console.log("request:::", request.input('book_id'))
    console.log("request param:::", params)

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
        //query.select('id', 'groomPersonId', 'bridePersonId')
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
    //.first()

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

    const validationSchema = schema.create({
      typeCertificate: schema.number([
        rules.unsigned(),
      ]),
      certificateId: schema.number([
        rules.unsigned(),
      ]),
      bookId: schema.number()
    })

    const payload = await request.validate({ schema: validationSchema })

    const orderCertificate = await OrderCertificate.create({
      ...payload,
      companiesId: authenticate.companies_id,
    })

    return response.created(orderCertificate)
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
        id: schema.number([rules.unsigned()])
      })
    })

    const payload = await request.validate({ schema: validationSchema })
    const body = request.body()

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
          await this.saveMarriage(body.marriedCertificate, authenticate.companies_id, trx)
        }
      })

      // 👉 Após commit, pode carregar relações se quiser:
      await orderCertificate.load('book')
      await orderCertificate.load('marriedCertificate')

      return orderCertificate

    } catch (error) {
      console.error(error)
      return response.internalServerError({ message: 'Erro ao atualizar pedido de certidão', error: error.message })
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
