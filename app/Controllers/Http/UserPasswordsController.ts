import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import validations from 'App/Services/Validations/validations'
import BadRequest from 'App/Exceptions/BadRequestException'

export default class UserPasswordsController {


    public async updatePassword({ auth, request, params, response }: HttpContextContract) {

        await auth.use('api').authenticate()
        const body = request.only(User.fillable) //await request.validate(UserValidator)
        const user = await User.query()
            .where('username', '=', body.username)
            .andWhere('companies_id', '=', body.companies_id).first()

        if (user && user.password) {
            user.password = body.password
            try {
                const userUpdated = await user.merge(body).save()
                let successValidation = await new validations('user_success_202')
                return response.status(201).send(userUpdated, successValidation.code)
            } catch (error) {
                throw new BadRequest('Bad Request', 401)

            }
        } return response.status(400).send("Erro, verifique o nome da Empresa ou do Usuário.")
        //throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
    }


    public async resetPassword({ auth, request, params, response }: HttpContextContract) {

        //await auth.use('api').authenticate()
        const body = request.only(User.fillable) //await request.validate(UserValidator)
        const user = await User.query()
            .where('username', '=', body.username)
            .andWhere('name', '=', body.name).first()

        if (user && user.email)
            user.password = body.password
        try {
            const userUpdated = await user.merge(body).save()
            let successValidation = await new validations('user_success_202')
            return response.status(201).send(userUpdated, successValidation.code)
        } catch (error) {
            //throw new BadRequest('Bad Request', 401)
            console.log("ERRO UPDATE")

        }


    }




}
