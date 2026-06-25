"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = global[Symbol.for('ioc.use')]("App/Services/util");
class IndexImagePermission {
    async handle({ auth }, next, customGuards) {
        const authenticate = await auth.use('api').authenticate();
        const permissions = auth.use('api').token?.meta.payload.permissions;
        for (const guard of customGuards) {
            if (guard === 'get') {
                await next();
            }
            if (guard === 'post') {
                await next();
                return;
            }
            if (guard === 'patch') {
                await next();
            }
            if (guard === 'destroy' && (0, util_1.verifyPermission)(authenticate.superuser, permissions, 32)) {
                await next();
                return;
            }
        }
    }
}
exports.default = IndexImagePermission;
//# sourceMappingURL=IndexImagePermission.js.map