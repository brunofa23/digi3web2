"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Tokentoimage_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Tokentoimage"));
const User_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/User"));
const Hash_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Hash"));
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const validations_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/Validations/validations"));
class TokenToImagesController {
    async index({ auth, response }) {
        const data = await Tokentoimage_1.default.all();
        return response.status(200).send(data);
    }
    async store({ auth, response, request }) {
        const authenticate = await auth.use('api').authenticate();
        const body = request.only(User_1.default.fillable);
        const user = await User_1.default.query().where('username', body.username)
            .andWhere('companies_id', authenticate.companies_id)
            .first();
        if (!user) {
            const errorValidation = await new validations_1.default('user_error_205');
            throw new BadRequestException_1.default(errorValidation.messages, errorValidation.status, errorValidation.code);
        }
        if (!(await Hash_1.default.verify(user.password, body.password))) {
            let errorValidation = await new validations_1.default('user_error_206');
            throw new BadRequestException_1.default(errorValidation.messages, errorValidation.status, errorValidation.code);
        }
        const verifyTokenExist = await Tokentoimage_1.default.query()
            .where('token', body.token)
            .andWhere('companies_id', authenticate.companies_id).first();
        if (verifyTokenExist)
            return response.status(200).send(verifyTokenExist);
        const tokenToImages = await Tokentoimage_1.default
            .create({ companies_id: authenticate.companies_id, users_id: user.id, token: body.token });
        return response.status(201).send(tokenToImages);
    }
    async verifyTokenToImages({ auth, response, request }) {
        const authenticate = await auth.use('api').authenticate();
        const body = await request.only(Tokentoimage_1.default.fillable);
        const data = await Tokentoimage_1.default.query()
            .where('companies_id', authenticate.companies_id)
            .andWhere('token', body.token).first();
        return response.status(200).send(data);
    }
}
exports.default = TokenToImagesController;
//# sourceMappingURL=TokenToImagesController.js.map