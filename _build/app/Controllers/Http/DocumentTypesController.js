"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Documenttype_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Documenttype"));
const DocumenttypeValidator_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Validators/DocumenttypeValidator"));
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class DocumentTypesController {
    async index({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const querySchema = Validator_1.schema.create({
            local: Validator_1.schema.enum.optional(['certificate', 'document']),
        });
        const { local } = await request.validate({ schema: querySchema });
        try {
            const q = Documenttype_1.default.query()
                .where('companies_id', authenticate.companies_id);
            if (local) {
                q.andWhere('local', local);
            }
            const documentType = await q.orderBy('name');
            return response.ok(documentType);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401, 'erro');
        }
    }
    async store({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        try {
            const body = await request.validate(DocumenttypeValidator_1.default);
            body.companies_id = authenticate.companies_id;
            const documentType = await Documenttype_1.default.create(body);
            return response.status(201).send(documentType);
        }
        catch (error) {
            console.error('Erro ao criar tipo de documento:', error);
            throw new BadRequestException_1.default('Erro ao criar tipo de documento', 400, error);
        }
    }
    async update({ auth, request, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        try {
            const body = await request.validate(DocumenttypeValidator_1.default);
            body.companies_id = authenticate.companies_id;
            const documentType = await Documenttype_1.default.findOrFail(params.id);
            documentType.merge(body);
            await documentType.save();
            return response.status(200).send(documentType);
        }
        catch (error) {
            console.error('Erro ao atualizar tipo de documento:', error);
            throw new BadRequestException_1.default('Erro ao atualizar tipo de documento', 400, error);
        }
    }
}
exports.default = DocumentTypesController;
//# sourceMappingURL=DocumentTypesController.js.map