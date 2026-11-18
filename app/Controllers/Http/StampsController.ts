// app/Controllers/Http/StampsController.ts
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import BadRequestException from 'App/Exceptions/BadRequestException'
import Stamp from 'App/Models/Stamp'
import StampValidator from 'App/Validators/StampValidator'


export default class StampsController {
  /**
   * GET /stamps
   * Lista os stamps da empresa autenticada, com paginação
   * Query params opcionais: page, perPage, finished
   */
  public async index({ auth, request }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    const { page = 1, perPage = 20, finished } = request.qs()

    const query = Stamp.query()
      .where('companies_id', authenticate.companies_id)
      .orderBy('id', 'asc')

    if (finished === 'true' || finished === 'false') {
      query.where('finished', finished === 'true')
    }

    const stamps = await query.paginate(page, perPage)

    return stamps
  }

  /**
   * GET /stamps/:id
   */
  public async show({ auth, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    const stamp = await Stamp.query()
      .where('companies_id', authenticate.companies_id)
      .where('id', params.id)
      .first()

    if (!stamp) {
      return response.notFound({ message: 'Stamp não encontrado' })
    }

    return stamp
  }

  /**
   * POST /stamps
   */
  public async store({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    const data = await request.validate(StampValidator)

    const stamp = await Stamp.create({
      ...data,
      companies_id: authenticate.companies_id,
    })

    return response.created(stamp)
  }

  /**
   * PUT/PATCH /stamps/:id
   */
  public async update({ auth, params, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    const stamp = await Stamp.query()
      .where('companies_id', authenticate.companies_id)
      .where('id', params.id)
      .first()

    if (!stamp) {
      return response.notFound({ message: 'Stamp não encontrado' })
    }

    const data = await request.validate(StampValidator)

    stamp.merge(data)
    await stamp.save()

    return stamp
  }

  /**
   * DELETE /stamps/:id
   */
  public async destroy({ auth, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    const stamp = await Stamp.query()
      .where('companies_id', authenticate.companies_id)
      .where('id', params.id)
      .first()

    if (!stamp) {
      return response.notFound({ message: 'Stamp não encontrado' })
    }

    await stamp.delete()
    return response.noContent()
  }


  // public async next({ auth, response }: HttpContextContract) {
  //   console.log("passo 1")
  //   const authenticate = await auth.use('api').authenticate()
  //   // Busca o stamp mais recente disponível
  //   const query = Stamp.query()
  //     .where('companies_id', authenticate.companies_id)
  //     .where('finished', false)
  //     .where('inactive', false)
  //     .orderBy('id', 'desc') // mais recente
  //   console.log(query)
  //   const stamp = await query.first()

  //   if (!stamp) {
  //     return response.notFound({
  //       message: 'Nenhum stamp disponível (finished = 0 e inactive = 0)',
  //     })
  //   }

  //   // Lógica de incremento do current
  //   // Se current for null, começamos em start - 1 e incrementamos
  //   let current = stamp.current ?? stamp.start - 1
  //   current += 1

  //   // Se houver "end" definido e passarmos ou chegarmos nele, marca como finalizado
  //   if (stamp.end && current >= stamp.end) {
  //     stamp.finished = true
  //   }

  //   stamp.current = current
  //   await stamp.save()

  //   return stamp
  // }

  public async sequence({ auth, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    const quantityParam = Number(params.quantity)
    if (!quantityParam || isNaN(quantityParam) || quantityParam <= 0) {
      return response.badRequest({ message: 'Quantidade inválida' })
    }
    const quantity = quantityParam
    const trx = await Database.transaction()

    try {
      // Mantém o endpoint legado serializado com o novo fluxo de selamento.
      const stamps = await Stamp.query({ client: trx })
        .where('companies_id', authenticate.companies_id)
        .where('finished', false)
        .where('inactive', false)
        .orderBy('id', 'asc')
        .forUpdate()

      const sequence: string[] = []
      let remaining = quantity

      for (const stamp of stamps) {
        if (remaining <= 0) break

        let current = stamp.current ?? stamp.start - 1
        while (remaining > 0) {
          current += 1
          if (stamp.end && current > stamp.end) {
            stamp.finished = true
            stamp.current = stamp.end
            break
          }

          sequence.push(`${stamp.serial}${current}`)
          stamp.current = current
          remaining--

          if (stamp.end && current === stamp.end) {
            stamp.finished = true
            break
          }
        }
      }

      if (remaining > 0) {
        throw new BadRequestException('Não há selos disponíveis em quantidade suficiente.', 409, 'stamp_sequence_insufficient')
      }

      for (const stamp of stamps.filter((item) => item.$isDirty)) {
        await stamp.save()
      }

      await trx.commit()
      return {
        quantityRequested: quantity,
        quantityGenerated: sequence.length,
        sequence,
        sequence_joined: sequence.map((code) => `${code};`).join(''),
      }
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }



}








