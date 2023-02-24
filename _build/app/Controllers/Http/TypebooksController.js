"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Typebook_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Typebook"));
const Company_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Company"));
const authorize = global[Symbol.for('ioc.use')]('App/Services/googleDrive/googledrive');
class TypebooksController {
    async store({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const body = request.only(Typebook_1.default.fillable);
        body.companies_id = authenticate.companies_id;
        try {
            const company = await Company_1.default.findByOrFail('id', authenticate.companies_id);
            const data = await Typebook_1.default.create(body);
            console.log(">>>typebook folder");
            const idFolderCompany = await authorize.sendSearchFile(company.foldername);
            await authorize.sendCreateFolder(data.path, idFolderCompany[0].id);
            response.status(201);
            return {
                message: "Criado com sucesso",
                data: data,
            };
        }
        catch (error) {
            return error;
        }
    }
    async index({ auth, request, response }) {
        const { authenticate, companies_id } = await auth.use('api').authenticate();
        const { name, status, books_id } = request.requestData;
        if (!companies_id)
            return "error";
        if (!name && !status && !books_id) {
            const data = await Typebook_1.default.query().where("companies_id", '=', companies_id);
            return response.send(data);
        }
        else {
            let query = " 1=1 ";
            let _status;
            if (status !== undefined) {
                if (status === 'TRUE' || status === '1')
                    _status = 1;
                else if (status === 'FALSE' || status === '0')
                    _status = 0;
                query += ` and status =${_status} `;
            }
            if (name !== undefined)
                query += ` and name like '%${name}%' `;
            if (books_id !== undefined) {
                query += ` and books_id = ${books_id} `;
            }
            const data = await Typebook_1.default.query().where("companies_id", '=', companies_id)
                .preload('bookrecords').preload('book')
                .whereRaw(query);
            return response.send(data);
        }
    }
    async show({ auth, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const data = await Typebook_1.default.query()
            .where("companies_id", "=", authenticate.companies_id)
            .andWhere('id', "=", params.id).firstOrFail();
        return response.send(data);
    }
    async update({ auth, request, params }) {
        const authenticate = await auth.use('api').authenticate();
        const body = request.only(Typebook_1.default.fillable);
        body.id = params.id;
        body.companies_id = authenticate.companies_id;
        const data = await Typebook_1.default.query()
            .where("companies_id", "=", authenticate.companies_id)
            .andWhere('id', "=", params.id).update(body);
        return {
            message: 'Tipo de Livro atualizado com sucesso!!',
            data: data,
            body: body,
            params: params.id
        };
    }
    async destroy({ auth, params }) {
        const authenticate = await auth.use('api').authenticate();
        const data = await Typebook_1.default.query()
            .where("companies_id", "=", authenticate.companies_id)
            .andWhere('id', "=", params.id).delete();
        return {
            message: "Livro excluido com sucesso.",
            data: data
        };
    }
}
exports.default = TypebooksController;
//# sourceMappingURL=TypebooksController.js.map