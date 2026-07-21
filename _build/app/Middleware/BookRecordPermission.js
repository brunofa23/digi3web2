"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = global[Symbol.for('ioc.use')]("App/Services/util");
class BookRecordPermission {
    async handle({ auth, request, response }, next, customGuards) {
        const user = await auth.use('api').authenticate();
        const permissions = auth.use('api').token?.meta.payload.permissions || [];
        const isMaxBookRecordGuard = customGuards.some((guard) => guard === 'maxbookrecord');
        const hasBookRecordBlock = !user.superuser && (0, util_1.verifyPermission)(user.superuser, permissions, 37);
        const isCaptureMaxBookRecord = isMaxBookRecordGuard &&
            request.input('capture') === 'true' &&
            (0, util_1.verifyPermission)(user.superuser, permissions, 17);
        if (hasBookRecordBlock && !isCaptureMaxBookRecord) {
            return response.unauthorized({
                error: 'Você não tem permissão para acessar a tela de livros.',
            });
        }
        let allowed = false;
        for (const guard of customGuards) {
            if (guard === 'get') {
                allowed = true;
                break;
            }
            if (guard === 'maxbookrecord') {
                allowed = true;
                break;
            }
            if (guard === 'patch') {
                allowed = true;
                break;
            }
            if (guard === 'fastfind' && (0, util_1.verifyPermission)(user.superuser, permissions, 1)) {
                allowed = true;
                break;
            }
            if (guard === 'post' && (0, util_1.verifyPermission)(user.superuser, permissions, 22)) {
                allowed = true;
                break;
            }
            if (guard === 'destroy' && (0, util_1.verifyPermission)(user.superuser, permissions, 20)) {
                allowed = true;
                break;
            }
            if (guard === 'destroyManyBookRecords' && (0, util_1.verifyPermission)(user.superuser, permissions, 20)) {
                allowed = true;
                break;
            }
            if ((guard === 'generateOrUpdateBookrecords2' ||
                guard === 'createorupdatebookrecords' ||
                guard === 'generateOrUpdateBookrecords') &&
                (0, util_1.verifyPermission)(user.superuser, permissions, 21)) {
                allowed = true;
                break;
            }
        }
        if (!allowed) {
            return response.unauthorized({
                error: 'Você não tem permissão para executar esta ação.',
            });
        }
        await next();
    }
}
exports.default = BookRecordPermission;
//# sourceMappingURL=BookRecordPermission.js.map