"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const Company_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Company"));
const validations_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/Validations/validations"));
const CompanyValidator_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Validators/CompanyValidator"));
const googledrive_1 = global[Symbol.for('ioc.use')]("App/Services/googleDrive/googledrive");
class CompaniesController {
    async index({ auth, response, request }) {
        const authenticate = await auth.use('api').authenticate();
        if (!authenticate.superuser) {
            let errorValidation = await new validations_1.default('company_error_100');
            throw new BadRequestException_1.default(errorValidation.messages, errorValidation.status, errorValidation.code);
        }
        const { status } = request.only(['status']);
        let query = " 1=1 ";
        if (status)
            query += ` and status=${status} `;
        try {
            const data = await Company_1.default
                .query()
                .preload('typebooks')
                .whereRaw(query);
            return response.status(200).send(data);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401, 'erro');
        }
    }
    async store({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        if (!authenticate.superuser) {
            let errorValidation = await new validations_1.default('company_error_100');
            throw new BadRequestException_1.default(errorValidation.messages, errorValidation.status, errorValidation.code);
        }
        const body = await request.validate(CompanyValidator_1.default);
        const companyByName = await Company_1.default.findBy('name', body.name);
        if (companyByName) {
            let errorValidation = await new validations_1.default('company_error_101');
            throw new BadRequestException_1.default(errorValidation['messages'], errorValidation.status, errorValidation.code);
        }
        const companyByShortname = await Company_1.default.findBy('shortname', body.shortname);
        if (companyByShortname) {
            let errorValidation = await new validations_1.default('company_error_102');
            throw new BadRequestException_1.default(errorValidation.messages, errorValidation.status, errorValidation.code);
        }
        try {
            const data = await Company_1.default.create(body);
            let parent = await (0, googledrive_1.sendSearchOrCreateFolder)(data.foldername, data.cloud);
            let successValidation = await new validations_1.default('company_success_100');
            return response.status(201).send({ data, idfoder: parent, successValidation: successValidation.code });
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401);
        }
    }
    async show({ params, response }) {
        const data = await Company_1.default.find(params.id);
        return response.send(data);
    }
    async update({ auth, request, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        if (!authenticate.superuser) {
            let errorValidation = await new validations_1.default('company_error_100');
            throw new BadRequestException_1.default(errorValidation.messages, errorValidation.status, errorValidation.code);
        }
        const body = await request.validate(CompanyValidator_1.default);
        try {
            body['id'] = params.id;
            const data = await Company_1.default.findOrFail(body.id);
            body.foldername = data.foldername;
            await data.fill(body).save();
            let successValidation = await new validations_1.default('company_success_101');
            return response.status(201).send({
                data,
                params: params.id,
                successValidation: successValidation.code
            });
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request update', 401, 'company_error_102');
        }
    }
}
exports.default = CompaniesController;
//# sourceMappingURL=CompaniesController.js.map