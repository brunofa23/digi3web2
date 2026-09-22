"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const CRM_PERMISSION_ID = 47;
class CrmPermission {
    async handle({ auth, response }, next) {
        const user = await auth.use('api').authenticate();
        if (user.superuser) {
            await next();
            return;
        }
        const permission = await Database_1.default.from('groupxpermissions')
            .where('usergroup_id', user.usergroup_id)
            .where('companies_id', user.companies_id)
            .where('permissiongroup_id', CRM_PERMISSION_ID)
            .first();
        if (!permission) {
            return response.forbidden({
                code: 'crm_access_denied',
                message: 'Usuário sem permissão para acessar o CRM.',
            });
        }
        await next();
    }
}
exports.default = CrmPermission;
//# sourceMappingURL=CrmPermission.js.map