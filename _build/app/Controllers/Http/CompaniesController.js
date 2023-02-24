"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Company_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Company"));
const authorize = global[Symbol.for('ioc.use')]('App/Services/googleDrive/googledrive');
class CompaniesController {
    async index({ auth, response }) {
        const authenticate = await auth.use('api').authenticate();
        if (!authenticate.superuser)
            return "Não Possui privilégios para cadastrar empresa";
        const data = await Company_1.default
            .query()
            .preload('typebooks');
        return response.send(data);
    }
    async store({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        if (!authenticate.superuser)
            return "Não Possui privilégios para cadastrar empresa";
        const body = request.only(Company_1.default.fillable);
        console.log("Passei pelo validator");
        try {
            const data = await Company_1.default.create(body);
            let parent = await authorize.sendSearchOrCreateFolder(data.foldername);
            response.status(201);
            return {
                message: "Criado com sucesso",
                data: data,
                idfolder: parent
            };
        }
        catch (error) {
            return error;
        }
    }
    async show({ params, response }) {
        const data = await Company_1.default.find(params.id);
        return response.send(data);
    }
    async update({ auth, request, params }) {
        const authenticate = await auth.use('api').authenticate();
        if (!authenticate.superuser)
            return "Não Possui privilégios para cadastrar empresa";
        const body = request.only(Company_1.default.fillable);
        body.id = params.id;
        const data = await Company_1.default.findOrFail(body.id);
        body.foldername = data.foldername;
        await data.fill(body).save();
        return {
            message: 'Empresa atualizada com sucesso!!',
            data: data,
            params: params.id
        };
    }
}
exports.default = CompaniesController;
//# sourceMappingURL=CompaniesController.js.map