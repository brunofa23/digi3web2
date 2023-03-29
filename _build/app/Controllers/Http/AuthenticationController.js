"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/User"));
const Hash_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Hash"));
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const validations_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/Validations/validations"));
const { Logtail } = require("@logtail/node");
const logtail = new Logtail("2QyWC3ehQAWeC6343xpMSjTQ");
class AuthenticationController {
    async login({ auth, request, response }) {
        const username = request.input('username');
        const shortname = request.input('shortname');
        const password = request.input('password');
        const user = await User_1.default
            .query()
            .preload('company')
            .where('username', username)
            .whereHas('company', builder => {
            builder.where('shortname', shortname);
        })
            .first();
        if (!user) {
            let errorValidation = await new validations_1.default().validations('user_error_104');
            throw new BadRequestException_1.default(errorValidation.messages, errorValidation.status, errorValidation.code);
        }
        if (!(await Hash_1.default.verify(user.password, password))) {
            let errorValidation = await new validations_1.default().validations('user_error_105');
            throw new BadRequestException_1.default(errorValidation.messages, errorValidation.status, errorValidation.code);
        }
        const token = await auth.use('api').generate(user, {
            expiresIn: '30 days',
            name: 'For the CLI app'
        });
        console.log(">>>Fez login...", { token });
        logtail.debug("debug", { token, user });
        logtail.flush();
        return response.status(200).send({ token, user });
    }
    async logout({ auth }) {
        await auth.use('api').revoke();
        return { revoked: true };
    }
}
exports.default = AuthenticationController;
//# sourceMappingURL=AuthenticationController.js.map