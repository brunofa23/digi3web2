import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Person from 'App/Models/Person'
import PersonValidator from 'App/Validators/PersonValidator'

export default class PeopleController {
  /**
   * GET /people
   * Filtros:
   *  - q, cpf, email, inactive
   * Paginação:
   *  - page (default 1), perPage (default 10, máx 100)
   */
  public async index({ request, auth }: HttpContextContract) {
    await auth.use('api').authenticate()
    const user = auth.user!
    const companiesId = (user as any).companiesId ?? (user as any).companies_id

    const page = Number(request.input('page', 1))
    const perPage = Math.min(Number(request.input('perPage', 10)), 100)

    // query string (q, cpf, email, inactive)
    const q = request.input('q') as string | undefined
    const cpf = request.input('cpf') as string | undefined
    const email = request.input('email') as string | undefined
    const inactive = request.input('inactive') as string | boolean | undefined

    const query = Person.query()
      .where('companies_id', companiesId)
      .orderBy('id', 'desc')

    if (q) {
      query.where((qb) => {
        qb.where('name', 'like', `%${q}%`)
          .orWhere('cpf', 'like', `%${q}%`)
          .orWhere('email', 'like', `%${q}%`)
      })
    }

    // 🔹 Busca por CPF exato (já sem máscara vindo do frontend)
    if (cpf) {
      console.log("pesquisa por cpf")
      query.where('cpf', cpf)

    }

    if (email) {
      query.where('email', 'like', `%${email}%`)
    }

    if (typeof inactive !== 'undefined') {
      const inactiveBool =
        typeof inactive === 'string' ? inactive === 'true' : Boolean(inactive)
      query.where('inactive', inactiveBool)
    }

    if(cpf){
      return query.first()
    }


    console.log(query.toQuery())

    return await query.paginate(page, perPage)
  }


  /** GET /people/:id */
  public async show({ params, auth, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const user = auth.user!
    const companiesId = (user as any).companiesId ?? (user as any).companies_id

    const person = await Person.query()
      .where('companies_id', companiesId)
      .where('id', params.id)
      .first()

    if (!person) return response.notFound({ message: 'Pessoa não encontrada' })

    return person
  }

  /** POST /people (create) — usa PersonValidator */
  public async store({ request, auth, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const user = auth.user!
    const companiesId = (user as any).companiesId ?? (user as any).companies_id

    const payload = await request.validate(PersonValidator)

    const person = await Person.create({
      ...payload,
      companiesId, // sempre do usuário autenticado
    })

    return response.created(person)
  }

  /** PATCH/PUT /people/:id (update) — usa o MESMO PersonValidator */
  public async update({ params, request, auth, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const user = auth.user!
    const companiesId = (user as any).companiesId ?? (user as any).companies_id

    const person = await Person.query()
      .where('companies_id', companiesId)
      .where('id', params.id)
      .first()

    if (!person) return response.notFound({ message: 'Pessoa não encontrada' })

    const payload = await request.validate(PersonValidator)

    person.merge(payload)
    await person.save()

    return person
  }

  /** DELETE /people/:id */
  public async destroy({ params, auth, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const user = auth.user!
    const companiesId = (user as any).companiesId ?? (user as any).companies_id

    const person = await Person.query()
      .where('companies_id', companiesId)
      .where('id', params.id)
      .first()

    if (!person) return response.notFound({ message: 'Pessoa não encontrada' })

    await person.delete()
    return response.ok({ message: 'Pessoa removida com sucesso' })
  }

}
