"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = global[Symbol.for('ioc.use')]("App/Services/util");
class ServiceMenuPermission {
    async handle({ auth, response }, next, permissionIds) {
        const user = await auth.use('api').authenticate();
        const permissions = auth.use('api').token?.meta.payload.permissions;
        if (!(0, util_1.verifyPermission)(Boolean(user.superuser), permissions, Number(permissionIds[0]))) {
            return response.forbidden({ message: 'Você não possui permissão para executar esta ação.' });
        }
        await next();
    }
}
exports.default = ServiceMenuPermission;
//# sourceMappingURL=ServiceMenuPermission.js.map