"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = global[Symbol.for('ioc.use')]("App/Services/util");
class TributationPermission {
    async handle({ auth, response }, next, customGuards) {
        const authenticate = await auth.use('api').authenticate();
        const permissions = auth.use('api').token?.meta.payload.permissions;
        const action = customGuards[0];
        const TRIBUTATION_MAINTENANCE_PERMISSION_ID = 35;
        if (action === 'index') {
            await next();
            return;
        }
        if (action === 'show') {
            await next();
            return;
        }
        const hasPermission = (0, util_1.verifyPermission)(authenticate.superuser, permissions, TRIBUTATION_MAINTENANCE_PERMISSION_ID);
        if (!hasPermission) {
            return response.unauthorized({
                message: 'Você não possui permissão para executar esta ação em Tributações',
            });
        }
        await next();
    }
}
exports.default = TributationPermission;
//# sourceMappingURL=TributationPermission.js.map