import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BadRequestException from 'App/Exceptions/BadRequestException'
import FinAccount from 'App/Models/FinAccount'
import FinAccountStoreValidator from 'App/Validators/FinAccountStoreValidator'
import FinAccountUpdateValidator from 'App/Validators/FinAccountUpdateValidator'
import { currencyConverter } from "App/Services/util"
import { uploadFinImage } from 'App/Services/uploadFinImage/finImages'
import { DateTime } from 'luxon'


function toUTCISO(dateStr: string | null | undefined) {
  return dateStr ? DateTime.fromISO(dateStr).toUTC().toISO() : null
}

export default class FinAccountsController {

  public async index({ auth, request, response }: HttpContextContract) {
    const user = await auth.use('api').authenticate()
    const body = request.qs()

    try {
      const query = FinAccount.query()
        .where('companies_id', user.companies_id)
        .where('excluded', false)
        .preload('finclass', q => q.select('description'))
        .preload('finemp', q => q.select('name'))
        .preload('finPaymentMethod', q => q.select('description'))


      // Filtros dinâmicos
      query.if(body.description, q =>
        q.where('description', 'like', `%${body.description}%`)
      )

      query.if(body.fin_emp_id, q =>
        q.where('fin_emp_id', body.fin_emp_id)
      )

      query.if(body.fin_class_id, q =>
        q.where('fin_class_id', body.fin_class_id)
      )

      query.if(body.cost, q =>
        q.where('cost', body.cost)
      )

      query.if(body.payment_method, q =>
        q.where('payment_method', body.payment_method)
      )

      query.if(body.ir === 'true', q =>
        q.where('ir', true)
      )

      query.if(body.debit_credit, q =>
        q.where('debit_credit', body.debit_credit)
      )

      query.if(body.fin_paymentmethod_id, q =>
        q.where('fin_paymentmethod_id', body.fin_paymentmethod_id)
      )

      // Data inicial e final em UTC
      if (body.date_start && body.date_end && body.typeDate) {
        const start = DateTime.fromISO(body.date_start).toUTC().toISO()
        const end = DateTime.fromISO(body.date_end).toUTC().endOf('day').toISO()

        const dateColumnMap = {
          DATE: 'date',
          DATE_DUE: 'date_due',
          DATE_CONCILIATION: 'date_conciliation',
        }

        const dateColumn = dateColumnMap[body.typeDate]
        if (dateColumn) {
          query.where(dateColumn, '>=', start).where(dateColumn, '<=', end)
        }
      }

      // Filtro por conciliação
      query.if(body.isReconciled === 'C', q => {
        q.whereNotNull('date_conciliation')
      })
      query.if(body.isReconciled === 'N', q => {
        q.whereNull('date_conciliation')
      })

      const data = await query
      return response.ok(data)

    } catch (error) {
      throw new BadRequestException('Erro ao buscar lançamentos', 401, error)
    }
  }




  public async show({ auth, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    try {
      const data = await FinAccount.query()
        .where('id', params.id)
        .andWhere('companies_id', authenticate.companies_id)
      return response.status(200).send(data)
    } catch (error) {
      throw new BadRequestException('Bad Request', 401, error)
    }
  }


  public async store({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const body = await request.validate(FinAccountStoreValidator)
    body.companies_id = authenticate.companies_id
    // Convertendo as datas para o formato adequado
    if (body.date) {
      body.date = DateTime.fromISO(body.date, { zone: 'utc' }).startOf('day')
    }
    if (body.date_due) {
      body.date_due = DateTime.fromISO(body.date_due, { zone: 'utc' }).startOf('day')
    }
    if (body.date_conciliation) {
      body.date_conciliation = DateTime.fromISO(body.date_conciliation, { zone: 'utc' }).startOf('day')
    }
    if (body.data_billing) {
      body.data_billing = DateTime.fromISO(body.data_billing, { zone: 'utc' }).startOf('day')
    }

    const { conciliation, ...body1 } = body
    if (conciliation == true) {
      body1.date_conciliation = body.date_due
    }

    try {
      const data = await FinAccount.create(body1)
      await uploadFinImage(authenticate.companies_id, data.id, request)
      await data.load('finPaymentMethod')
      await data.load('finclass')
      await data.load('finemp')

      return response.status(201).send(data)

    } catch (error) {
      throw new BadRequestException('Bad Request', 401, error)
    }
  }


  //*********
  public async update({ auth, params, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const body = await request.validate(FinAccountUpdateValidator)

    console.log("passo 1", body.amount)

    body.date = body.date ? DateTime.fromISO(body.date, { zone: 'utc' }).startOf('day').toFormat("yyyy-MM-dd HH:mm") : null
    body.date_due = body.date_due ? DateTime.fromISO(body.date_due).startOf('day').toFormat("yyyy-MM-dd HH:mm") : null
    body.data_billing = body.data_billing ? DateTime.fromISO(body.data_billing, { zone: 'utc' }).startOf('day').toFormat("yyyy-MM-dd HH:mm") : null
    body.date_conciliation = body.date_conciliation ? DateTime.fromISO(body.date_conciliation, { zone: 'utc' }).startOf('day').toFormat("yyyy-MM-dd HH:mm") : null
    body.amount = body.amount ? await currencyConverter(body.amount) : null

    console.log("passo 2", body.amount)
    //const { conciliation, ...body1 } = body
    console.log("passo 3", body.amount)


    try {
      // Realizando o update
      await FinAccount.query()
        .where('companies_id', authenticate.companies_id)
        .andWhere('id', params.id)
        .update(body)

      const data = await FinAccount.findOrFail(params.id)
      await data.load('finPaymentMethod')
      await data.load('finclass')
      await data.load('finemp')

      return response.status(201).send(data)
    } catch (error) {
      throw new BadRequestException('Bad Request', 401, error)
    }
  }




  // public async update({ auth, params, request, response }: HttpContextContract) {
  //   const authenticate = await auth.use('api').authenticate()
  //   const body = await request.validate(FinAccountUpdateValidator)
  //   body.date = body.date?.toJSDate()
  //   body.date_due = body.date_due?.toJSDate()
  //   body.data_billing = body.data_billing?.toJSDate()
  //   body.date_conciliation = body.date_conciliation?.toJSDate()
  //   body.amount = body.amount ? await currencyConverter(body.amount) : null
  //   body.amount_paid = !isNaN(body.amount_paid) || body.amount_paid ? await currencyConverter(body.amount_paid) : null
  //   const { conciliation, ...body1 } = body

  //   try {
  //     await FinAccount.query()
  //       .where('companies_id', authenticate.companies_id)
  //       .andWhere('id', params.id)
  //       .update(body1)

  //     const data = await FinAccount.findOrFail(params.id)
  //     await data.load('finPaymentMethod')
  //     await data.load('finclass')
  //     await data.load('finemp')

  //     return response.status(201).send(data)
  //   } catch (error) {
  //     throw new BadRequestException('Bad Request', 401, error)
  //   }

  // }



  public async createMany({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const { id, installment, date_due_installment } = request.only([
      'id',
      'installment',
      'date_due_installment'
    ])

    try {
      const data = await FinAccount.query().where('id', id).firstOrFail()
      const { id: _id, date_conciliation: _date_conciliation, amount_paid: _amount_paid, ...basePayload } = data.$original

      const parcelas = []

      for (let i = 1; i <= installment; i++) {
        const dueDate = DateTime.fromISO(data.date_due)
          .plus({ months: i }) // soma os meses
          .set({ day: date_due_installment }) // fixa o dia

        parcelas.push({
          ...basePayload,
          date_due: dueDate.toISODate(), // ou toISO() se quiser hora
          id_replication: _id,
          replicate: true

          //installment_number: i + 1, // opcional: adicionar numeração da parcela
          //created_by: user.id // se tiver controle de usuário
        })
      }

      //console.log(parcelas)
      //return parcelas
      await FinAccount.createMany(parcelas)
      return response.status(201).send({ message: 'Parcelas criadas com sucesso' })
    } catch (error) {
      throw new BadRequestException('Erro ao criar parcelas', 400, error)
    }
  }



  public async destroy({ }: HttpContextContract) { }


}
