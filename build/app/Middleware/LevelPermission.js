"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class LevelPermission {
    async handle({ auth, response }, next, customGuards) {
        await auth.use('api').authenticate();
        const user = auth.use('api').user;
        for (const guard of customGuards) {
            if (guard === 'superuser' && !user?.superuser) {
                return response.unauthorized({ error: 'Unauthorized: su' });
            }
            if (!isNaN(parseInt(guard)) && user?.permission_level < parseInt(guard)) {
                return response.unauthorized({ error: 'Unauthorized: level' });
            }
        }
        await next();
    }
}
exports.default = LevelPermission;
//# sourceMappingURL=LevelPermission.js.map