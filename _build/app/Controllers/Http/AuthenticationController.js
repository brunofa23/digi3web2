"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/User"));
const Hash_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Hash"));
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const validations_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/Validations/validations"));
const luxon_1 = require("luxon");
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
            const errorValidation = await new validations_1.default('user_error_205');
            throw new BadRequestException_1.default(errorValidation.messages, errorValidation.status, errorValidation.code);
        }
        if (!(await Hash_1.default.verify(user.password, password))) {
            let errorValidation = await new validations_1.default('user_error_206');
            throw new BadRequestException_1.default(errorValidation.messages, errorValidation.status, errorValidation.code);
        }
        const token = await auth.use('api').generate(user, {
            expiresIn: '30 days',
            name: 'For the CLI app'
        });
        logtail.debug("debug", { token, user });
        logtail.flush();
        return response.status(200).send({ token, user });
    }
    async logout({ auth }) {
        await auth.use('api').revoke();
        return { revoked: true };
    }
    async authorizeAccessImages({ auth, request, response }) {
        const { companies_id, username } = await auth.use('api').authenticate();
        const usernameAutorization = request.input('username');
        const password = request.input('password');
        const accessImage = request.input('accessimage');
        const userAuthorization = await User_1.default
            .query()
            .where('username', usernameAutorization)
            .andWhere('companies_id', '=', companies_id)
            .first();
        if (userAuthorization) {
            if (userAuthorization.permission_level < 5 || !userAuthorization.superuser) {
                const errorValidation = await new validations_1.default('user_error_201');
                throw new BadRequestException_1.default(errorValidation.messages, errorValidation.status, errorValidation.code);
            }
        }
        if (!userAuthorization) {
            const errorValidation = await new validations_1.default('user_error_205');
            throw new BadRequestException_1.default(errorValidation.messages, errorValidation.status, errorValidation.code);
        }
        if (!(await Hash_1.default.verify(userAuthorization.password, String(password)))) {
            let errorValidation = await new validations_1.default('user_error_206');
            throw new BadRequestException_1.default(errorValidation.messages, errorValidation.status, errorValidation.code);
        }
        try {
            const limitDataAccess = luxon_1.DateTime.local().plus(accessImage > 0 ? { days: accessImage } : { minutes: 7 }).toFormat('yyyy-MM-dd HH:mm');
            console.log("ACCESS IMAGE VALOR:", limitDataAccess);
            const user = await User_1.default.query()
                .where('username', username)
                .andWhere('companies_id', '=', companies_id)
                .first();
            if (user) {
                user.access_image = limitDataAccess;
                user.save();
                return response.status(201).send({ valor: true, tempo: accessImage });
            }
        }
        catch (error) {
            throw new BadRequestException_1.default("Erro ao liberar o acesso.", errorValidation.status, errorValidation.code);
        }
    }
}
exports.default = AuthenticationController;
//# sourceMappingURL=AuthenticationController.js.map