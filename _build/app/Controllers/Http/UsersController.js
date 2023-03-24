"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/User"));
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const UserValidator_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Validators/UserValidator"));
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
        if (userByName)
            throw new BadRequestException_1.default('Username already in use', 402);
        if (!authenticate.superuser) {
            body.companies_id = authenticate.companies_id;
        }
        const data = await User_1.default.create(body);
        response.status(201).send(data);
    }
    async update({ auth, request, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const body = await request.validate(UserValidator_1.default);
        body.companies_id = authenticate.companies_id;
        body.id = params.id;
        await User_1.default.query()
            .where("companies_id", "=", authenticate.companies_id)
            .andWhere('id', "=", params.id).update(body);
        return response.status(201).send(body);
    }
}
exports.default = UsersController;
//# sourceMappingURL=UsersController.js.map