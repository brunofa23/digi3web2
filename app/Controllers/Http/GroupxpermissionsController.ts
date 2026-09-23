import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BadRequestException from 'App/Exceptions/BadRequestException'
import Groupxpermission from 'App/Models/Groupxpermission'
import Database from '@ioc:Adonis/Lucid/Database'

import { schema, rules } from '@ioc:Adonis/Core/Validator'

export default class GroupxpermissionsController {
  private ensureDigi3Superuser(authenticate: any) {
    if (!authenticate.superuser || Number(authenticate.companies_id) !== 1) {
      throw new BadRequestException('Acesso permitido somente ao superusuário da empresa Digi3', 403, 'group_permission_admin_forbidden')
    }
  }

  public async index({ auth, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    this.ensureDigi3Superuser(authenticate)

    try {
      const data = await Groupxpermission.query()
      return response.status(200).send(data)
    } catch (error) {
      throw new BadRequestException('Bad Request', 401, error)
    }
  }


  public async update({ auth, params, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    this.ensureDigi3Superuser(authenticate)

    try {

      const updateSchema = schema.create({
        permissions: schema.array().members(
          schema.number([rules.exists({ table: 'permissiongroups', column: 'id' })])
        ),
      })
      const { permissions } = await request.validate({ schema: updateSchema })
      const result = await Database.transaction(async (trx) => {
        const companies = await trx.from('companies').select('id')

        await trx
          .from('groupxpermissions')
          .where('usergroup_id', params.id)
          .delete()

        if (permissions.length === 0) return []

        const permissionRows = companies.flatMap((company) => permissions.map((permissiongroup_id) => ({
          usergroup_id: params.id,
          permissiongroup_id,
          companies_id: company.id,
        })))

        await trx.table('groupxpermissions').insert(permissionRows)
        return permissionRows
      })

      return response.status(201).send(result)

    } catch (error) {
      throw new BadRequestException('Bad Request', 401, error)
    }
  }




  public async PermissiongroupXUsergroup({ auth, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    this.ensureDigi3Superuser(authenticate)

    try {
      const data = await Database
        .from('permissiongroups as p')
        .leftJoin('groupxpermissions as gp', function () {
          this
            .on('p.id', '=', 'gp.permissiongroup_id')
            .andOnVal('gp.usergroup_id', '=', params.usergroup_id)
        })
        .select(
          'p.id',
          'p.name as permissiongroups',
          Database.raw('CASE WHEN gp.usergroup_id IS NOT NULL THEN true ELSE false END AS have_permission')
        )
        .distinct()
        .orderBy('p.id')

      return response.status(200).send(data)

    } catch (error) {
      throw new BadRequestException('Bad Request', 401, error)
    }
  }




}
