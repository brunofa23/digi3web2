"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Typebook_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Typebook"));
const Company_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Company"));
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const TypebookValidator_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Validators/TypebookValidator"));
const authorize = global[Symbol.for('ioc.use')]('App/Services/googleDrive/googledrive');
class TypebooksController {
    async store({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const typebookPayload = await request.validate(TypebookValidator_1.default);
        typebookPayload.companies_id = authenticate.companies_id;
        try {
            const company = await Company_1.default.findByOrFail('id', authenticate.companies_id);
            const data = await Typebook_1.default.create(typebookPayload);
            const idFolderCompany = await authorize.sendSearchFile(company.foldername);
            await authorize.sendCreateFolder(data.path, idFolderCompany[0].id);
            return response.status(201).send(typebookPayload);
        }
        catch (error) {
            throw new BadRequestException_1.default('Error in TypebookStore', 401);
        }
    }
    async index({ auth, response, request }) {
        const { companies_id } = await auth.use('api').authenticate();
        const typebookPayload = request.only(['name', 'status', 'books_id']);
        if (!companies_id)
            throw new BadRequestException_1.default('company not exists', 401);
        if (!typebookPayload.name && !typebookPayload.status && !typebookPayload.books_id) {
            const data = await Typebook_1.default.query().where("companies_id", '=', companies_id);
            return response.status(200).send(data);
        }
        else {
            let query = " 1=1 ";
            let _status;
            if (typebookPayload.status !== undefined) {
                if (typebookPayload.status === 'TRUE' || typebookPayload.status === '1')
                    _status = 1;
                else if (typebookPayload.status === 'FALSE' || typebookPayload.status === '0')
                    _status = 0;
                query += ` and status =${_status} `;
            }
            if (typebookPayload.name !== undefined)
                query += ` and name like '%${typebookPayload.name}%' `;
            if (typebookPayload.books_id !== undefined) {
                query += ` and books_id = ${typebookPayload.books_id} `;
            }
            const data = await Typebook_1.default.query().where("companies_id", '=', companies_id)
                .preload('bookrecords').preload('book')
                .whereRaw(query);
            return response.status(200).send(data);
        }
    }
    async show({ auth, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const data = await Typebook_1.default.query()
            .where("companies_id", "=", authenticate.companies_id)
            .andWhere('id', "=", params.id).firstOrFail();
        return response.send(data);
    }
    async update({ auth, request, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const body = request.only(Typebook_1.default.fillable);
        body.id = params.id;
        body.companies_id = authenticate.companies_id;
        const data = await Typebook_1.default.query()
            .where("companies_id", "=", authenticate.companies_id)
            .andWhere('id', "=", params.id).update(body);
        return response.status(201).send(body);
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