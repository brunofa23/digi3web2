"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DocumentTypeBook_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/DocumentTypeBook"));
const DocmentTypeBookValidator_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Validators/DocmentTypeBookValidator"));
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
class DocumentTypeBooksController {
    async index({ auth, response }) {
        const authenticate = await auth.use('api').authenticate();
        try {
            const data = await DocumentTypeBook_1.default.query()
                .where('companies_id', authenticate.companies_id)
                .orderBy('id', 'asc');
            return response.status(200).send(data);
        }
        catch (error) {
            console.error('Erro ao listar tipos de livros/documentos:', error);
            throw new BadRequestException_1.default('Erro ao listar registros', 400, error);
        }
    }
    async store({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        try {
            const body = await request.validate(DocmentTypeBookValidator_1.default);
            body.companies_id = authenticate.companies_id;
            const documentTypeBook = await DocumentTypeBook_1.default.create(body);
            return response.status(201).send(documentTypeBook);
        }
        catch (error) {
            console.error('Erro ao criar tipo de livro/documento:', error);
            throw new BadRequestException_1.default('Erro ao criar registro', 400, error);
        }
    }
    async update({ auth, request, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        try {
            const body = await request.validate(DocmentTypeBookValidator_1.default);
            body.companies_id = authenticate.companies_id;
            const documentTypeBook = await DocumentTypeBook_1.default.findOrFail(params.id);
            documentTypeBook.merge(body);
            await documentTypeBook.save();
            return response.status(200).send(documentTypeBook);
        }
        catch (error) {
            console.error('Erro ao atualizar tipo de livro/documento:', error);
            throw new BadRequestException_1.default('Erro ao atualizar registro', 400, error);
        }
    }
}
exports.default = DocumentTypeBooksController;
//# sourceMappingURL=DocumentTypeBooksController.js.map