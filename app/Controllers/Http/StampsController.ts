// app/Controllers/Http/StampsController.ts
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Stamp from 'App/Models/Stamp'
import StampValidator from 'App/Validators/StampValidator'


export default class StampsController {
  /**
   * GET /stamps
   * Lista os stamps da empresa autenticada, com paginação
   * Query params opcionais: page, perPage
   */
  public async index({ auth, request }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    const { page = 1, perPage = 20 } = request.qs()

    const stamps = await Stamp.query()
      .where('companies_id', authenticate.companies_id)
      .orderBy('id', 'asc')
      .paginate(page, perPage)

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

    // Busca todos os stamps ativos da empresa
    const stamps = await Stamp.query()
      .where('companies_id', authenticate.companies_id)
      .where('finished', false)
      .where('inactive', false)
      .orderBy('id', 'asc')

    if (!stamps.length) {
      return response.notFound({
        message: 'Nenhum stamp disponível (finished = 0 e inactive = 0)',
      })
    }

    const sequence: string[] = []
    let remaining = quantity

    for (const stamp of stamps) {
      if (remaining <= 0) break

      // ponto de partida
      let current = stamp.current ?? stamp.start - 1

      while (remaining > 0) {
        current += 1

        // passou do fim
        if (stamp.end && current > stamp.end) {
          stamp.finished = true
          stamp.current = stamp.end
          break
        }

        const code = `${stamp.serial}${current}` // serial + current
        sequence.push(code)

        stamp.current = current
        remaining--

        if (stamp.end && current === stamp.end) {
          stamp.finished = true
          break
        }
      }
    }

    // salva só os alterados
    await Promise.all(
      stamps
        .filter((s) => s.$isDirty)
        .map((s) => s.save())
    )

    if (!sequence.length) {
      return response.notFound({
        message:
          'Não foi possível gerar a sequência com os stamps disponíveis',
      })
    }

    // aqui entra o ; depois de CADA serial+current
    const sequenceJoinedWithSemicolon = sequence.map((code) => `${code};`).join('')

    return {
      quantityRequested: quantity,
      quantityGenerated: sequence.length,
      sequence, // ["ABC1000", "ABC1001", ...]
      sequence_joined: sequenceJoinedWithSemicolon, // "ABC1000;ABC1001;ABC1002;"
    }
  }



}








