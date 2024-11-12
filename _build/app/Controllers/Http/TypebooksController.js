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
const googledrive_1 = global[Symbol.for('ioc.use')]("App/Services/googleDrive/googledrive");
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
                    yeardoc: "Ano",
                    documenttype_id: "Tipo Documento",
                    free: "Gratuito",
                    book_name: "Nome do Livro",
                    book_number: "Num. Livro",
                    sheet_number: "Folha"
                });
            }
            const path = `Client_${typebookPayload.companies_id}.Book_${data.id}.${book?.namefolder}`;
            await Typebook_1.default.query().where('id', '=', data.id)
                .andWhere('companies_id', '=', typebookPayload.companies_id)
                .update({ path: path });
            const idFolderCompany = await (0, googledrive_1.sendSearchFile)(company.foldername, company.cloud);
            const verifyFolder = await (0, googledrive_1.sendSearchFile)(path, company.cloud);
            if (verifyFolder.length > 0) {
                return;
            }
            await (0, googledrive_1.sendCreateFolder)(path, company.cloud, idFolderCompany[0].id);
            let successValidation = await new validations_1.default('typebook_success_100');
            return response.status(201).send(typebookPayload, successValidation.code);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request - Create Typebook', 401, error);
        }
    }
    async index({ auth, response, request }) {
        const { companies_id } = await auth.use('api').authenticate();
        const typebookPayload = request.only(['name', 'status', 'books_id', 'totalfiles', 'isDocument']);
        let data;
        if (!companies_id)
            throw new BadRequestException_1.default('company not exists', 401);
        if (!typebookPayload.name && !typebookPayload.status && !typebookPayload.books_id) {
            data = await Typebook_1.default.query()
                .preload('documentconfig')
                .preload('book')
                .where("companies_id", '=', companies_id);
        }
        else {
            let _status;
            const queryData = Typebook_1.default.query()
                .preload('book')
                .where("companies_id", '=', companies_id);
            if (typebookPayload.status !== undefined) {
                if (typebookPayload.status === 'TRUE' || typebookPayload.status === '1')
                    _status = 1;
                else if (typebookPayload.status === 'FALSE' || typebookPayload.status === '0')
                    _status = 0;
                queryData.where('status', _status);
            }
            if (typebookPayload.name !== undefined)
                queryData.where('name', 'like', `%${typebookPayload.name}%`);
            if (typebookPayload.books_id !== undefined) {
                queryData.where('books_id', typebookPayload.books_id);
            }
            if (typebookPayload.isDocument) {
                if (typebookPayload.isDocument == "true")
                    queryData.where('books_id', 13);
                if (typebookPayload.isDocument == "false")
                    queryData.whereNotIn('books_id', [13]);
            }
            queryData.orderBy('name');
            data = await queryData;
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
        const authenticate = await auth.use('api').authenticate();
        const typebookPayload = request.only(['companies_id']);
        const query = Typebook_1.default.query();
        if (!authenticate.superuser)
            query.where('companies_id', authenticate.companies_id);
        else if (typebookPayload.companies_id)
            query.where('companies_id', typebookPayload.companies_id);
        const data = await query;
        return response.status(200).send(data);
    }
}
exports.default = TypebooksController;
//# sourceMappingURL=TypebooksController.js.map