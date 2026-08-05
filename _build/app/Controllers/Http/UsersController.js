"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/User"));
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const validations_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/Validations/validations"));
const UserValidator_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Validators/UserValidator"));
const luxon_1 = require("luxon");
class UsersController {
    parseAccessImageDate(accessImage) {
        if (luxon_1.DateTime.isDateTime(accessImage)) {
            return accessImage;
        }
        if (accessImage instanceof Date) {
            return luxon_1.DateTime.fromJSDate(accessImage);
        }
        const accessImageText = String(accessImage);
        const accessImageSql = luxon_1.DateTime.fromSQL(accessImageText);
        return accessImageSql.isValid ? accessImageSql : luxon_1.DateTime.fromISO(accessImageText);
    }
    async index({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const { companies_id, findCompany, findUser } = request.only(['companies_id', 'findCompany', 'findUser']);
        try {
            const query = User_1.default.query()
                .preload('company');
            if (authenticate.superuser) {
                if (findCompany)
                    query.where('companies_id', findCompany);
                else if (companies_id)
                    query.where('companies_id', companies_id);
                else
                    query.where('companies_id', authenticate.companies_id);
            }
            else {
                query.where('companies_id', authenticate.companies_id);
            }
            if (findUser)
                query.where('username', 'like', `%${findUser}%`);
            const data = await query;
            return response.status(200).send(data);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401, error);
        }
    }
    async show({ auth, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const query = User_1.default.query().where('id', params.id)
            .preload('usergroup', query => {
            query.preload('groupxpermission', subQuery => {
                subQuery.select('permissiongroup_id');
            });
        });
        query.if(!authenticate.superuser, query => {
            query.where('companies_id', authenticate.companies_id);
        });
        const data = await query.first();
        return response.status(200).send(data);
    }
    async store({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const body = await request.validate(UserValidator_1.default);
        body.permission_level = 1;
        const userByName = await User_1.default.query()
            .where('username', '=', body.username)
            .andWhere('companies_id', '=', body.companies_id).first();
        if (userByName) {
            let errorValidation = await new validations_1.default('user_error_203');
            throw new BadRequestException_1.default(errorValidation.messages, errorValidation.status, errorValidation.code);
        }
        if (body.email) {
            const userByEmail = await User_1.default.findBy('email', body.email);
            if (userByEmail) {
                let errorValidation = await new validations_1.default('user_error_209');
                throw new BadRequestException_1.default(errorValidation.messages, errorValidation.status, errorValidation.code);
            }
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
    async update({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const body = await request.validate(UserValidator_1.default);
        body.id = request.param('id');
        const user = await User_1.default.findOrFail(body.id);
        if (!authenticate.superuser) {
            body.companies_id = authenticate.companies_id;
        }
        if (body.email && body.email !== user.email) {
            const userByEmail = await User_1.default.query()
                .where('email', body.email)
                .andWhereNot('id', body.id)
                .first();
            if (userByEmail) {
                let errorValidation = await new validations_1.default('user_error_209');
                throw new BadRequestException_1.default(errorValidation.messages, errorValidation.status, errorValidation.code);
            }
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
    async accessImage({ auth, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const data = await User_1.default.query()
            .where('companies_id', authenticate.companies_id)
            .andWhere('id', params.id).first();
        if (data?.access_image == undefined || data?.access_image == null) {
            return response.status(200).send(false);
        }
        const dataaccess = this.parseAccessImageDate(data?.access_image);
        const dateNow = luxon_1.DateTime.now();
        if (dataaccess.isValid && dataaccess >= dateNow) {
            return response.status(200).send(true);
        }
        else {
            return response.status(200).send(false);
        }
    }
    async closeAccesImage({ auth, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const accessImageClosed = '2000-01-01 00:00';
        const data = await User_1.default.query()
            .where('companies_id', authenticate.companies_id)
            .where('id', params.id)
            .update({ 'access_image': accessImageClosed });
        return response.status(201).send({ valor: false, access_image: accessImageClosed, affectedRows: data });
    }
}
exports.default = UsersController;
//# sourceMappingURL=UsersController.js.map