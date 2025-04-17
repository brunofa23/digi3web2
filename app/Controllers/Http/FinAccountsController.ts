import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BadRequestException from 'App/Exceptions/BadRequestException'
import FinAccount from 'App/Models/FinAccount'
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
        console.log("data")
        query.where('date', '>=', body.date_start)
        query.where('date', '<=', body.date_end)

      } else if (body.typeDate == 'DATE_DUE') {
        console.log("data vencimento")
        query.where('date_due', '>=', body.date_start)
        query.where('date_due', '<=', body.date_end)
      }
      else if (body.typeDate == 'DATE_CONCILIATION') {
        console.log("data conciliacao")
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
    const body = request.only(FinAccount.fillable)
    const body2 = {
      ...body,
      companies_id: authenticate.companies_id,
      // amount: await currencyConverter(body.amount),
      // amount_paid: body.amount_paid ? await currencyConverter(body.amount_paid) : null,
      ir: body.ir === 'false' ? 0 : 1,
      replicate: body.replicate === 'false' ? 0 : 1
    }
    try {
      const data = await FinAccount.create(body2)
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
    const body = request.only(FinAccount.fillable)

    //console.log(body)
    // let amount
    // let amount_paid
    // if (body.amount) {
    //   amount = await currencyConverter(body.amount)
    // }
    // if(body.amount_paid){
    //   amount_paid = await currencyConverter(body.amount_paid)
    // }
    const body2 = {
      ...body,
      amount: body.amount ? await currencyConverter(body.amount) : null,
      amount_paid: body.amount_paid ? await currencyConverter(body.amount_paid) : null,
      excluded: body.excluded == 'false' ? false : true,
      ir: body.ir === 'false' ? 0 : 1,
      replicate: body.replicate === 'false' ? 0 : 1
    }

    try {
      const data = await FinAccount.query()
        .where('companies_id', authenticate.companies_id)
        .andWhere('id', params.id)
        .update(body2)
      return response.status(201).send(data)
    } catch (error) {
      throw new BadRequestException('Bad Request', 401, error)
    }

  }


  // public async createMany({ auth, request, response }: HttpContextContract) {
  //   console.log("create many")
  //   const authenticate = await auth.use('api').authenticate()
  //   const { id, installment, date_due_installment } = request.only(['id', 'installment', 'date_due_installment'])
  //   console.log(id, installment, date_due_installment)

  //   try {
  //     const data = await FinAccount.query().where('id', id).first()
  //     const { id: _id, ...createPayload } = data?.$original

  //     const day = DateTime.fromISO(data?.$original.date_due).day
  //     const month = DateTime.fromISO(data?.$original.date_due).month
  //     const dateTeste = DateTime.fromISO(data?.$original.date_due).plus({ month: 1 }).set({day:18})
  //     console.log("dia:", day, "mes:", month, "DATA:", dateTeste.toFormat("yyyy-MM-dd"))

  //     await FinAccount.create({...createPayload,id_replication:_id})


  //     //return response.status(201).send(teste)

  //   } catch (error) {
  //     throw new BadRequestException('Bad Request', 401, error)
  //   }
  // }

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
      const { id: _id, ...basePayload } = data.$original

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
