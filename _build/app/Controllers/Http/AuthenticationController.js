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
const util_1 = global[Symbol.for('ioc.use')]("App/Services/util");
class AuthenticationController {
    async login({ auth, request, response }) {
        const username = request.input('username');
        const shortname = request.input('shortname');
        const password = request.input('password');
        const user = await User_1.default
            .query()
            .preload('company', query => {
            query.select('id', 'name', 'shortname', 'foldername', 'cloud');
        })
            .preload('usergroup', query => {
            query.preload('groupxpermission', query => {
                query.select('usergroup_id', 'permissiongroup_id');
            });
        })
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
        const permissions = user?.$preloaded.usergroup.$preloaded.groupxpermission || {};
        if (!(0, util_1.verifyPermission)(user.superuser, permissions, 31)) {
            const now = luxon_1.DateTime.now().setZone('America/Sao_Paulo');
            const hourNow = now.hour;
            const minuteNow = now.minute;
            const estaNoHorarioPermitido = hourNow >= 7 && (hourNow < 19 || (hourNow === 19 && minuteNow === 0));
            if (!estaNoHorarioPermitido) {
                const errorValidation = await new validations_1.default('user_error_208');
                throw new BadRequestException_1.default(errorValidation.messages, errorValidation.status, errorValidation.code);
            }
        }
        const token = await auth.use('api').generate(user, {
            expiresIn: '7 days',
            name: username,
            payload: {
                permissions: permissions.map(p => ({
                    usergroup_id: p.usergroup_id,
                    permissiongroup_id: p.permissiongroup_id,
                }))
            }
        });
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
        try {
            const user = await User_1.default
                .query()
                .where('username', usernameAutorization)
                .andWhere('companies_id', companies_id)
                .first();
            if (!user) {
                const errorValidation = await new validations_1.default('user_error_205');
                throw new BadRequestException_1.default(errorValidation.messages, errorValidation.status, errorValidation.code);
            }
            const isPasswordValid = await Hash_1.default.verify(user.password, String(password));
            if (!isPasswordValid) {
                const errorValidation = await new validations_1.default('user_error_206');
                throw new BadRequestException_1.default(errorValidation.messages, errorValidation.status, errorValidation.code);
            }
            const hasPermission = await User_1.default
                .query()
                .where('username', usernameAutorization)
                .andWhere('companies_id', companies_id)
                .join('groupxpermissions', 'users.usergroup_id', 'groupxpermissions.usergroup_id')
                .where(query => {
                query.where('groupxpermissions.permissiongroup_id', 30).orWhere('users.superuser', 1);
            })
                .select('users.id')
                .first();
            if (!hasPermission) {
                const errorValidation = await new validations_1.default('user_error_201');
                throw new BadRequestException_1.default(errorValidation.messages, errorValidation.status, errorValidation.code);
            }
            const limitDataAccess = luxon_1.DateTime.local().plus(accessImage > 0 ? { days: accessImage } : { minutes: 7 }).toFormat('yyyy-MM-dd HH:mm');
            const authenticatedUser = await User_1.default
                .query()
                .where('username', username)
                .andWhere('companies_id', companies_id)
                .first();
            if (authenticatedUser) {
                authenticatedUser.access_image = limitDataAccess;
                await authenticatedUser.save();
                return response.status(201).send({ valor: true, tempo: accessImage });
            }
            else {
                throw new BadRequestException_1.default("Usuário autenticado não encontrado.");
            }
        }
        catch (error) {
            console.error("Erro:", error);
            const defaultError = await new validations_1.default('user_error_999');
            return response.badRequest({
                message: error.messages || defaultError.messages,
                code: error.code || defaultError.code,
                status: error.status || 400
            });
        }
    }
}
exports.default = AuthenticationController;
//# sourceMappingURL=AuthenticationController.js.map