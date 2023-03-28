"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const Company_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Company"));
const CompanyValidator_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Validators/CompanyValidator"));
const authorize = global[Symbol.for('ioc.use')]('App/Services/googleDrive/googledrive');
class CompaniesController {
    async index({ auth, response }) {
        const authenticate = await auth.use('api').authenticate();
        if (!authenticate.superuser)
            throw new BadRequestException_1.default('not superuser', 401);
        const data = await Company_1.default
            .query()
            .preload('typebooks');
        return response.status(200).send(data);
    }
    async store({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        if (!authenticate.superuser)
            throw new BadRequestException_1.default('not superuser', 401);
        const body = await request.validate(CompanyValidator_1.default);
        const companyByName = await Company_1.default.findBy('name', body.name);
        if (companyByName)
            throw new BadRequestException_1.default('name already in use', 402);
        const companyByShortname = await Company_1.default.findBy('shortname', body.shortname);
        if (companyByShortname)
            throw new BadRequestException_1.default('shortname already in use', 402, '150');
        try {
            const data = await Company_1.default.create(body);
            let parent = await authorize.sendSearchOrCreateFolder(data.foldername);
            return response.status(201).send({
                data,
                idfoder: parent
            });
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
        if (!authenticate.superuser)
            throw new BadRequestException_1.default('not superuser', 401);
        const body = await request.validate(CompanyValidator_1.default);
        body['id'] = params.id;
        const data = await Company_1.default.findOrFail(body.id);
        body.foldername = data.foldername;
        await data.fill(body).save();
        return response.status(201).send({
            data,
            params: params.id
        });
    }
}
exports.default = CompaniesController;
//# sourceMappingURL=CompaniesController.js.map