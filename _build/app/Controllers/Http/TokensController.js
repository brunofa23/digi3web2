"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const AuditLogger_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/Audit/AuditLogger"));
const Token_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Token"));
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class TokensController {
    validateJsonField(value, field) {
        if (value === undefined)
            return;
        try {
            JSON.parse(value);
        }
        catch (error) {
            throw new BadRequestException_1.default(`${field} inválido`, 422, 'token_invalid_json');
        }
    }
    async store(ctx) {
        const { auth, response, request } = ctx;
        const authenticate = await auth.use('api').authenticate();
        if (authenticate.companies_id !== 1 || authenticate.superuser !== true) {
            throw new BadRequestException_1.default('Acesso não liberado', 403, 'token_forbidden');
        }
        const tokenSchema = Validator_1.schema.create({
            id: Validator_1.schema.number.optional([Validator_1.rules.unsigned()]),
            name: Validator_1.schema.string({ trim: true }, [Validator_1.rules.maxLength(80)]),
            token: Validator_1.schema.string.optional({ trim: true }),
            credentials: Validator_1.schema.string.optional({ trim: true }),
            accountname: Validator_1.schema.string({ trim: true }, [Validator_1.rules.maxLength(255)]),
            status: Validator_1.schema.boolean.optional(),
        });
        const { id: _ignoredId, ...data } = await request.validate({ schema: tokenSchema });
        this.validateJsonField(data.token, 'token');
        this.validateJsonField(data.credentials, 'credentials');
        const existentToken = await Token_1.default.findBy('name', data.name);
        const beforeData = existentToken?.serialize();
        const persistedToken = await Token_1.default.updateOrCreate({ name: data.name }, data);
        await AuditLogger_1.default.record(ctx, {
            companiesId: authenticate.companies_id,
            userId: authenticate.id,
            action: existentToken ? 'google_drive_token_update' : 'google_drive_token_create',
            entityTable: 'tokens',
            entityId: persistedToken.id,
            resourceKey: `tokens:${persistedToken.id}`,
            entityKey: {
                token_id: persistedToken.id,
                name: persistedToken.name,
            },
            description: `Usuário ${authenticate.name || authenticate.username} alterou credenciais da nuvem ${persistedToken.name}`,
            beforeData,
            afterData: persistedToken,
            metadata: {
                token_id: persistedToken.id,
                name: persistedToken.name,
                accountname: persistedToken.accountname,
                status: persistedToken.status,
                token_changed: data.token !== undefined,
                credentials_changed: data.credentials !== undefined,
            },
        });
        return response.status(200).send("salvo");
    }
}
exports.default = TokensController;
//# sourceMappingURL=TokensController.js.map