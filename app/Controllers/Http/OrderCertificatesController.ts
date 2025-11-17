import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import OrderCertificate from 'App/Models/OrderCertificate'
import { schema, rules } from '@ioc:Adonis/Core/Validator'

export default class OrderCertificatesController {
  /**
   * Lista todos os pedidos de certidão da empresa do usuário
   */
  public async index({ auth }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    return await OrderCertificate.query()
      .preload('book', query=>{
        query.select('id', 'name')
      })
      .preload('marriedCertificate', query=>{
        query.select('id','groomPersonId', 'bridePersonId')
        query.preload('groom',query=>{
          query.select('name')
        })
        query.preload('bride', query=>{
          query.select('name')
        })
      })

      .where('companies_id', authenticate.companies_id)
      .orderBy('id', 'asc')
  }

  /**
   * Mostra um pedido de certidão pelo ID
   */
  public async show({ auth, params, response }: HttpContextContract) {
    await auth.use('api').authenticate()

    const orderCertificate = await OrderCertificate.find(params.id)

    if (!orderCertificate) {
      return response.notFound({ message: 'Pedido de certidão não encontrado' })
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
      bookId:schema.number()
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
    await auth.use('api').authenticate()

    const orderCertificate = await OrderCertificate.find(params.id)

    if (!orderCertificate) {
      return response.notFound({ message: 'Pedido de certidão não encontrado' })
    }

    const validationSchema = schema.create({
      typeCertificate: schema.number.optional([
        rules.unsigned(),
      ]),
      certificateId: schema.number.optional([
        rules.unsigned(),
      ]),
      bookId:schema.number()
    })

    const payload = await request.validate({ schema: validationSchema })

    orderCertificate.merge(payload)
    await orderCertificate.save()

    return orderCertificate
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
