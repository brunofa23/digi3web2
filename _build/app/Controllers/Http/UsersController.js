"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/User"));
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const UserValidator_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Validators/UserValidator"));
const validations_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/Validations/validations"));
class UsersController {
    async index({ auth, response }) {
        const authenticate = await auth.use('api').authenticate();
        let query = ` companies_id=${authenticate.companies_id}`;
        if (authenticate.superuser)
            query = "";
        const data = await User_1.default.query()
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
            .andWhere('id', "=", params.id).firstOrFail();
        return response.status(200).send(data);
    }
    async store({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const body = await request.validate(UserValidator_1.default);
        const userByName = await User_1.default.query()
            .where('username', '=', body.username)
            .andWhere('companies_id', '=', body.companies_id).first();
        if (userByName) {
            let errorValidation = await new validations_1.default().validations('user_103');
            throw new BadRequestException_1.default(errorValidation.messages, errorValidation.status, errorValidation.code);
        }
        if (!authenticate.superuser) {
            body.companies_id = authenticate.companies_id;
        }
        try {
            const data = await User_1.default.create(body);
            response.status(201).send(data);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401);
        }
    }
    async update({ auth, request, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const body = await request.validate(UserValidator_1.default);
        body.companies_id = authenticate.companies_id;
        body.id = params.id;
        try {
            await User_1.default.query()
                .where("companies_id", "=", authenticate.companies_id)
                .andWhere('id', "=", params.id).update(body);
            return response.status(201).send(body);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401);
        }
    }
}
exports.default = UsersController;
//# sourceMappingURL=UsersController.js.map