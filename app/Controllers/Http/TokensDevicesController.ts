// app/Controllers/Http/TokensDevicesController.ts
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import crypto from 'crypto'
import Env from '@ioc:Adonis/Core/Env'
import { DateTime } from 'luxon'
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from '@simplewebauthn/server'
import { isoBase64URL } from '@simplewebauthn/server/helpers'
import TokenDevice from 'App/Models/TokenDevice'
import AuthorizedDevice from 'App/Models/AuthorizedDevice'
import User from 'App/Models/User'
import Company from 'App/Models/Company'
import WebauthnCredential from 'App/Models/WebauthnCredential'
import WebauthnChallenge from 'App/Models/WebauthnChallenge'
import { verifyPermission } from 'App/Services/util'


export default class TokensDevicesController {
  private releaseTokenPermissiongroupId = 36
  private deviceCookieName = 'digi3_device_token'

  private getWebauthnConfig(request: HttpContextContract['request']) {
    const origin = Env.get('WEBAUTHN_ORIGIN') || request.header('origin') || `${request.protocol()}://${request.host()}`
    const hostname = origin.replace(/^https?:\/\//, '').split('/')[0].split(':')[0]

    return {
      rpName: Env.get('WEBAUTHN_RP_NAME', 'Digi3'),
      rpID: Env.get('WEBAUTHN_RP_ID', hostname),
      origin,
    }
  }

  private hashDeviceCookie(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex')
  }

  private getDeviceCookieOptions() {
    const domain = Env.get('DEVICE_COOKIE_DOMAIN', '')
    const secure = Env.get('DEVICE_COOKIE_SECURE', Env.get('NODE_ENV') === 'production')
    const options: any = {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: '365 days',
    }

    if (domain) {
      options.domain = domain
    }

    return options
  }

  private async setDeviceCookie(response: HttpContextContract['response'], device: AuthorizedDevice) {
    const cookieToken = crypto.randomBytes(32).toString('base64url')

    device.deviceCookieHash = this.hashDeviceCookie(cookieToken)
    device.deviceCookieCreatedAt = DateTime.now()
    device.deviceCookieLastSeenAt = DateTime.now()
    await device.save()

    response.cookie(this.deviceCookieName, cookieToken, this.getDeviceCookieOptions())
  }

  private async validateReleaseToken(token: string, companyId: number) {
    const tokenDevice = await TokenDevice.query()
      .where('token', token)
      .andWhere('company_id', companyId)
      .first()

    if (!tokenDevice || !tokenDevice.active || tokenDevice.usedAt || tokenDevice.expiresAt < DateTime.now()) {
      return null
    }

    return tokenDevice
  }

  public async authorizedDevices({ auth, response }: HttpContextContract) {
    try {
      const user = await auth.use('api').authenticate()
      const permissions = auth.use('api').token?.meta.payload.permissions || []

      if (!verifyPermission(Boolean(user.superuser), permissions, this.releaseTokenPermissiongroupId)) {
        return response.status(403).send({
          message: 'Usuário sem permissão para liberar token de dispositivo',
        })
      }

      const devices = await AuthorizedDevice.query()
        .where('company_id', user.companies_id)
        .orderBy('id', 'desc')

      return response.status(200).send({
        data: devices.map((device) => ({
          id: device.id,
          company_id: device.companyId,
          user_id: device.userId,
          device_name: device.deviceName,
          device_identifier: device.deviceIdentifier,
          has_device_cookie: Boolean(device.deviceCookieHash),
          active: device.active,
          last_used_at: device.lastUsedAt,
          revoked_at: device.revokedAt,
          created_at: device.createdAt,
        })),
      })
    } catch (error) {
      console.log('Erro ao listar dispositivos:', error)

      return response.status(400).send({
        message: 'Erro ao listar dispositivos',
        error: error.message || error,
      })
    }
  }

  public async deactivateDevice({ auth, params, response }: HttpContextContract) {
    try {
      const user = await auth.use('api').authenticate()
      const permissions = auth.use('api').token?.meta.payload.permissions || []

      if (!verifyPermission(Boolean(user.superuser), permissions, this.releaseTokenPermissiongroupId)) {
        return response.status(403).send({
          message: 'Usuário sem permissão para liberar token de dispositivo',
        })
      }

      const device = await AuthorizedDevice.query()
        .where('id', params.id)
        .andWhere('company_id', user.companies_id)
        .first()

      if (!device) {
        return response.status(404).send({
          message: 'Dispositivo não encontrado',
        })
      }

      device.active = false
      device.revokedAt = DateTime.now()
      await device.save()

      return response.status(200).send({
        message: 'Dispositivo revogado com sucesso',
        data: {
          id: device.id,
          active: device.active,
          revoked_at: device.revokedAt,
        },
      })
    } catch (error) {
      console.log('Erro ao revogar dispositivo:', error)

      return response.status(400).send({
        message: 'Erro ao revogar dispositivo',
        error: error.message || error,
      })
    }
  }

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

      const hasPermission = verifyPermission(
        Boolean(user.superuser),
        user.usergroup?.groupxpermission || [],
        this.releaseTokenPermissiongroupId
      )

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
        expiresAt: DateTime.now().plus({ hours: 4 }),
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

      const company = await Company.find(body.companies_id)

      if (!company?.use_device_cookie_control) {
        return response.status(403).send({
          message: 'Controle por cookie seguro não habilitado para esta empresa',
        })
      }

      if (company.use_device_control) {
        return response.status(403).send({
          message: 'Registro deste dispositivo exige WebAuthn',
        })
      }

      const tokenDevice = await this.validateReleaseToken(body.token, body.companies_id)

      if (!tokenDevice) {
        return response.status(403).send({
          message: 'Token inválido ou expirado',
        })
      }

      const cookieToken = crypto.randomBytes(32).toString('base64url')
      const cookieHash = this.hashDeviceCookie(cookieToken)

      const device = await AuthorizedDevice.create({
        companyId: body.companies_id,
        userId: body.user_id || null,
        deviceName: body.device_name,
        deviceIdentifier: `cookie:${cookieHash.slice(0, 48)}`,
        deviceCookieHash: cookieHash,
        deviceCookieCreatedAt: DateTime.now(),
        deviceCookieLastSeenAt: DateTime.now(),
        active: true,
        lastUsedAt: DateTime.now(),
      })

      tokenDevice.usedAt = DateTime.now()
      tokenDevice.active = false
      await tokenDevice.save()

      response.cookie(this.deviceCookieName, cookieToken, this.getDeviceCookieOptions())

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
      console.log('Erro ao registrar dispositivo por cookie:', error)

      return response.status(400).send({
        message: 'Erro ao registrar dispositivo',
        error: error.message || error,
      })
    }
  }

  public async registrationOptions({ request, response }: HttpContextContract) {
    try {
      const body = request.only([
        'token',
        'companies_id',
        'device_name',
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

      const company = await Company.find(body.companies_id)

      if (!company?.use_device_control) {
        return response.status(403).send({
          message: 'Controle WebAuthn não habilitado para esta empresa',
        })
      }

      const tokenDevice = await this.validateReleaseToken(body.token, body.companies_id)

      if (!tokenDevice) {
        return response.status(403).send({
          message: 'Token inválido ou expirado',
        })
      }

      const { rpName, rpID } = this.getWebauthnConfig(request)
      const credentials = await WebauthnCredential.query()
        .select('webauthn_credentials.*')
        .join(
          'authorized_devices',
          'authorized_devices.id',
          'webauthn_credentials.authorized_device_id'
        )
        .where('webauthn_credentials.company_id', body.companies_id)
        .andWhere('authorized_devices.active', true)

      const options = await generateRegistrationOptions({
        rpName,
        rpID,
        userName: `${body.companies_id}:${body.user_id || 'device'}`,
        userDisplayName: body.device_name,
        userID: Buffer.from(String(body.user_id || body.companies_id)),
        timeout: 120000,
        attestationType: 'none',
        excludeCredentials: credentials.map((credential) => ({
          id: credential.credentialId,
        })),
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'preferred',
        },
        preferredAuthenticatorType: 'localDevice',
        supportedAlgorithmIDs: [-7, -257],
      })

      const challenge = await WebauthnChallenge.create({
        companyId: body.companies_id,
        userId: body.user_id || null,
        tokenDeviceId: tokenDevice.id,
        type: 'registration',
        challenge: options.challenge,
        deviceName: body.device_name,
        expiresAt: DateTime.now().plus({ minutes: 60 }),
      })

      return response.status(200).send({
        data: {
          challenge_id: challenge.id,
          options,
        },
      })
    } catch (error) {
      console.log('Erro ao gerar opções WebAuthn:', error)

      return response.status(400).send({
        message: 'Erro ao gerar opções WebAuthn',
        error: error.message || error,
      })
    }
  }

  public async verifyRegistration({ request, response }: HttpContextContract) {
    try {
      const { challenge_id, credential } = request.only(['challenge_id', 'credential'])

      if (!challenge_id || !credential) {
        return response.status(400).send({
          message: 'Cadastro WebAuthn inválido',
        })
      }

      const challenge = await WebauthnChallenge.query()
        .where('id', challenge_id)
        .andWhere('type', 'registration')
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

      const tokenDevice = await TokenDevice.find(challenge.tokenDeviceId)

      if (!tokenDevice || !tokenDevice.active || tokenDevice.usedAt || tokenDevice.expiresAt < DateTime.now()) {
        return response.status(403).send({
          message: 'Token inválido ou expirado',
        })
      }

      const { origin, rpID } = this.getWebauthnConfig(request)
      const verification = await verifyRegistrationResponse({
        response: credential,
        expectedChallenge: challenge.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        requireUserVerification: false,
        supportedAlgorithmIDs: [-7, -257],
      })

      if (!verification.verified) {
        return response.status(403).send({
          message: 'Não foi possível validar este dispositivo',
        })
      }

      const credentialInfo = verification.registrationInfo.credential
      const alreadyExists = await WebauthnCredential.query()
        .where('credential_id', credentialInfo.id)
        .first()

      if (alreadyExists) {
        const existingDevice = await AuthorizedDevice.find(alreadyExists.authorizedDeviceId)

        if (
          alreadyExists.companyId === challenge.companyId &&
          existingDevice &&
          !existingDevice.active
        ) {
          existingDevice.userId = challenge.userId || null
          existingDevice.deviceName = challenge.deviceName || existingDevice.deviceName
          existingDevice.deviceIdentifier = credentialInfo.id
          existingDevice.active = true
          existingDevice.revokedAt = null
          existingDevice.lastUsedAt = DateTime.now()
          await existingDevice.save()

          alreadyExists.userId = challenge.userId || null
          alreadyExists.publicKey = isoBase64URL.fromBuffer(credentialInfo.publicKey)
          alreadyExists.counter = credentialInfo.counter
          alreadyExists.transports = credentialInfo.transports ? JSON.stringify(credentialInfo.transports) : null
          alreadyExists.deviceType = verification.registrationInfo.credentialDeviceType
          alreadyExists.backedUp = verification.registrationInfo.credentialBackedUp
          await alreadyExists.save()

          const company = await Company.find(challenge.companyId)

          if (company?.use_device_cookie_control) {
            await this.setDeviceCookie(response, existingDevice)
          }

          tokenDevice.usedAt = DateTime.now()
          tokenDevice.active = false
          await tokenDevice.save()

          challenge.usedAt = DateTime.now()
          await challenge.save()

          return response.status(200).send({
            message: 'Dispositivo registrado com sucesso',
            data: {
              id: existingDevice.id,
              company_id: existingDevice.companyId,
              user_id: existingDevice.userId,
              device_name: existingDevice.deviceName,
              device_identifier: existingDevice.deviceIdentifier,
            },
          })
        }

        return response.status(409).send({
          message: 'Dispositivo já cadastrado',
        })
      }

      const device = await AuthorizedDevice.create({
        companyId: challenge.companyId,
        userId: challenge.userId || null,
        deviceName: challenge.deviceName || 'Dispositivo autorizado',
        deviceIdentifier: credentialInfo.id,
        active: true,
        lastUsedAt: DateTime.now(),
      })

      await WebauthnCredential.create({
        authorizedDeviceId: device.id,
        companyId: challenge.companyId,
        userId: challenge.userId || null,
        credentialId: credentialInfo.id,
        publicKey: isoBase64URL.fromBuffer(credentialInfo.publicKey),
        counter: credentialInfo.counter,
        transports: credentialInfo.transports ? JSON.stringify(credentialInfo.transports) : null,
        deviceType: verification.registrationInfo.credentialDeviceType,
        backedUp: verification.registrationInfo.credentialBackedUp,
      })

      const company = await Company.find(challenge.companyId)

      if (company?.use_device_cookie_control) {
        await this.setDeviceCookie(response, device)
      }

      tokenDevice.usedAt = DateTime.now()
      tokenDevice.active = false
      await tokenDevice.save()

      challenge.usedAt = DateTime.now()
      await challenge.save()

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
      console.log('Erro ao validar cadastro WebAuthn:', error)

      return response.status(400).send({
        message: error.message || 'Erro ao validar cadastro WebAuthn',
        error: error.message || error,
      })
    }
  }

  public async checkDevice({ request, response }: HttpContextContract) {
    try {
      const { companies_id, device_identifier } = request.only([
        'companies_id',
        'device_identifier',
      ])

      if (!companies_id) {
        return response.status(400).send({
          message: 'Empresa não informada',
        })
      }

      if (!device_identifier) {
        return response.status(400).send({
          message: 'Identificador do dispositivo não informado',
        })
      }

      const device = await AuthorizedDevice.query()
        .where('company_id', companies_id)
        .andWhere('device_identifier', device_identifier)
        .andWhere('active', true)
        .first()

      if (!device) {
        return response.status(403).send({
          message: 'Dispositivo não autorizado para esta empresa',
        })
      }

      device.lastUsedAt = DateTime.now()
      await device.save()

      return response.status(200).send({
        message: 'Dispositivo autorizado',
        data: {
          id: device.id,
          company_id: device.companyId,
          user_id: device.userId,
          device_name: device.deviceName,
          device_identifier: device.deviceIdentifier,
        },
      })
    } catch (error) {
      console.log('Erro ao verificar dispositivo:', error)

      return response.status(400).send({
        message: 'Erro ao verificar dispositivo',
        error: error.message || error,
      })
    }
  }


}
