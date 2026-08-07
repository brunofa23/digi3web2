import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BadRequestException from 'App/Exceptions/BadRequestException'
import Usergroup from 'App/Models/Usergroup'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
export default class UsergroupsController {

  public async index({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    if (!authenticate.superuser)
      throw new BadRequestException('not superuser', 402, 'error_10')

    const { permissiongroup_id } = request.only(['permissiongroup_id'])
    //const body = request.only(Usergroup.fillable)
    try {
      const data = await Usergroup.query()
        .where('inactive', false)
        .if(permissiongroup_id, query => {
          query.whereHas('groupxpermission', subQuery => {
            subQuery.where('permissiongroup_id', permissiongroup_id)
          })
        })
        .orderBy('name')
      return response.ok(data)

    } catch (error) {
      throw new BadRequestException('Erro ao buscar lançamentos', 401, error)
    }
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    if (!authenticate.superuser)
      throw new BadRequestException('not superuser', 402, 'error_10')

    const body = await request.validate({
      schema: schema.create({
        name: schema.string({ trim: true }, [rules.maxLength(60)]),
        inactive: schema.boolean.optional(),
      }),
    })
    try {
      const data = await Usergroup.create(body)
      return response.status(201).send(data)

    } catch (error) {
      throw new BadRequestException('Erro ao criar grupo', 401, error)
    }
  }
}
