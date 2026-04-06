// app/Controllers/Http/TokensDevicesController.ts
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import crypto from 'crypto'
import { DateTime } from 'luxon'
import TokenDevice from 'App/Models/TokenDevice'
import AuthorizedDevice from 'App/Models/AuthorizedDevice'
import User from 'App/Models/User'

export default class TokensDevicesController {
  public async generate({ auth, response }: HttpContextContract) {
    try {
      const authenticate = await auth.use('api').authenticate()

      const user = await User.query()
        .where('id', authenticate.id)
        .preload('company')
        .preload('usergroup', (query) => {
          query.preload('groupxpermission')
        })
        .first()

      if (!user) {
        return response.status(404).send({
          message: 'Usuário não encontrado',
        })
      }

      if (!user.companies_id) {
        return response.status(403).send({
          message: 'Usuário sem empresa vinculada',
        })
      }

      if (user.company && user.company.use_device_control === false) {
        return response.status(403).send({
          message: 'Controle de dispositivo não habilitado para esta empresa',
        })
      }

      const RELEASE_TOKEN_PERMISSIONGROUP_ID = 35

      const hasPermission =
        user.usergroup?.groupxpermission?.some((item: any) => {
          return Number(item.permissiongroup_id) === RELEASE_TOKEN_PERMISSIONGROUP_ID
        }) || false

      if (!hasPermission) {
        return response.status(403).send({
          message: 'Usuário sem permissão para liberar token de dispositivo',
        })
      }

      const token = crypto.randomBytes(32).toString('hex')

      const tokenDevice = await TokenDevice.create({
        companyId: user.companies_id,
        createdByUserId: user.id,
        token,
        expiresAt: DateTime.now().plus({ minutes: 10 }),
        active: true,
      })

      return response.status(200).send({
        message: 'Token gerado com sucesso',
        data: {
          id: tokenDevice.id,
          token: tokenDevice.token,
          expires_at: tokenDevice.expiresAt,
        },
      })
    } catch (error) {
      console.log('Erro ao gerar token de dispositivo:', error)

      return response.status(400).send({
        message: 'Erro ao gerar token de dispositivo',
        error: error.message || error,
      })
    }
  }

  public async validateToken({ request, response }: HttpContextContract) {
    try {
      const { token, companies_id } = request.only(['token', 'companies_id'])

      if (!token) {
        return response.status(400).send({
          message: 'Token não informado',
        })
      }

      if (!companies_id) {
        return response.status(400).send({
          message: 'Empresa não informada',
        })
      }

      const tokenDevice = await TokenDevice.query()
        .where('token', token)
        .andWhere('company_id', companies_id)
        .first()

      if (!tokenDevice) {
        return response.status(404).send({
          message: 'Token não encontrado',
        })
      }

      if (!tokenDevice.active) {
        return response.status(403).send({
          message: 'Token inativo',
        })
      }

      if (tokenDevice.usedAt) {
        return response.status(403).send({
          message: 'Token já utilizado',
        })
      }

      if (tokenDevice.expiresAt < DateTime.now()) {
        return response.status(403).send({
          message: 'Token expirado',
        })
      }

      return response.status(200).send({
        message: 'Token válido',
        data: {
          id: tokenDevice.id,
          company_id: tokenDevice.companyId,
          expires_at: tokenDevice.expiresAt,
        },
      })
    } catch (error) {
      console.log('Erro ao validar token de dispositivo:', error)

      return response.status(400).send({
        message: 'Erro ao validar token de dispositivo',
        error: error.message || error,
      })
    }
  }

  public async registerDevice({ request, response }: HttpContextContract) {
    try {
      const body = request.only([
        'token',
        'companies_id',
        'device_name',
        'device_identifier',
        'user_id',
      ])

      if (!body.token) {
        return response.status(400).send({
          message: 'Token não informado',
        })
      }

      if (!body.companies_id) {
        return response.status(400).send({
          message: 'Empresa não informada',
        })
      }

      if (!body.device_name) {
        return response.status(400).send({
          message: 'Nome do dispositivo não informado',
        })
      }

      if (!body.device_identifier) {
        return response.status(400).send({
          message: 'Identificador do dispositivo não informado',
        })
      }

      const tokenDevice = await TokenDevice.query()
        .where('token', body.token)
        .andWhere('company_id', body.companies_id)
        .first()

      if (!tokenDevice) {
        return response.status(404).send({
          message: 'Token não encontrado',
        })
      }

      if (!tokenDevice.active) {
        return response.status(403).send({
          message: 'Token inativo',
        })
      }

      if (tokenDevice.usedAt) {
        return response.status(403).send({
          message: 'Token já utilizado',
        })
      }

      if (tokenDevice.expiresAt < DateTime.now()) {
        return response.status(403).send({
          message: 'Token expirado',
        })
      }

      const alreadyExists = await AuthorizedDevice.query()
        .where('company_id', body.companies_id)
        .andWhere('device_identifier', body.device_identifier)
        .andWhere('active', true)
        .first()

      if (alreadyExists) {
        return response.status(409).send({
          message: 'Dispositivo já cadastrado para esta empresa',
        })
      }

      const device = await AuthorizedDevice.create({
        companyId: body.companies_id,
        userId: body.user_id || null,
        deviceName: body.device_name,
        deviceIdentifier: body.device_identifier,
        active: true,
        lastUsedAt: DateTime.now(),
      })

      tokenDevice.usedAt = DateTime.now()
      tokenDevice.active = false
      await tokenDevice.save()

      return response.status(200).send({
        message: 'Dispositivo registrado com sucesso',
        data: {
          id: device.id,
          company_id: device.companyId,
          user_id: device.userId,
          device_name: device.deviceName,
          device_identifier: device.deviceIdentifier,
        },
      })
    } catch (error) {
      console.log('Erro ao registrar dispositivo:', error)

      return response.status(400).send({
        message: 'Erro ao registrar dispositivo',
        error: error.message || error,
      })
    }
  }
}
