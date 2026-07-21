"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Entity_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Entity"));
const FinEntityDocumentEmail_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/FinEntityDocumentEmail"));
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const util_1 = global[Symbol.for('ioc.use')]("App/Services/util");
const Mail_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Addons/Mail"));
const Env_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Env"));
const luxon_1 = require("luxon");
class FinEntitiesController {
    constructor() {
        this.maxEmailAttachmentSize = 5 * 1024 * 1024;
    }
    cleanUndefined(payload) {
        return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
    }
    normalizeInput(input) {
        const normalized = { ...input };
        for (const key of ['description', 'cpf_cnpj', 'email', 'responsible', 'phone', 'obs']) {
            if (typeof normalized[key] === 'string' && normalized[key].trim() === '') {
                normalized[key] = undefined;
            }
        }
        if (normalized.fin_class_id === '' || normalized.fin_class_id === undefined) {
            normalized.fin_class_id = null;
        }
        if (normalized.limit_amount === '' || normalized.limit_amount === undefined) {
            normalized.limit_amount = null;
        }
        else if (typeof normalized.limit_amount === 'string') {
            normalized.limit_amount = Number((0, util_1.currencyConverter)(normalized.limit_amount));
        }
        return normalized;
    }
    getEntityIdFromFileName(fileName) {
        const match = String(fileName || '').trim().match(/^(\d+)/);
        return match ? Number(match[1]) : null;
    }
    async index({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const { description } = request.only(['description']);
        try {
            const query = Entity_1.default.query()
                .where('companies_id', authenticate.companies_id)
                .preload('finclass', query => {
                query.select('id', 'description', 'debit_credit', 'cost', 'allocation', 'limit_amount');
            })
                .if(description, query => {
                query.where('description', 'like', `%${description}%`);
            });
            const data = await query;
            return response.status(200).send(data);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401, 'erro');
        }
    }
    async store({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const querySchema = Validator_1.schema.create({
            companies_id: Validator_1.schema.number.optional(),
            fin_class_id: Validator_1.schema.number.nullableAndOptional(),
            description: Validator_1.schema.string.nullableAndOptional(),
            cpf_cnpj: Validator_1.schema.string.nullableAndOptional(),
            email: Validator_1.schema.string.nullableAndOptional(),
            responsible: Validator_1.schema.string.nullableAndOptional(),
            phone: Validator_1.schema.string.nullableAndOptional(),
            obs: Validator_1.schema.string.nullableAndOptional(),
            inactive: Validator_1.schema.boolean.nullableAndOptional(),
            excluded: Validator_1.schema.boolean.nullableAndOptional(),
            limit_amount: Validator_1.schema.number.nullableAndOptional()
        });
        const input = this.normalizeInput(request.all());
        const body = await request.validate({
            schema: querySchema,
            data: input
        });
        const payload = this.cleanUndefined({ ...body, companies_id: authenticate.companies_id });
        try {
            const data = await Entity_1.default.create(payload);
            await data.load('finclass');
            return response.status(201).send(data);
        }
        catch (error) {
            throw new BadRequestException_1.default('Erro ao cadastrar entidade financeira', 400, error);
        }
    }
    async update({ auth, params, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const querySchema = Validator_1.schema.create({
            companies_id: Validator_1.schema.number.optional(),
            fin_class_id: Validator_1.schema.number.nullableAndOptional(),
            description: Validator_1.schema.string.nullableAndOptional(),
            cpf_cnpj: Validator_1.schema.string.nullableAndOptional(),
            email: Validator_1.schema.string.nullableAndOptional(),
            responsible: Validator_1.schema.string.nullableAndOptional(),
            phone: Validator_1.schema.string.nullableAndOptional(),
            obs: Validator_1.schema.string.nullableAndOptional(),
            inactive: Validator_1.schema.boolean.nullableAndOptional(),
            excluded: Validator_1.schema.boolean.nullableAndOptional(),
            limit_amount: Validator_1.schema.number.nullableAndOptional()
        });
        const input = this.normalizeInput(request.all());
        const body = await request.validate({
            schema: querySchema,
            data: input
        });
        const payload = this.cleanUndefined({ ...body, companies_id: authenticate.companies_id });
        try {
            const data = await Entity_1.default.findOrFail(params.id);
            await data.merge(payload).save();
            await data.load('finclass');
            return response.status(201).send(data);
        }
        catch (error) {
            throw new BadRequestException_1.default('Erro ao atualizar entidade financeira', 400, error);
        }
    }
    async documentEmailHistory({ auth, response }) {
        const authenticate = await auth.use('api').authenticate();
        try {
            const data = await FinEntityDocumentEmail_1.default.query()
                .where('companies_id', authenticate.companies_id)
                .orderBy('created_at', 'desc')
                .limit(200);
            return response.status(200).send(data);
        }
        catch (error) {
            throw new BadRequestException_1.default('Erro ao listar histórico de envio de documentos', 400, error);
        }
    }
    async sendDocumentEmails({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const subject = String(request.input('subject') || '').trim();
        const body = String(request.input('body') || '').trim();
        const files = request.files('files', {
            size: '5mb',
            extnames: ['pdf', 'PDF'],
        });
        if (!subject) {
            throw new BadRequestException_1.default('Informe o assunto do e-mail', 400, 'subject');
        }
        if (!body) {
            throw new BadRequestException_1.default('Informe o corpo do e-mail', 400, 'body');
        }
        if (!files.length) {
            throw new BadRequestException_1.default('Selecione pelo menos um arquivo PDF', 400, 'files');
        }
        const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
        if (totalSize > this.maxEmailAttachmentSize) {
            throw new BadRequestException_1.default('O total dos anexos deve ter no máximo 5 MB', 400, 'files');
        }
        try {
            const filesByEntity = new Map();
            for (const file of files) {
                const entityId = this.getEntityIdFromFileName(file.clientName);
                if (!entityId) {
                    throw new BadRequestException_1.default(`O arquivo ${file.clientName} deve iniciar com o código da entidade`, 400, 'files');
                }
                if (!filesByEntity.has(entityId)) {
                    filesByEntity.set(entityId, []);
                }
                filesByEntity.get(entityId).push(file);
            }
            const results = [];
            for (const [entityId, entityFiles] of filesByEntity.entries()) {
                const entity = await Entity_1.default.query()
                    .where('id', entityId)
                    .where('companies_id', authenticate.companies_id)
                    .first();
                if (!entity) {
                    throw new BadRequestException_1.default(`Entidade ${entityId} não encontrada`, 400, 'files');
                }
                if (!entity.email) {
                    throw new BadRequestException_1.default(`Entidade ${entityId} não possui e-mail cadastrado`, 400, 'email');
                }
                await Mail_1.default.send((message) => {
                    message
                        .from(Env_1.default.get('SMTP_USERNAME', ''), 'Digi3')
                        .to(entity.email)
                        .subject(subject)
                        .text(body);
                    for (const file of entityFiles) {
                        if (file.tmpPath) {
                            message.attach(file.tmpPath, {
                                filename: file.clientName,
                            });
                        }
                    }
                });
                for (const file of entityFiles) {
                    await FinEntityDocumentEmail_1.default.create({
                        companies_id: authenticate.companies_id,
                        fin_entity_id: entity.id,
                        email: entity.email,
                        subject,
                        body,
                        file_name: file.clientName,
                        file_size: file.size || 0,
                        status: 'sent',
                        sent_at: luxon_1.DateTime.local(),
                    });
                }
                results.push({
                    entity_id: entity.id,
                    entity_description: entity.description,
                    email: entity.email,
                    files: entityFiles.map((file) => file.clientName),
                    status: 'sent',
                });
            }
            return response.status(201).send(results);
        }
        catch (error) {
            if (error instanceof BadRequestException_1.default) {
                throw error;
            }
            throw new BadRequestException_1.default('Erro ao enviar documentos por e-mail', 400, error);
        }
    }
}
exports.default = FinEntitiesController;
//# sourceMappingURL=FinEntitiesController.js.map