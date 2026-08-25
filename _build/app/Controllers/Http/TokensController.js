"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const AuditLogger_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/Audit/AuditLogger"));
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const Token_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Token"));
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
const googledrive_1 = global[Symbol.for('ioc.use')]("App/Services/googleDrive/googledrive");
const Encryption_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Encryption"));
const Env_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Env"));
const { google } = require('googleapis');
const GOOGLE_DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive'];
class TokensController {
    isEnabled(value) {
        return value === true || value === 1 || value === '1';
    }
    async authorizeCloudAdmin(ctx) {
        const authenticate = await ctx.auth.use('api').authenticate();
        if (Number(authenticate.companies_id) !== 1 || !this.isEnabled(authenticate.superuser)) {
            throw new BadRequestException_1.default('Acesso não liberado', 403, 'token_forbidden');
        }
        return authenticate;
    }
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
    inspectEncryptedJson(value) {
        const result = {
            exists: false,
            decryptable: false,
            json_valid: false,
            data: null,
        };
        if (typeof value !== 'string' || value.trim() === '') {
            return result;
        }
        result.exists = true;
        try {
            const decryptedValue = Encryption_1.default.decrypt(value);
            result.decryptable = true;
            result.data = JSON.parse(decryptedValue);
            result.json_valid = true;
        }
        catch (error) {
            result.data = null;
        }
        return result;
    }
    parseCredentialsJson(value) {
        try {
            const parsed = JSON.parse(value);
            const credentials = parsed.web || parsed.installed;
            if (!credentials?.client_id || !credentials?.client_secret) {
                throw new Error();
            }
            return parsed;
        }
        catch (error) {
            throw new BadRequestException_1.default('credentials inválido', 422, 'token_invalid_credentials');
        }
    }
    getOAuthClientCredentials(credentials) {
        return credentials?.web || credentials?.installed || null;
    }
    getBackendOAuthRedirectUri(ctx) {
        const configuredUrl = Env_1.default.get('GOOGLE_DRIVE_OAUTH_CALLBACK_URL', '');
        if (configuredUrl) {
            return configuredUrl;
        }
        const request = ctx.request;
        const protocol = request.header('x-forwarded-proto')?.split(',')?.[0]?.trim() || request.protocol();
        const host = request.header('x-forwarded-host')?.split(',')?.[0]?.trim() || request.host();
        return `${protocol}://${host}/api/tokens/oauth/callback`;
    }
    getSafeFrontendRedirect(ctx, value) {
        const allowedOrigins = String(Env_1.default.get('FRONTEND_URL', ''))
            .split(',')
            .map((origin) => origin.trim())
            .filter((origin) => origin && origin !== '*');
        const fallbackOrigin = allowedOrigins[0] || ctx.request.header('origin') || 'http://localhost:5173';
        const redirect = new URL(value || '/cloud-tokens', fallbackOrigin);
        if (allowedOrigins.length && !allowedOrigins.includes(redirect.origin)) {
            throw new BadRequestException_1.default('URL de retorno não liberada', 422, 'token_invalid_frontend_redirect');
        }
        redirect.pathname = '/cloud-tokens';
        return redirect.toString();
    }
    async store(ctx) {
        const { response, request } = ctx;
        const authenticate = await this.authorizeCloudAdmin(ctx);
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
    async index(ctx) {
        const { response } = ctx;
        await this.authorizeCloudAdmin(ctx);
        const data = await Database_1.default
            .from('tokens as tokens')
            .leftJoin('companies as companies', 'companies.cloud', 'tokens.id')
            .select('tokens.id', 'tokens.name', 'tokens.accountname', 'tokens.status', 'tokens.created_at', 'tokens.updated_at')
            .count('companies.id as companies_count')
            .groupBy('tokens.id', 'tokens.name', 'tokens.accountname', 'tokens.status', 'tokens.created_at', 'tokens.updated_at')
            .orderBy('tokens.id', 'asc');
        return response.status(200).send({
            data: data.map((token) => ({
                ...token,
                status: this.isEnabled(token.status),
                companies_count: Number(token.companies_count || 0),
            })),
            total: data.length,
        });
    }
    async test(ctx) {
        const { params, response } = ctx;
        const authenticate = await this.authorizeCloudAdmin(ctx);
        const token = await Token_1.default.query()
            .select('id', 'name', 'accountname', 'status')
            .where('id', params.id)
            .firstOrFail();
        try {
            await (0, googledrive_1.sendAuthorize)(token.id);
            await AuditLogger_1.default.record(ctx, {
                companiesId: authenticate.companies_id,
                userId: authenticate.id,
                action: 'google_drive_token_test',
                entityTable: 'tokens',
                entityId: token.id,
                resourceKey: `tokens:${token.id}`,
                entityKey: {
                    token_id: token.id,
                    name: token.name,
                },
                description: `Usuário ${authenticate.name || authenticate.username} testou conexão da nuvem ${token.name}`,
                metadata: {
                    token_id: token.id,
                    name: token.name,
                    accountname: token.accountname,
                    status: token.status,
                    success: true,
                },
            });
            return response.status(200).send({
                data: {
                    id: token.id,
                    name: token.name,
                    accountname: token.accountname,
                    status: token.status,
                    connected: true,
                },
                message: 'Conexão validada com sucesso',
            });
        }
        catch (error) {
            await AuditLogger_1.default.record(ctx, {
                companiesId: authenticate.companies_id,
                userId: authenticate.id,
                action: 'google_drive_token_test_failed',
                entityTable: 'tokens',
                entityId: token.id,
                resourceKey: `tokens:${token.id}`,
                entityKey: {
                    token_id: token.id,
                    name: token.name,
                },
                description: `Usuário ${authenticate.name || authenticate.username} tentou testar conexão da nuvem ${token.name}`,
                metadata: {
                    token_id: token.id,
                    name: token.name,
                    accountname: token.accountname,
                    status: token.status,
                    success: false,
                    error_message: error?.message,
                },
            });
            return response.status(422).send({
                message: error?.message || 'Não foi possível validar a conexão',
            });
        }
    }
    async updateStatus(ctx) {
        const { params, request, response } = ctx;
        const authenticate = await this.authorizeCloudAdmin(ctx);
        const statusSchema = Validator_1.schema.create({
            status: Validator_1.schema.boolean(),
        });
        const data = await request.validate({ schema: statusSchema });
        const token = await Token_1.default.query()
            .select('id', 'name', 'accountname', 'status')
            .where('id', params.id)
            .firstOrFail();
        const beforeData = token.serialize();
        token.status = data.status;
        await token.save();
        await AuditLogger_1.default.record(ctx, {
            companiesId: authenticate.companies_id,
            userId: authenticate.id,
            action: data.status ? 'google_drive_token_activate' : 'google_drive_token_deactivate',
            entityTable: 'tokens',
            entityId: token.id,
            resourceKey: `tokens:${token.id}`,
            entityKey: {
                token_id: token.id,
                name: token.name,
            },
            description: `Usuário ${authenticate.name || authenticate.username} ${data.status ? 'ativou' : 'inativou'} a nuvem ${token.name}`,
            beforeData,
            afterData: {
                id: token.id,
                name: token.name,
                accountname: token.accountname,
                status: token.status,
            },
            metadata: {
                token_id: token.id,
                name: token.name,
                accountname: token.accountname,
                previous_status: beforeData.status,
                status: token.status,
            },
        });
        return response.status(200).send({
            data: {
                id: token.id,
                name: token.name,
                accountname: token.accountname,
                status: token.status,
            },
            message: data.status ? 'Nuvem ativada com sucesso' : 'Nuvem inativada com sucesso',
        });
    }
    async revokePreview(ctx) {
        const { params, response } = ctx;
        const authenticate = await this.authorizeCloudAdmin(ctx);
        const token = await Database_1.default
            .from('tokens')
            .select('id', 'name', 'accountname', 'status', 'token', 'credentials')
            .where('id', params.id)
            .first();
        if (!token) {
            throw new BadRequestException_1.default('Nuvem não encontrada', 404, 'token_not_found');
        }
        const companies = await Database_1.default
            .from('companies')
            .where('cloud', token.id)
            .count('id as total')
            .first();
        const companiesCount = Number(companies?.total || 0);
        const status = this.isEnabled(token.status);
        const tokenInfo = this.inspectEncryptedJson(token.token);
        const credentialsInfo = this.inspectEncryptedJson(token.credentials);
        const credentialsRoot = credentialsInfo.data?.installed || credentialsInfo.data?.web || null;
        const warnings = [];
        if (status) {
            warnings.push('Inative a nuvem antes de revogar no Google.');
        }
        if (!tokenInfo.exists) {
            warnings.push('Token OAuth não encontrado no banco.');
        }
        else if (!tokenInfo.decryptable) {
            warnings.push('Token OAuth não pôde ser descriptografado.');
        }
        else if (!tokenInfo.json_valid) {
            warnings.push('Token OAuth não está em JSON válido.');
        }
        else if (!tokenInfo.data?.refresh_token) {
            warnings.push('Refresh token não encontrado no token OAuth.');
        }
        if (!credentialsInfo.exists) {
            warnings.push('Credenciais OAuth não encontradas no banco.');
        }
        else if (!credentialsInfo.decryptable) {
            warnings.push('Credenciais OAuth não puderam ser descriptografadas.');
        }
        else if (!credentialsInfo.json_valid) {
            warnings.push('Credenciais OAuth não estão em JSON válido.');
        }
        const readyToRevoke = !status
            && tokenInfo.decryptable
            && tokenInfo.json_valid
            && !!tokenInfo.data?.refresh_token;
        await AuditLogger_1.default.record(ctx, {
            companiesId: authenticate.companies_id,
            userId: authenticate.id,
            action: 'google_drive_token_revoke_preview',
            entityTable: 'tokens',
            entityId: token.id,
            resourceKey: `tokens:${token.id}`,
            entityKey: {
                token_id: token.id,
                name: token.name,
            },
            description: `Usuário ${authenticate.name || authenticate.username} verificou pré-revogação da nuvem ${token.name}`,
            metadata: {
                token_id: token.id,
                name: token.name,
                accountname: token.accountname,
                status,
                companies_count: companiesCount,
                has_refresh_token: !!tokenInfo.data?.refresh_token,
                ready_to_revoke: readyToRevoke,
            },
        });
        return response.status(200).send({
            data: {
                id: token.id,
                name: token.name,
                accountname: token.accountname,
                status,
                companies_count: companiesCount,
                token: {
                    exists: tokenInfo.exists,
                    decryptable: tokenInfo.decryptable,
                    json_valid: tokenInfo.json_valid,
                    has_refresh_token: !!tokenInfo.data?.refresh_token,
                    type: tokenInfo.data?.type || null,
                },
                credentials: {
                    exists: credentialsInfo.exists,
                    decryptable: credentialsInfo.decryptable,
                    json_valid: credentialsInfo.json_valid,
                    type: credentialsInfo.data?.installed ? 'installed' : credentialsInfo.data?.web ? 'web' : null,
                    has_client_id: !!credentialsRoot?.client_id,
                    has_client_secret: !!credentialsRoot?.client_secret,
                },
                requires_inactive_status: true,
                ready_to_revoke: readyToRevoke,
                warnings,
            },
            message: readyToRevoke
                ? 'Nuvem pronta para revogação no Google'
                : 'Nuvem ainda não está pronta para revogação no Google',
        });
    }
    async startOAuth(ctx) {
        const { request, response } = ctx;
        const authenticate = await this.authorizeCloudAdmin(ctx);
        const oauthSchema = Validator_1.schema.create({
            name: Validator_1.schema.string({ trim: true }, [Validator_1.rules.maxLength(80)]),
            accountname: Validator_1.schema.string({ trim: true }, [Validator_1.rules.maxLength(255)]),
            credentials: Validator_1.schema.string({ trim: true }),
            frontend_redirect: Validator_1.schema.string.optional({ trim: true }),
        });
        const data = await request.validate({ schema: oauthSchema });
        const existentToken = await Database_1.default
            .from('tokens')
            .select('id')
            .where('name', data.name)
            .first();
        if (existentToken) {
            throw new BadRequestException_1.default('Já existe uma nuvem com esse nome', 409, 'token_name_exists');
        }
        const credentialsJson = this.parseCredentialsJson(data.credentials);
        const oauthCredentials = this.getOAuthClientCredentials(credentialsJson);
        const redirectUri = this.getBackendOAuthRedirectUri(ctx);
        const frontendRedirect = this.getSafeFrontendRedirect(ctx, data.frontend_redirect);
        const token = await Token_1.default.create({
            name: data.name,
            accountname: data.accountname,
            credentials: JSON.stringify(credentialsJson),
            status: false,
        });
        const state = Encryption_1.default.encrypt(JSON.stringify({
            token_id: token.id,
            user_id: authenticate.id,
            companies_id: authenticate.companies_id,
            frontend_redirect: frontendRedirect,
            expires_at: Date.now() + (10 * 60 * 1000),
        }));
        const oauth2Client = new google.auth.OAuth2(oauthCredentials.client_id, oauthCredentials.client_secret, redirectUri);
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: GOOGLE_DRIVE_SCOPES,
            state,
        });
        await AuditLogger_1.default.record(ctx, {
            companiesId: authenticate.companies_id,
            userId: authenticate.id,
            action: 'google_drive_token_oauth_start',
            entityTable: 'tokens',
            entityId: token.id,
            resourceKey: `tokens:${token.id}`,
            entityKey: {
                token_id: token.id,
                name: token.name,
            },
            description: `Usuário ${authenticate.name || authenticate.username} iniciou autorização OAuth da nuvem ${token.name}`,
            metadata: {
                token_id: token.id,
                name: token.name,
                accountname: token.accountname,
                redirect_uri: redirectUri,
            },
        });
        return response.status(200).send({
            data: {
                id: token.id,
                name: token.name,
                accountname: token.accountname,
                status: token.status,
                auth_url: authUrl,
                redirect_uri: redirectUri,
            },
            message: 'Autorização criada. Continue no Google para concluir.',
        });
    }
    async oauthCallback(ctx) {
        const { request, response } = ctx;
        let frontendRedirect = this.getSafeFrontendRedirect(ctx);
        try {
            const code = request.input('code');
            const state = request.input('state');
            if (!code || !state) {
                throw new BadRequestException_1.default('Retorno OAuth inválido', 422, 'token_oauth_invalid_callback');
            }
            const stateData = JSON.parse(Encryption_1.default.decrypt(state));
            frontendRedirect = stateData.frontend_redirect || frontendRedirect;
            if (!stateData.token_id || Number(stateData.expires_at || 0) < Date.now()) {
                throw new BadRequestException_1.default('Autorização expirada', 422, 'token_oauth_expired');
            }
            const token = await Token_1.default.findOrFail(stateData.token_id);
            const credentialsJson = this.parseCredentialsJson(token.credentials);
            const oauthCredentials = this.getOAuthClientCredentials(credentialsJson);
            const redirectUri = this.getBackendOAuthRedirectUri(ctx);
            const oauth2Client = new google.auth.OAuth2(oauthCredentials.client_id, oauthCredentials.client_secret, redirectUri);
            const tokenResponse = await oauth2Client.getToken(code);
            const refreshToken = tokenResponse.tokens?.refresh_token;
            if (!refreshToken) {
                throw new BadRequestException_1.default('Google não retornou refresh_token. Tente novamente autorizando consentimento.', 422, 'token_oauth_refresh_token_missing');
            }
            token.token = JSON.stringify({
                type: 'authorized_user',
                client_id: oauthCredentials.client_id,
                client_secret: oauthCredentials.client_secret,
                refresh_token: refreshToken,
            });
            token.status = false;
            await token.save();
            await AuditLogger_1.default.record(ctx, {
                companiesId: stateData.companies_id || null,
                userId: stateData.user_id || null,
                action: 'google_drive_token_oauth_callback',
                entityTable: 'tokens',
                entityId: token.id,
                resourceKey: `tokens:${token.id}`,
                entityKey: {
                    token_id: token.id,
                    name: token.name,
                },
                description: `Autorização OAuth concluída para a nuvem ${token.name}`,
                metadata: {
                    token_id: token.id,
                    name: token.name,
                    accountname: token.accountname,
                    status: token.status,
                    has_refresh_token: true,
                },
            });
            const redirectUrl = new URL(frontendRedirect);
            redirectUrl.searchParams.set('cloud_oauth', 'success');
            redirectUrl.searchParams.set('cloud_id', String(token.id));
            return response.redirect(redirectUrl.toString());
        }
        catch (error) {
            const redirectUrl = new URL(frontendRedirect);
            redirectUrl.searchParams.set('cloud_oauth', 'error');
            redirectUrl.searchParams.set('cloud_message', error?.message || 'Não foi possível concluir autorização Google');
            return response.redirect(redirectUrl.toString());
        }
    }
}
exports.default = TokensController;
//# sourceMappingURL=TokensController.js.map