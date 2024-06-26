"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/User"));
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const validations_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/Validations/validations"));
const UserValidator_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Validators/UserValidator"));
class UsersController {
    async index({ auth, response }) {
        const authenticate = await auth.use('api').authenticate();
        let query = ` companies_id=${authenticate.companies_id}`;
        if (authenticate.superuser)
            query = "";
        const data = await User_1.default.query()
            .preload('company')
            .whereRaw(query);
        return response.status(200).send(data);
    }
    async show({ auth, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        let query = "";
        if (!authenticate.superuser)
            query = ` companies_id=${authenticate.companies_id} `;
        const data = await User_1.default.query()
            .whereRaw(query)
            .andWhere('id', "=", params.id).first();
        return response.status(200).send(data);
    }
    async store({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const body = await request.validate(UserValidator_1.default);
        const userByName = await User_1.default.query()
            .where('username', '=', body.username)
            .andWhere('companies_id', '=', body.companies_id).first();
        if (userByName) {
            let errorValidation = await new validations_1.default('user_error_203');
            throw new BadRequestException_1.default(errorValidation.messages, errorValidation.status, errorValidation.code);
        }
        if (!authenticate.superuser) {
            body.companies_id = authenticate.companies_id;
        }
        try {
            const data = await User_1.default.create(body);
            let successValidation = await new validations_1.default('user_success_100');
            response.status(201).send(data, successValidation.code);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401, error);
        }
    }
    async update({ auth, request, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const body = await request.validate(UserValidator_1.default);
        body.id = request.param('id');
        const user = await User_1.default.findOrFail(body.id);
        if (!authenticate.superuser) {
            body.companies_id = authenticate.companies_id;
        }
        try {
            const userUpdated = await user.merge(body).save();
            let successValidation = await new validations_1.default('user_success_201');
            return response.status(201).send(userUpdated, successValidation.code);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401, error);
        }
    }
}
exports.default = UsersController;
//# sourceMappingURL=UsersController.js.map