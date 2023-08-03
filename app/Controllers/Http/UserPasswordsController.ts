import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import validations from 'App/Services/Validations/validations'
import BadRequest from 'App/Exceptions/BadRequestException'
import { randomBytes } from 'crypto'
import { promisify } from 'util'
import Mail from '@ioc:Adonis/Addons/Mail'

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

        const body = await request.only(User.fillable)
        const user = await User.query().select('users.*').preload('company')
            .innerJoin('companies', 'users.companies_id', 'companies.id')
            .where('username', '=', body.username)
            .where('shortname', '=', body.shortname).first()

        if (user instanceof User && user.email) {

            const random = await promisify(randomBytes)(15)
            const passwordReset = random.toString('hex')
            user.password = passwordReset
            //user.save()
            //Enviar por email
            try {
                await Mail.send((message) => {
                    message.from('no-reply@mgcartorios.com.br')
                        .to(user?.email)
                        .subject('Recuperação de Senha - Digi3')
                        .htmlView('emails/welcome', {
                            company: user.company.name,
                            shortname: user.company.shortname,
                            username: user.username,
                            newPassword: passwordReset
                        })
                })
                console.log("enviado!!!!")

                return user
            } catch (error) {
                return error
            }



        }


        // if (user instanceof User && user.email) {
        //     const random = await promisify(randomBytes)(15)
        //     const passwordReset = random.toString('hex')
        //     user.password = passwordReset
        //     user.save()
        //     console.log("E USUÁRIO E TEM EMAIL...", passwordReset)
        //     //Enviar por email
        //     return passwordReset
        // } else {
        //     console.log("NÃO É", user)
        //     return user


        // }


        // try {
        //     const userUpdated = await user.merge(body).save()
        //     let successValidation = await new validations('user_success_202')
        //     return response.status(201).send(userUpdated, successValidation.code)
        // } catch (error) {
        //     //throw new BadRequest('Bad Request', 401)
        //     console.log("ERRO UPDATE")

        // }


    }




}
