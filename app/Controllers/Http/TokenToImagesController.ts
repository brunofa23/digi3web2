import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Tokentoimage from 'App/Models/Tokentoimage'

export default class TokenToImagesController {
  public async index({auth, response}: HttpContextContract) {
    const data = await Tokentoimage.all()
    return response.status(200).send(data)
  }

  public async store({auth, response,request}: HttpContextContract) {
     console.log("create tokens....")

    //  if (!authenticate.superuser) {
    //   let errorValidation = await new validations('company_error_100')
    //   throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
    // }

     const body = await request.only(Tokentoimage.fillable)
     const data = await Tokentoimage.create(body)
     return response.status(201).send(data)

  }



  public async verifyTokenToImages({auth, response, request}: HttpContextContract) {
    const body = await request.only(Tokentoimage.fillable)
    console.log("verifyTokenToImages tokens....", body.token)
    const data = await Tokentoimage.query()
    .where('companies_id',body.companies_id)
    .andWhere('token', body.token).first()
    return response.status(200).send(data)
  }

  // public async show({auth, response, request}: HttpContextContract) {}
  //public async update({}: HttpContextContract) {}
  //public async destroy({}: HttpContextContract) {}
}
