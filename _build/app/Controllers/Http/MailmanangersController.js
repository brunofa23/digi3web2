"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Mail_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Addons/Mail"));
class MailmanangersController {
    async sendMailContactWebsite({ request, response }) {
        const { name, email, phone, body } = request.only(['name', 'email', 'phone', 'body']);
        try {
            const sendmail = await Mail_1.default.send((message) => {
                message.from('no-reply@mgcartorios.com.br')
                    .to("brunofa23@gmail.com")
                    .cc("favatoamaral@gmail.com")
                    .cc("sistemasdigi3@gmail.com")
                    .priority("high")
                    .subject('Formulário de Contato - Digi3')
                    .htmlView('emails/contacts', {
                    name: name,
                    email: email,
                    phone: phone,
                    body: body
                });
            });
            return response.status(201).send(sendmail);
        }
        catch (error) {
            return error;
        }
    }
}
exports.default = MailmanangersController;
//# sourceMappingURL=MailmanangersController.js.map