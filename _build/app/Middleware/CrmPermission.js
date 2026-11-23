"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = global[Symbol.for('ioc.use')]("App/Services/util");
const CRM_PERMISSION_ID = 47;
class CrmPermission {
    async handle({ auth, response }, next) {
        const user = await auth.use('api').authenticate();
        const permissions = auth.use('api').token?.meta.payload.permissions;
        if (!(0, util_1.verifyPermission)(Boolean(user.superuser), permissions, CRM_PERMISSION_ID)) {
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