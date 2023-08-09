import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import validations from 'App/Services/Validations/validations'
import BadRequest from 'App/Exceptions/BadRequestException'
import { randomBytes } from 'crypto'
import { promisify } from 'util'
import Mail from '@ioc:Adonis/Addons/Mail'

export default class UserPasswordsController {


    public async updatePassword({ auth, request, params, response }: HttpContextContract) {

        const _auth = await auth.use('api').authenticate()
        const { password, newPassword } = request.only(['password', 'newPassword'])

        console.log("UPDATE PASSWORD...", request.only(['password', 'newPassword']))

        //const body = request.only(User.fillable) //await request.validate(UserValidator)
        const user = await User.query()
            .where('username', '=', _auth.username)
            .andWhere('companies_id', '=', _auth.companies_id).first()

        ///fazer a comparação das senhas::::::
        console.log("USER", user?.password)


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

        console.log("reset Acionado!!!")
        const body = await request.only(User.fillable)
        const user = await User.query().select('users.*').preload('company')
            .innerJoin('companies', 'users.companies_id', 'companies.id')
            .where('username', '=', body.username)
            .where('shortname', '=', body.shortname).first()

        if (user instanceof User && user.email) {

            try {
                const random = await promisify(randomBytes)(15)
                const passwordReset = random.toString('hex')
                user.password = passwordReset
                user.save()
                //Enviar por email
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
                let successValidation = await new validations('user_success_203')
                return response.status(201).send({ user: user.name, email: user.email, status: successValidation.code })

            } catch (error) {
                return error
            }
        }

    }




}
