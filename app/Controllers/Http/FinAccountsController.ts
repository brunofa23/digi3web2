import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BadRequestException from 'App/Exceptions/BadRequestException'
import FinAccount from 'App/Models/FinAccount'
import FinAccountStoreValidator from 'App/Validators/FinAccountStoreValidator'
import FinAccountUpdateValidator from 'App/Validators/FinAccountUpdateValidator'
import { currencyConverter } from "App/Services/util"
import { uploadFinImage } from 'App/Services/uploadFinImage/finImages'
import { DateTime } from 'luxon'

export default class FinAccountsController {

  public async index({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const body = request.qs()

    try {
      const query = FinAccount.query()
        .where('companies_id', authenticate.companies_id)
        .where('excluded', false)
        .preload('finclass', query => {
          query.select('description')
        })
        .preload('finemp', query => {
          query.select('name')
        })
        .preload('finPaymentMethod', query => {
          query.select('description')
        })

      if (body.description)
        query.where('description', 'like', `%${body.description}%`)
      if (body.fin_emp_id)
        query.where('fin_emp_id', body.fin_emp_id)
      if (body.fin_class_id)
        query.where('fin_class_id', body.fin_class_id)

      //PESQUISA POR TIPO DE DATA
      // DATE
      // DATE_DUE
      // DATE_CONCILIATION
      if (body.typeDate == 'DATE') {
        query.where('date', '>=', body.date_start)
        query.where('date', '<=', body.date_end)

      } else if (body.typeDate == 'DATE_DUE') {
        query.where('date_due', '>=', body.date_start)
        query.where('date_due', '<=', body.date_end)
      }
      else if (body.typeDate == 'DATE_CONCILIATION') {
        query.where('date_conciliation', '>=', body.date_start)
        query.where('date_conciliation', '<=', body.date_end)
      }
      if (body.cost)
        query.where('cost', body.cost)
      if (body.payment_method)
        query.where('payment_method', body.payment_method)
      if (body.ir === 'true')
        query.where('ir', true)
      if (body.debit_credit)
        query.where('debit_credit', body.debit_credit)
      if (body.fin_paymentmethod_id)
        query.where('fin_paymentmethod_id', body.fin_paymentmethod_id)

      //RECONCILIADO OU NÃO OU TODOS
      if (body.isReconciled == 'C')
        //console.log("lançamentos conciliados")
        query.where('amount_paid', '>', 0)
      if (body.isReconciled == 'N')
        //console.log("NÃO conciliados")
        query.whereNull('amount_paid')

      const data = await query

      return response.status(200).send(data)
    } catch (error) {
      throw new BadRequestException('Bad Request', 401, error)
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
    const { conciliation, ...body1 } = body

    if (conciliation == true) {
      body1.amount_paid = body.amount
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


  public async update({ auth, params, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const body = await request.validate(FinAccountUpdateValidator)
    body.date = body.date?.toJSDate()
    body.date_due = body.date_due?.toJSDate()
    body.data_billing = body.data_billing?.toJSDate()
    body.date_conciliation = body.date_conciliation?.toJSDate()
    body.amount = body.amount ? await currencyConverter(body.amount) : null
    body.amount_paid = !isNaN(body.amount_paid) || body.amount_paid ? await currencyConverter(body.amount_paid) : null
    const { conciliation, ...body1 } = body

    try {
      await FinAccount.query()
        .where('companies_id', authenticate.companies_id)
        .andWhere('id', params.id)
        .update(body1)

      const data = await FinAccount.findOrFail(params.id)
      await data.load('finPaymentMethod')
      await data.load('finclass')
      await data.load('finemp')

      return response.status(201).send(data)
    } catch (error) {
      throw new BadRequestException('Bad Request', 401, error)
    }

  }


  public async createMany({ auth, request, response }: HttpContextContract) {

    console.log("CREATE MANY ....")
    const authenticate = await auth.use('api').authenticate()

    const { id, installment, date_due_installment } = request.only([
      'id',
      'installment',
      'date_due_installment'
    ])

    try {
      const data = await FinAccount.query().where('id', id).firstOrFail()
      const { id: _id,date_conciliation:_date_conciliation,amount_paid:_amount_paid, ...basePayload } = data.$original

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
