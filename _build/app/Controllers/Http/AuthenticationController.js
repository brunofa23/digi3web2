"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const User_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/User"));
const Hash_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Hash"));
const Env_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Env"));
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const validations_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/Validations/validations"));
const luxon_1 = require("luxon");
const util_1 = global[Symbol.for('ioc.use')]("App/Services/util");
const server_1 = require("@simplewebauthn/server");
const helpers_1 = require("@simplewebauthn/server/helpers");
const AuthorizedDevice_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/AuthorizedDevice"));
const WebauthnCredential_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/WebauthnCredential"));
const WebauthnChallenge_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/WebauthnChallenge"));
const AuditLogger_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/Audit/AuditLogger"));
class AuthenticationController {
    constructor() {
        this.deviceCookieName = 'digi3_device_token';
    }
    getWebauthnConfig(request) {
        const origin = Env_1.default.get('WEBAUTHN_ORIGIN') || request.header('origin') || `${request.protocol()}://${request.host()}`;
        const hostname = origin.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
        return {
            rpID: Env_1.default.get('WEBAUTHN_RP_ID', hostname),
            origin,
        };
    }
    hashDeviceCookie(token) {
        return crypto_1.default.createHash('sha256').update(token).digest('hex');
    }
    async findDeviceByCookie(request, companyId) {
        const cookieToken = request.plainCookie(this.deviceCookieName, null, true);
        if (!cookieToken) {
            return null;
        }
        return AuthorizedDevice_1.default.query()
            .where('company_id', companyId)
            .andWhere('device_cookie_hash', this.hashDeviceCookie(cookieToken))
            .andWhere('active', true)
            .first();
    }
    async generateToken(auth, user, permissions, username) {
        return auth.use('api').generate(user, {
            expiresIn: '7 days',
            name: username,
            payload: {
                permissions: permissions.map(p => ({
                    usergroup_id: p.usergroup_id,
                    permissiongroup_id: p.permissiongroup_id,
                }))
            }
        });
    }
    async login(ctx) {
        const { auth, request, response } = ctx;
        const username = request.input('username');
        const shortname = request.input('shortname');
        const password = request.input('password');
        const clientType = request.input('client_type');
        const user = await User_1.default
            .query()
            .preload('company', query => {
            query.select('id', 'name', 'shortname', 'foldername', 'cloud', 'responsablename', 'status', 'use_device_control', 'use_device_cookie_control');
        })
            .preload('usergroup', query => {
            query.preload('groupxpermission', query => {
                query.select('usergroup_id', 'permissiongroup_id');
            });
        })
            .where('username', username)
            .whereHas('company', builder => {
            builder.where('shortname', shortname);
        })
            .first();
        if (!user) {
            const errorValidation = await new validations_1.default('user_error_205');
            throw new BadRequestException_1.default(errorValidation.messages, errorValidation.status, errorValidation.code);
        }
        if (!user.company?.status) {
            const errorValidation = await new validations_1.default('user_error_204');
            throw new BadRequestException_1.default(errorValidation.messages, errorValidation.status, errorValidation.code);
        }
        if (!(await Hash_1.default.verify(user.password, password))) {
            let errorValidation = await new validations_1.default('user_error_206');
            throw new BadRequestException_1.default(errorValidation.messages, errorValidation.status, errorValidation.code);
        }
        const permissions = user?.$preloaded.usergroup.$preloaded.groupxpermission || [];
        const canBypassDeviceControl = (0, util_1.verifyPermission)(Boolean(user.superuser), permissions, 39);
        if (!(0, util_1.verifyPermission)(Boolean(user.superuser), permissions, 31)) {
            const now = luxon_1.DateTime.now().setZone('America/Sao_Paulo');
            const hourNow = now.hour;
            const minuteNow = now.minute;
            const estaNoHorarioPermitido = hourNow >= 7 && (hourNow < 19 || (hourNow === 19 && minuteNow === 0));
            if (!estaNoHorarioPermitido) {
                const errorValidation = await new validations_1.default('user_error_208');
                throw new BadRequestException_1.default(errorValidation.messages, errorValidation.status, errorValidation.code);
            }
        }
        const useWebauthnControl = Boolean(user.company?.use_device_control);
        const useCookieControl = Boolean(user.company?.use_device_cookie_control);
        if ((useWebauthnControl || useCookieControl) && !canBypassDeviceControl && clientType !== 'digi3_capture_mobile') {
            const cookieDevice = useCookieControl
                ? await this.findDeviceByCookie(request, user.companies_id)
                : null;
            if (useCookieControl && !cookieDevice) {
                return response.status(403).send({
                    code: 'device_error_002',
                    message: 'Dispositivo não autorizado para esta empresa',
                    status: 403,
                    data: {
                        company_id: user.companies_id,
                        user_id: user.id,
                        requires_cookie: true,
                        requires_webauthn: useWebauthnControl,
                    },
                });
            }
            if (!useWebauthnControl) {
                if (cookieDevice) {
                    cookieDevice.lastUsedAt = luxon_1.DateTime.now();
                    cookieDevice.deviceCookieLastSeenAt = luxon_1.DateTime.now();
                    await cookieDevice.save();
                }
                const token = await this.generateToken(auth, user, permissions, username);
                await AuditLogger_1.default.login(ctx, user);
                return response.status(200).send({ token, user });
            }
            const credentialsQuery = WebauthnCredential_1.default
                .query()
                .select('webauthn_credentials.*')
                .join('authorized_devices', 'authorized_devices.id', 'webauthn_credentials.authorized_device_id')
                .where('webauthn_credentials.company_id', user.companies_id)
                .andWhere('authorized_devices.active', true);
            if (cookieDevice) {
                credentialsQuery.andWhere('authorized_devices.id', cookieDevice.id);
            }
            const credentials = await credentialsQuery;
            if (!credentials.length) {
                return response.status(403).send({
                    code: 'device_error_002',
                    message: 'Dispositivo não autorizado para esta empresa',
                    status: 403,
                    data: {
                        company_id: user.companies_id,
                        user_id: user.id,
                        requires_cookie: useCookieControl,
                        requires_webauthn: true,
                    },
                });
            }
            const { rpID } = this.getWebauthnConfig(request);
            const options = await (0, server_1.generateAuthenticationOptions)({
                rpID,
                allowCredentials: credentials.map((credential) => ({
                    id: credential.credentialId,
                })),
                timeout: 120000,
                userVerification: 'preferred',
            });
            const challenge = await WebauthnChallenge_1.default.create({
                companyId: user.companies_id,
                userId: user.id,
                type: 'authentication',
                challenge: options.challenge,
                expiresAt: luxon_1.DateTime.now().plus({ minutes: 60 }),
            });
            return response.status(403).send({
                code: 'device_webauthn_required',
                message: 'Confirme este dispositivo',
                status: 403,
                data: {
                    company_id: user.companies_id,
                    user_id: user.id,
                    requires_cookie: useCookieControl,
                    requires_webauthn: true,
                    challenge_id: challenge.id,
                    options,
                },
            });
        }
        const token = await this.generateToken(auth, user, permissions, username);
        await AuditLogger_1.default.login(ctx, user);
        return response.status(200).send({ token, user });
    }
    async verifyWebauthnLogin(ctx) {
        const { auth, request, response } = ctx;
        try {
            const { challenge_id, credential } = request.only(['challenge_id', 'credential']);
            if (!challenge_id || !credential) {
                return response.status(400).send({
                    message: 'Autenticação WebAuthn inválida',
                });
            }
            const challenge = await WebauthnChallenge_1.default.query()
                .where('id', challenge_id)
                .andWhere('type', 'authentication')
                .first();
            if (!challenge || challenge.usedAt) {
                return response.status(403).send({
                    message: 'Desafio WebAuthn inválido',
                });
            }
            if (challenge.expiresAt < luxon_1.DateTime.now()) {
                return response.status(403).send({
                    message: 'Desafio WebAuthn expirado',
                });
            }
            if (!challenge.userId) {
                return response.status(403).send({
                    message: 'Desafio WebAuthn inválido',
                });
            }
            const credentialRecord = await WebauthnCredential_1.default.query()
                .where('credential_id', credential.id)
                .andWhere('company_id', challenge.companyId)
                .first();
            if (!credentialRecord) {
                return response.status(403).send({
                    message: 'Dispositivo não autorizado para esta empresa',
                });
            }
            const authorizedDevice = await AuthorizedDevice_1.default.query()
                .where('id', credentialRecord.authorizedDeviceId)
                .andWhere('company_id', challenge.companyId)
                .andWhere('active', true)
                .first();
            if (!authorizedDevice) {
                return response.status(403).send({
                    message: 'Dispositivo não autorizado para esta empresa',
                });
            }
            const challengeUser = await User_1.default.query()
                .preload('company', query => {
                query.select('id', 'status', 'use_device_cookie_control');
            })
                .where('id', challenge.userId)
                .first();
            if (!challengeUser) {
                return response.status(404).send({
                    message: 'Usuário não encontrado',
                });
            }
            if (!challengeUser.company?.status) {
                const errorValidation = await new validations_1.default('user_error_204');
                return response.status(errorValidation.status).send({
                    message: errorValidation.messages,
                    code: errorValidation.code,
                    status: errorValidation.status,
                });
            }
            if (challengeUser.company?.use_device_cookie_control) {
                const cookieDevice = await this.findDeviceByCookie(request, challenge.companyId);
                if (!cookieDevice || cookieDevice.id !== authorizedDevice.id) {
                    return response.status(403).send({
                        message: 'Dispositivo não autorizado para esta empresa',
                    });
                }
            }
            const { origin, rpID } = this.getWebauthnConfig(request);
            const verification = await (0, server_1.verifyAuthenticationResponse)({
                response: credential,
                expectedChallenge: challenge.challenge,
                expectedOrigin: origin,
                expectedRPID: rpID,
                credential: {
                    id: credentialRecord.credentialId,
                    publicKey: helpers_1.isoBase64URL.toBuffer(credentialRecord.publicKey),
                    counter: credentialRecord.counter,
                },
                requireUserVerification: false,
            });
            if (!verification.verified) {
                return response.status(403).send({
                    message: 'Não foi possível confirmar este dispositivo',
                });
            }
            const user = await User_1.default
                .query()
                .preload('company', query => {
                query.select('id', 'name', 'shortname', 'foldername', 'cloud', 'responsablename', 'status', 'use_device_control', 'use_device_cookie_control');
            })
                .preload('usergroup', query => {
                query.preload('groupxpermission', query => {
                    query.select('usergroup_id', 'permissiongroup_id');
                });
            })
                .where('id', challenge.userId)
                .first();
            if (!user) {
                return response.status(404).send({
                    message: 'Usuário não encontrado',
                });
            }
            if (!user.company?.status) {
                const errorValidation = await new validations_1.default('user_error_204');
                return response.status(errorValidation.status).send({
                    message: errorValidation.messages,
                    code: errorValidation.code,
                    status: errorValidation.status,
                });
            }
            const permissions = user?.$preloaded.usergroup.$preloaded.groupxpermission || [];
            const token = await this.generateToken(auth, user, permissions, user.username);
            credentialRecord.counter = verification.authenticationInfo.newCounter;
            await credentialRecord.save();
            authorizedDevice.lastUsedAt = luxon_1.DateTime.now();
            authorizedDevice.deviceCookieLastSeenAt = luxon_1.DateTime.now();
            await authorizedDevice.save();
            challenge.usedAt = luxon_1.DateTime.now();
            await challenge.save();
            await AuditLogger_1.default.login(ctx, user);
            return response.status(200).send({ token, user });
        }
        catch (error) {
            console.log('Erro ao validar login WebAuthn:', error);
            return response.status(400).send({
                message: error.message || 'Erro ao validar login WebAuthn',
                error: error.message || error,
            });
        }
    }
    async logout({ auth }) {
        await auth.use('api').revoke();
        return { revoked: true };
    }
    async authorizeAccessImages({ auth, request, response }) {
        const { companies_id, username } = await auth.use('api').authenticate();
        const usernameAutorization = request.input('username');
        const password = request.input('password');
        const accessImage = request.input('accessimage');
        try {
            const user = await User_1.default
                .query()
                .where('username', usernameAutorization)
                .andWhere('companies_id', companies_id)
                .first();
            if (!user) {
                const errorValidation = await new validations_1.default('user_error_205');
                throw new BadRequestException_1.default(errorValidation.messages, errorValidation.status, errorValidation.code);
            }
            const isPasswordValid = await Hash_1.default.verify(user.password, String(password));
            if (!isPasswordValid) {
                const errorValidation = await new validations_1.default('user_error_206');
                throw new BadRequestException_1.default(errorValidation.messages, errorValidation.status, errorValidation.code);
            }
            const hasPermission = await User_1.default
                .query()
                .where('username', usernameAutorization)
                .andWhere('companies_id', companies_id)
                .join('groupxpermissions', 'users.usergroup_id', 'groupxpermissions.usergroup_id')
                .where(query => {
                query.where('groupxpermissions.permissiongroup_id', 30).orWhere('users.superuser', 1);
            })
                .select('users.id')
                .first();
            if (!hasPermission) {
                const errorValidation = await new validations_1.default('user_error_201');
                throw new BadRequestException_1.default(errorValidation.messages, errorValidation.status, errorValidation.code);
            }
            const limitDataAccess = luxon_1.DateTime.local().plus(accessImage > 0 ? { days: accessImage } : { minutes: 7 }).toFormat('yyyy-MM-dd HH:mm');
            const authenticatedUser = await User_1.default
                .query()
                .where('username', username)
                .andWhere('companies_id', companies_id)
                .first();
            if (authenticatedUser) {
                ;
                authenticatedUser.access_image = limitDataAccess;
                await authenticatedUser.save();
                return response.status(201).send({ valor: true, tempo: accessImage });
            }
            else {
                throw new BadRequestException_1.default("Usuário autenticado não encontrado.");
            }
        }
        catch (error) {
            console.error("Erro:", error);
            const defaultError = await new validations_1.default('user_error_999');
            return response.badRequest({
                message: error.messages || defaultError.messages,
                code: error.code || defaultError.code,
                status: error.status || 400
            });
        }
    }
}
exports.default = AuthenticationController;
//# sourceMappingURL=AuthenticationController.js.map