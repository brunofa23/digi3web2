import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Tokentoimage from 'App/Models/Tokentoimage'
import User from 'App/Models/User'
import Hash from '@ioc:Adonis/Core/Hash'
import BadRequest from 'App/Exceptions/BadRequestException'
import validations from 'App/Services/Validations/validations'
import crypto from 'crypto'
import Env from '@ioc:Adonis/Core/Env'
import { DateTime } from 'luxon'

export default class TokenToImagesController {
  private imageDeviceCookieName = 'digi3_image_device_token'

  private hashImageDeviceCookie(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex')
  }

  private getImageDeviceCookieOptions() {
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

  private async findImageDeviceByCookie(
    request: HttpContextContract['request'],
    companyId: number,
    userId: number
  ) {
    const cookieToken = request.plainCookie(this.imageDeviceCookieName, null, true)

    if (!cookieToken) {
      return null
    }

    const data = await Tokentoimage.query()
      .where('companies_id', companyId)
      .andWhere('users_id', userId)
      .andWhere('token', this.hashImageDeviceCookie(cookieToken))
      .first()

    if (!data?.expires_at || data.expires_at < DateTime.now()) {
      return null
    }

    return data
  }

  private async setImageDeviceCookie(response: HttpContextContract['response'], companyId: number, userId: number) {
    const cookieToken = crypto.randomBytes(32).toString('base64url')
    const cookieHash = this.hashImageDeviceCookie(cookieToken)
    const expiresAt = DateTime.now().plus({ days: 365 })
    const tokenToImages = await Tokentoimage.create({
      companies_id: companyId,
      users_id: userId,
      token: cookieHash,
      expires_at: expiresAt,
    })

    response.plainCookie(this.imageDeviceCookieName, cookieToken, this.getImageDeviceCookieOptions())

    return tokenToImages
  }

  private serializeImageDevice(device: Tokentoimage) {
    return {
      id: device.id,
      companies_id: device.companies_id,
      users_id: device.users_id,
      expires_at: device.expires_at,
      confirmed: true,
    }
  }

  public async index({ auth, response }: HttpContextContract) {
    const data = await Tokentoimage.all()
    return response.status(200).send(data)
  }

  public async store({ auth, response, request }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const body = request.only(User.fillable)
    const accessImage = Number(request.input('accessimage'))
    const accessImageDays = Number.isFinite(accessImage) ? accessImage : -1
    const user = await User.query().where('username', body.username)
      .andWhere('companies_id', authenticate.companies_id)
      .first()
    if (!user) {
      const errorValidation = await new validations('user_error_205')
      throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
    }
    // Verify password
    if (!(await Hash.verify(user.password, body.password))) {
      let errorValidation = await new validations('user_error_206')
      throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
    }
    //validar se login e senha informado possui permissão para liberar
    const hasPermission = await User
      .query()
      .where('username', body.username)
      .andWhere('companies_id', authenticate.companies_id)
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

    const tokenToImages = await this.setImageDeviceCookie(response, authenticate.companies_id, authenticate.id)
    const limitDataAccess = DateTime.local()
      .plus(accessImageDays > 0 ? { days: accessImageDays } : { minutes: 7 })
      .toFormat('yyyy-MM-dd HH:mm')

    ;(authenticate as any).access_image = limitDataAccess
    await authenticate.save()

    return response.status(201).send({
      ...this.serializeImageDevice(tokenToImages),
      confirmed: true,
      access_image: limitDataAccess,
    })

  }

  public async verifyTokenToImages({ auth, response, request }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const data = await this.findImageDeviceByCookie(request, authenticate.companies_id, authenticate.id)
    return response.status(200).send(data ? this.serializeImageDevice(data) : null)
  }

  // public async show({auth, response, request}: HttpContextContract) {}
  //public async update({}: HttpContextContract) {}
  //public async destroy({}: HttpContextContract) {}
}
