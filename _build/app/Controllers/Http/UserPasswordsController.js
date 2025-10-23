"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/User"));
const validations_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/Validations/validations"));
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const Mail_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Addons/Mail"));
const Helpers_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Helpers");
class UserPasswordsController {
    async updatePassword({ auth, request, response }) {
        const _auth = await auth.use('api').authenticate();
        const { newPassword } = request.only(['newPassword']);
        const strongPasswordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
        if (strongPasswordRegex.test(newPassword) == false) {
            let errorValidation = await new validations_1.default('user_error_207');
            throw new BadRequestException_1.default(errorValidation.messages, errorValidation.status, errorValidation.code);
        }
        const user = await User_1.default.query()
            .where('username', '=', _auth.username)
            .andWhere('companies_id', '=', _auth.companies_id).first();
        if (user && newPassword) {
            try {
                user.password = newPassword;
                const userUpdated = await user.save();
                let successValidation = await new validations_1.default('user_success_202');
                return response.status(201).send(userUpdated, successValidation.code);
            }
            catch (error) {
                throw new BadRequestException_1.default('Bad Request', 401);
            }
        }
        return response.status(400).send("Erro, verifique o nome da Empresa ou do Usuário.");
    }
    async resetPassword({ request, response }) {
        const body = await request.only(User_1.default.fillable);
        const user = await User_1.default.query().select('users.*').preload('company')
            .innerJoin('companies', 'users.companies_id', 'companies.id')
            .where('username', '=', body.username)
            .where('shortname', '=', body.shortname).first();
        if (user instanceof User_1.default && user.email) {
            try {
                const passwordReset = '#$1A' + Helpers_1.string.generateRandom(32);
                user.password = passwordReset;
                user.save();
                await Mail_1.default.send((message) => {
                    message.from('no-reply@mgcartorios.com.br')
                        .to(user?.email)
                        .subject('Recuperação de Senha - Digi3')
                        .htmlView('emails/welcome', {
                        company: user.company.name,
                        shortname: user.company.shortname,
                        username: user.username,
                        newPassword: passwordReset
                    });
                });
                let successValidation = await new validations_1.default('user_success_203');
                return response.status(201).send({ user: user.name, email: user.email, status: successValidation.code });
            }
            catch (error) {
                return error;
            }
        }
    }
}
exports.default = UserPasswordsController;
//# sourceMappingURL=UserPasswordsController.js.map