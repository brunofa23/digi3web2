import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import Hash from '@ioc:Adonis/Core/Hash'
import Env from '@ioc:Adonis/Core/Env'
import BadRequest from 'App/Exceptions/BadRequestException'
import validations from 'App/Services/Validations/validations'
import { DateTime } from 'luxon'
import { verifyPermission } from 'App/Services/util'
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server'
import { isoBase64URL } from '@simplewebauthn/server/helpers'

import AuthorizedDevice from 'App/Models/AuthorizedDevice'
import WebauthnCredential from 'App/Models/WebauthnCredential'
import WebauthnChallenge from 'App/Models/WebauthnChallenge'


//import Groupxpermission from 'App/Models/Groupxpermission'
//teste

export default class AuthenticationController {
  private getWebauthnConfig(request: HttpContextContract['request']) {
    const origin = Env.get('WEBAUTHN_ORIGIN') || request.header('origin') || `${request.protocol()}://${request.host()}`
    const hostname = origin.replace(/^https?:\/\//, '').split('/')[0].split(':')[0]

    return {
      rpID: Env.get('WEBAUTHN_RP_ID', hostname),
      origin,
    }
  }

  private async generateToken(auth: HttpContextContract['auth'], user: User, permissions: any, username: string) {
    return auth.use('api').generate(user, {
      expiresIn: '7 days',
      name: username,
      payload: {
        permissions: permissions.map(p => ({
          usergroup_id: p.usergroup_id,
          permissiongroup_id: p.permissiongroup_id,
        }))
      }
    })
  }

  public async login({ auth, request, response }: HttpContextContract) {

    const username = request.input('username')
    const shortname = request.input('shortname')
    const password = request.input('password')

    const user = await User
      .query()
      .preload('company', query => {
        query.select(
          'id',
          'name',
          'shortname',
          'foldername',
          'cloud',
          'responsablename',
          'use_device_control'
        )
      })
      .preload('usergroup', query => {
        query.preload('groupxpermission', query => {
          query.select('usergroup_id', 'permissiongroup_id')
        })
      })
      .where('username', username)
      .whereHas('company', builder => {
        builder.where('shortname', shortname)
      })
      .first()

    if (!user) {
      const errorValidation: any = await new validations('user_error_205')
      throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
    }

    // Verify password
    if (!(await Hash.verify(user.password, password))) {
      let errorValidation: any = await new validations('user_error_206')
      throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
    }

    const permissions = (user as any)?.$preloaded.usergroup.$preloaded.groupxpermission || []

    // VERIFICAR HORARIO DISPONÍVEL
    if (!verifyPermission(Boolean(user.superuser), permissions, 31)) {

      const now = DateTime.now().setZone('America/Sao_Paulo');
      const hourNow = now.hour
      const minuteNow = now.minute
      const estaNoHorarioPermitido = hourNow >= 7 && (hourNow < 19 || (hourNow === 19 && minuteNow === 0));

      if (!estaNoHorarioPermitido) {
        const errorValidation: any = await new validations('user_error_208')
        throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
      }
    }

    // VERIFICAR DISPOSITIVO AUTORIZADO
    if (user.company?.use_device_control) {
      const credentials = await WebauthnCredential
        .query()
        .select('webauthn_credentials.*')
        .join(
          'authorized_devices',
          'authorized_devices.id',
          'webauthn_credentials.authorized_device_id'
        )
        .where('webauthn_credentials.company_id', user.companies_id)
        .andWhere('authorized_devices.active', true)

      if (!credentials.length) {
        return response.status(403).send({
          code: 'device_error_002',
          message: 'Dispositivo não autorizado para esta empresa',
          status: 403,
          data: {
            company_id: user.companies_id,
            user_id: user.id,
          },
        })
      }

      const { rpID } = this.getWebauthnConfig(request)
      const options = await generateAuthenticationOptions({
        rpID,
        allowCredentials: credentials.map((credential) => ({
          id: credential.credentialId,
        })),
        timeout: 120000,
        userVerification: 'preferred',
      })

      const challenge = await WebauthnChallenge.create({
        companyId: user.companies_id,
        userId: user.id,
        type: 'authentication',
        challenge: options.challenge,
        expiresAt: DateTime.now().plus({ minutes: 5 }),
      })

      return response.status(403).send({
        code: 'device_webauthn_required',
        message: 'Confirme este dispositivo',
        status: 403,
        data: {
          company_id: user.companies_id,
          user_id: user.id,
          challenge_id: challenge.id,
          options,
        },
      })
    }

    const token = await this.generateToken(auth, user, permissions, username)

    return response.status(200).send({ token, user })
  }

  public async verifyWebauthnLogin({ auth, request, response }: HttpContextContract) {
    try {
      const { challenge_id, credential } = request.only(['challenge_id', 'credential'])

      if (!challenge_id || !credential) {
        return response.status(400).send({
          message: 'Autenticação WebAuthn inválida',
        })
      }

      const challenge = await WebauthnChallenge.query()
        .where('id', challenge_id)
        .andWhere('type', 'authentication')
        .first()

      if (!challenge || challenge.usedAt) {
        return response.status(403).send({
          message: 'Desafio WebAuthn inválido',
        })
      }

      if (challenge.expiresAt < DateTime.now()) {
        return response.status(403).send({
          message: 'Desafio WebAuthn expirado',
        })
      }

      if (!challenge.userId) {
        return response.status(403).send({
          message: 'Desafio WebAuthn inválido',
        })
      }

      const credentialRecord = await WebauthnCredential.query()
        .where('credential_id', credential.id)
        .andWhere('company_id', challenge.companyId)
        .first()

      if (!credentialRecord) {
        return response.status(403).send({
          message: 'Dispositivo não autorizado para esta empresa',
        })
      }

      const authorizedDevice = await AuthorizedDevice.query()
        .where('id', credentialRecord.authorizedDeviceId)
        .andWhere('company_id', challenge.companyId)
        .andWhere('active', true)
        .first()

      if (!authorizedDevice) {
        return response.status(403).send({
          message: 'Dispositivo não autorizado para esta empresa',
        })
      }

      const { origin, rpID } = this.getWebauthnConfig(request)
      const verification = await verifyAuthenticationResponse({
        response: credential,
        expectedChallenge: challenge.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: {
          id: credentialRecord.credentialId,
          publicKey: isoBase64URL.toBuffer(credentialRecord.publicKey),
          counter: credentialRecord.counter,
        },
        requireUserVerification: false,
      })

      if (!verification.verified) {
        return response.status(403).send({
          message: 'Não foi possível confirmar este dispositivo',
        })
      }

      const user = await User
        .query()
        .preload('company', query => {
          query.select(
            'id',
            'name',
            'shortname',
            'foldername',
            'cloud',
            'responsablename',
            'use_device_control'
          )
        })
        .preload('usergroup', query => {
          query.preload('groupxpermission', query => {
            query.select('usergroup_id', 'permissiongroup_id')
          })
        })
        .where('id', challenge.userId)
        .first()

      if (!user) {
        return response.status(404).send({
          message: 'Usuário não encontrado',
        })
      }

      const permissions = (user as any)?.$preloaded.usergroup.$preloaded.groupxpermission || []
      const token = await this.generateToken(auth, user, permissions, user.username)

      credentialRecord.counter = verification.authenticationInfo.newCounter
      await credentialRecord.save()

      authorizedDevice.lastUsedAt = DateTime.now()
      await authorizedDevice.save()

      challenge.usedAt = DateTime.now()
      await challenge.save()

      return response.status(200).send({ token, user })
    } catch (error) {
      console.log('Erro ao validar login WebAuthn:', error)

      return response.status(400).send({
        message: error.message || 'Erro ao validar login WebAuthn',
        error: error.message || error,
      })
    }
  }

  public async logout({ auth }: HttpContextContract) {

    await auth.use('api').revoke()
    return { revoked: true }

  }

  public async authorizeAccessImages({ auth, request, response }) {
    const { companies_id, username } = await auth.use('api').authenticate()
    const usernameAutorization = request.input('username')
    const password = request.input('password')
    const accessImage = request.input('accessimage')

    try {
      // 1. Buscar o usuário que está sendo autorizado
      const user = await User
        .query()
        .where('username', usernameAutorization)
        .andWhere('companies_id', companies_id)
        .first()

      if (!user) {
        const errorValidation: any = await new validations('user_error_205')
        throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
      }

      // 2. Verificar a senha do usuário
      const isPasswordValid = await Hash.verify(user.password, String(password))
      if (!isPasswordValid) {
        const errorValidation: any = await new validations('user_error_206')
        throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
      }

      // 3. Verificar autorização (permGroup 30 ou superuser = 1)
      const hasPermission = await User
        .query()
        .where('username', usernameAutorization)
        .andWhere('companies_id', companies_id)
        .join('groupxpermissions', 'users.usergroup_id', 'groupxpermissions.usergroup_id')
        .where(query => {
          query.where('groupxpermissions.permissiongroup_id', 30).orWhere('users.superuser', 1)
        })
        .select('users.id')
        .first()

      if (!hasPermission) {
        const errorValidation: any = await new validations('user_error_201')
        throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
      }

      // 4. Atualizar o acesso à imagem do usuário autenticado
      const limitDataAccess = DateTime.local().plus(accessImage > 0 ? { days: accessImage } : { minutes: 7 }).toFormat('yyyy-MM-dd HH:mm')

      const authenticatedUser = await User
        .query()
        .where('username', username)
        .andWhere('companies_id', companies_id)
        .first()

      if (authenticatedUser) {
        ;(authenticatedUser as any).access_image = limitDataAccess
        await authenticatedUser.save()
        return response.status(201).send({ valor: true, tempo: accessImage })
      } else {
        throw new BadRequest("Usuário autenticado não encontrado.")
      }

    } catch (error) {
      console.error("Erro:", error)
      const defaultError: any = await new validations('user_error_999') // erro genérico se quiser
      return response.badRequest({
        message: error.messages || defaultError.messages,
        code: error.code || defaultError.code,
        status: error.status || 400
      })
    }
  }


}
