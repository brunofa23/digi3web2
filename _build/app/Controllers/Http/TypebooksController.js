"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Typebook_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Typebook"));
const Company_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Company"));
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const TypebookValidator_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Validators/TypebookValidator"));
const validations_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/Validations/validations"));
const Book_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Book"));
const DocumentConfig_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/DocumentConfig"));
const authorize = global[Symbol.for('ioc.use')]('App/Services/googleDrive/googledrive');
const fileRename = global[Symbol.for('ioc.use')]('App/Services/fileRename/fileRename');
class TypebooksController {
    async store({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const typebookPayload = await request.validate(TypebookValidator_1.default);
        const book = await Book_1.default.find(typebookPayload.books_id);
        typebookPayload.companies_id = authenticate.companies_id;
        try {
            const company = await Company_1.default.findByOrFail('id', authenticate.companies_id);
            const data = await Typebook_1.default.create(typebookPayload);
            if (data.$attributes.books_id == 13) {
                await DocumentConfig_1.default
                    .create({
                    typebooks_id: data.$attributes.id,
                    companies_id: authenticate.companies_id,
                    prot: "Protocolo",
                    month: "Mês",
                    yeardoc: "Ano"
                });
            }
            const path = `Client_${typebookPayload.companies_id}.Book_${data.id}.${book?.namefolder}`;
            await Typebook_1.default.query().where('id', '=', data.id)
                .andWhere('companies_id', '=', typebookPayload.companies_id)
                .update({ path: path });
            const idFolderCompany = await authorize.sendSearchFile(company.foldername);
            const verifyFolder = await authorize.sendSearchFile(path);
            if (verifyFolder.length > 0) {
                return;
            }
            await authorize.sendCreateFolder(path, idFolderCompany[0].id);
            let successValidation = await new validations_1.default('typebook_success_100');
            return response.status(201).send(typebookPayload, successValidation.code);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request - Create Typebook', 401, error);
        }
    }
    async index({ auth, response, request }) {
        const { companies_id } = await auth.use('api').authenticate();
        const typebookPayload = request.only(['name', 'status', 'books_id', 'totalfiles']);
        let data;
        let query = " 1=1 ";
        if (!companies_id)
            throw new BadRequestException_1.default('company not exists', 401);
        if (!typebookPayload.name && !typebookPayload.status && !typebookPayload.books_id) {
            data = await Typebook_1.default.query()
                .preload('documentconfig')
                .where("companies_id", '=', companies_id);
        }
        else {
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
            data = await Typebook_1.default.query()
                .where("companies_id", '=', companies_id)
                .whereRaw(query);
            console.log("passei aqui 100");
        }
        if (typebookPayload.totalfiles) {
            data = await Typebook_1.default.query()
                .where("companies_id", '=', companies_id)
                .whereRaw(query).andWhere("status", "=", 1);
            for (let i = 0; i < data.length; i++) {
                const totalFiles = await fileRename.totalFilesInFolder(data[i].path);
                data[i].totalFiles = totalFiles.length;
            }
        }
        return response.status(200).send(data);
    }
    async show({ auth, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const data = await Typebook_1.default.query()
            .preload('documentconfig')
            .where("companies_id", "=", authenticate.companies_id)
            .andWhere('id', "=", params.id).firstOrFail();
        console.log("passei no show");
        return response.status(200).send(data);
    }
    async update({ auth, request, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const typebookPayload = await request.validate(TypebookValidator_1.default);
        typebookPayload.id = params.id;
        typebookPayload.companies_id = authenticate.companies_id;
        try {
            await Typebook_1.default.query()
                .where("companies_id", "=", authenticate.companies_id)
                .andWhere('id', "=", params.id).update(typebookPayload);
            let successValidation = await new validations_1.default('typebook_success_101');
            return response.status(201).send(typebookPayload, successValidation.code);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request - update', 401);
        }
    }
    async destroy({ auth, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        try {
            const data = await Typebook_1.default.query()
                .where("companies_id", "=", authenticate.companies_id)
                .andWhere('id', "=", params.id).delete();
            let successValidation = await new validations_1.default('typebook_success_102');
            return response.status(200).send(data, successValidation.code);
        }
        catch (error) {
            let errorValidation = await new validations_1.default('typebook_error_102');
            return response.status(500).send(errorValidation.code);
        }
    }
    async allTypebook({ auth, response, request }) {
        await auth.use('api').authenticate();
        const typebookPayload = request.only(['companies_id']);
        let data;
        let query = " 1=1 ";
        if (typebookPayload.companies_id)
            query += ` and companies_id=${typebookPayload.companies_id}`;
        data = await Typebook_1.default.query()
            .whereRaw(query);
        return response.status(200).send(data);
    }
}
exports.default = TypebooksController;
//# sourceMappingURL=TypebooksController.js.map