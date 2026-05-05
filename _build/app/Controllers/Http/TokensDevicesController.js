"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const luxon_1 = require("luxon");
const TokenDevice_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/TokenDevice"));
const AuthorizedDevice_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/AuthorizedDevice"));
const User_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/User"));
class TokensDevicesController {
    async generate({ auth, response }) {
        try {
            const authenticate = await auth.use('api').authenticate();
            const user = await User_1.default.query()
                .where('id', authenticate.id)
                .preload('company')
                .preload('usergroup', (query) => {
                query.preload('groupxpermission');
            })
                .first();
            if (!user) {
                return response.status(404).send({
                    message: 'Usuário não encontrado',
                });
            }
            if (!user.companies_id) {
                return response.status(403).send({
                    message: 'Usuário sem empresa vinculada',
                });
            }
            if (user.company && user.company.use_device_control === false) {
                return response.status(403).send({
                    message: 'Controle de dispositivo não habilitado para esta empresa',
                });
            }
            const RELEASE_TOKEN_PERMISSIONGROUP_ID = 35;
            const hasPermission = user.usergroup?.groupxpermission?.some((item) => {
                return Number(item.permissiongroup_id) === RELEASE_TOKEN_PERMISSIONGROUP_ID;
            }) || false;
            if (!hasPermission) {
                return response.status(403).send({
                    message: 'Usuário sem permissão para liberar token de dispositivo',
                });
            }
            const token = crypto_1.default.randomBytes(32).toString('hex');
            const tokenDevice = await TokenDevice_1.default.create({
                companyId: user.companies_id,
                createdByUserId: user.id,
                token,
                expiresAt: luxon_1.DateTime.now().plus({ minutes: 10 }),
                active: true,
            });
            return response.status(200).send({
                message: 'Token gerado com sucesso',
                data: {
                    id: tokenDevice.id,
                    token: tokenDevice.token,
                    expires_at: tokenDevice.expiresAt,
                },
            });
        }
        catch (error) {
            console.log('Erro ao gerar token de dispositivo:', error);
            return response.status(400).send({
                message: 'Erro ao gerar token de dispositivo',
                error: error.message || error,
            });
        }
    }
    async validateToken({ request, response }) {
        try {
            const { token, companies_id } = request.only(['token', 'companies_id']);
            if (!token) {
                return response.status(400).send({
                    message: 'Token não informado',
                });
            }
            if (!companies_id) {
                return response.status(400).send({
                    message: 'Empresa não informada',
                });
            }
            const tokenDevice = await TokenDevice_1.default.query()
                .where('token', token)
                .andWhere('company_id', companies_id)
                .first();
            if (!tokenDevice) {
                return response.status(404).send({
                    message: 'Token não encontrado',
                });
            }
            if (!tokenDevice.active) {
                return response.status(403).send({
                    message: 'Token inativo',
                });
            }
            if (tokenDevice.usedAt) {
                return response.status(403).send({
                    message: 'Token já utilizado',
                });
            }
            if (tokenDevice.expiresAt < luxon_1.DateTime.now()) {
                return response.status(403).send({
                    message: 'Token expirado',
                });
            }
            return response.status(200).send({
                message: 'Token válido',
                data: {
                    id: tokenDevice.id,
                    company_id: tokenDevice.companyId,
                    expires_at: tokenDevice.expiresAt,
                },
            });
        }
        catch (error) {
            console.log('Erro ao validar token de dispositivo:', error);
            return response.status(400).send({
                message: 'Erro ao validar token de dispositivo',
                error: error.message || error,
            });
        }
    }
    async registerDevice({ request, response }) {
        try {
            const body = request.only([
                'token',
                'companies_id',
                'device_name',
                'device_identifier',
                'user_id',
            ]);
            if (!body.token) {
                return response.status(400).send({
                    message: 'Token não informado',
                });
            }
            if (!body.companies_id) {
                return response.status(400).send({
                    message: 'Empresa não informada',
                });
            }
            if (!body.device_name) {
                return response.status(400).send({
                    message: 'Nome do dispositivo não informado',
                });
            }
            if (!body.device_identifier) {
                return response.status(400).send({
                    message: 'Identificador do dispositivo não informado',
                });
            }
            const tokenDevice = await TokenDevice_1.default.query()
                .where('token', body.token)
                .andWhere('company_id', body.companies_id)
                .first();
            if (!tokenDevice) {
                return response.status(404).send({
                    message: 'Token não encontrado',
                });
            }
            if (!tokenDevice.active) {
                return response.status(403).send({
                    message: 'Token inativo',
                });
            }
            if (tokenDevice.usedAt) {
                return response.status(403).send({
                    message: 'Token já utilizado',
                });
            }
            if (tokenDevice.expiresAt < luxon_1.DateTime.now()) {
                return response.status(403).send({
                    message: 'Token expirado',
                });
            }
            const alreadyExists = await AuthorizedDevice_1.default.query()
                .where('company_id', body.companies_id)
                .andWhere('device_identifier', body.device_identifier)
                .andWhere('active', true)
                .first();
            if (alreadyExists) {
                return response.status(409).send({
                    message: 'Dispositivo já cadastrado para esta empresa',
                });
            }
            const device = await AuthorizedDevice_1.default.create({
                companyId: body.companies_id,
                userId: body.user_id || null,
                deviceName: body.device_name,
                deviceIdentifier: body.device_identifier,
                active: true,
                lastUsedAt: luxon_1.DateTime.now(),
            });
            tokenDevice.usedAt = luxon_1.DateTime.now();
            tokenDevice.active = false;
            await tokenDevice.save();
            return response.status(200).send({
                message: 'Dispositivo registrado com sucesso',
                data: {
                    id: device.id,
                    company_id: device.companyId,
                    user_id: device.userId,
                    device_name: device.deviceName,
                    device_identifier: device.deviceIdentifier,
                },
            });
        }
        catch (error) {
            console.log('Erro ao registrar dispositivo:', error);
            return response.status(400).send({
                message: 'Erro ao registrar dispositivo',
                error: error.message || error,
            });
        }
    }
    async checkDevice({ request, response }) {
        try {
            const { companies_id, device_identifier } = request.only([
                'companies_id',
                'device_identifier',
            ]);
            if (!companies_id) {
                return response.status(400).send({
                    message: 'Empresa não informada',
                });
            }
            if (!device_identifier) {
                return response.status(400).send({
                    message: 'Identificador do dispositivo não informado',
                });
            }
            const device = await AuthorizedDevice_1.default.query()
                .where('company_id', companies_id)
                .andWhere('device_identifier', device_identifier)
                .andWhere('active', true)
                .first();
            if (!device) {
                return response.status(403).send({
                    message: 'Dispositivo não autorizado para esta empresa',
                });
            }
            device.lastUsedAt = luxon_1.DateTime.now();
            await device.save();
            return response.status(200).send({
                message: 'Dispositivo autorizado',
                data: {
                    id: device.id,
                    company_id: device.companyId,
                    user_id: device.userId,
                    device_name: device.deviceName,
                    device_identifier: device.deviceIdentifier,
                },
            });
        }
        catch (error) {
            console.log('Erro ao verificar dispositivo:', error);
            return response.status(400).send({
                message: 'Erro ao verificar dispositivo',
                error: error.message || error,
            });
        }
    }
}
exports.default = TokensDevicesController;
//# sourceMappingURL=TokensDevicesController.js.map