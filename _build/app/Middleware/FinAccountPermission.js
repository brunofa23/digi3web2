"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = global[Symbol.for('ioc.use')]("App/Services/util");
class FinAccountPermission {
    async handle({ auth }, next, customGuards) {
        const authenticate = await auth.use('api').authenticate();
        const permissions = auth.use('api').token?.meta.payload.permissions;
        const action = customGuards[0];
        if (action === 'get' && (0, util_1.verifyPermission)(authenticate.superuser, permissions, 33)) {
            await next();
            return;
        }
        await next();
    }
}
exports.default = FinAccountPermission;
//# sourceMappingURL=FinAccountPermission.js.map