"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = global[Symbol.for('ioc.use')]("App/Services/util");
class BookRecordPermission {
    async handle({ auth }, next, customGuards) {
        const authenticate = await auth.use('api').authenticate();
        const permissions = auth.use('api').token?.meta.payload.permissions;
        for (const guard of customGuards) {
            if (guard === 'get') {
                await next();
            }
            if (guard === 'fastfind' && (0, util_1.verifyPermission)(authenticate.superuser, permissions, 1)) {
                await next();
                return;
            }
            if (guard === 'post' && (0, util_1.verifyPermission)(authenticate.superuser, permissions, 4)) {
                await next();
                return;
            }
            if (guard === 'destroy' && (0, util_1.verifyPermission)(authenticate.superuser, permissions, 20)) {
                await next();
                return;
            }
            if (guard === 'destroyManyBookRecords' && (0, util_1.verifyPermission)(authenticate.superuser, permissions, 20)) {
                await next();
                return;
            }
            if ((guard === 'generateOrUpdateBookrecords2' || guard === 'createorupdatebookrecords' || guard === 'generateOrUpdateBookrecords')
                && (0, util_1.verifyPermission)(authenticate.superuser, permissions, 21)) {
                await next();
                return;
            }
        }
    }
}
exports.default = BookRecordPermission;
//# sourceMappingURL=BookRecordPermission.js.map