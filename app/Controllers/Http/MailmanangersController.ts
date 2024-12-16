import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Mail from '@ioc:Adonis/Addons/Mail'

export default class MailmanangersController {

  public async sendMailContactWebsite({ request,response }: HttpContextContract) {
    const {name, email, phone, body} = request.only(['name', 'email', 'phone', 'body'])
    try {
            //Enviar por email
            const sendmail = await Mail.send((message) => {
                message.from('no-reply@mgcartorios.com.br')
                    .to("cunhavandir@gmail.com")
                    .cc("comercialdigi3@gmail.com")
                    .cc("sistemasdigi3@gmail.com")
                    .priority("high")
                    .subject('Formulário de Contato - Digi3')
                    .htmlView('emails/contacts', {
                        name: name,
                        email: email,
                        phone: phone,
                        body: body
                    })
            })

            return response.status(201).send(sendmail)

        } catch (error) {
            return error
        }


}





}
