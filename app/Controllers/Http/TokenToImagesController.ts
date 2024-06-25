import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Tokentoimage from 'App/Models/Tokentoimage'
import User from 'App/Models/User'
import Hash from '@ioc:Adonis/Core/Hash'
import BadRequest from 'App/Exceptions/BadRequestException'
import validations from 'App/Services/Validations/validations'

export default class TokenToImagesController {
  public async index({ auth, response }: HttpContextContract) {
    const data = await Tokentoimage.all()
    return response.status(200).send(data)
  }

  public async store({ auth, response, request }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const body = request.only(User.fillable)
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
      const verifyTokenExist = await Tokentoimage.query()
      .where('token', body.token)
      .andWhere('companies_id', authenticate.companies_id).first()
      if(verifyTokenExist)
        return response.status(200).send(verifyTokenExist)
      const tokenToImages = await Tokentoimage
        .create({ companies_id: authenticate.companies_id, users_id: user.id, token: body.token })
      console.log("....passei aqui",tokenToImages)
      return response.status(201).send(tokenToImages)

  }

  public async verifyTokenToImages({ auth, response, request }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const body = await request.only(Tokentoimage.fillable)
    console.log("verifyTokenToImages tokens....", body.token)
    const data = await Tokentoimage.query()
      .where('companies_id', authenticate.companies_id)
      .andWhere('token', body.token).first()
    return response.status(200).send(data)
  }

  // public async show({auth, response, request}: HttpContextContract) {}
  //public async update({}: HttpContextContract) {}
  //public async destroy({}: HttpContextContract) {}
}
