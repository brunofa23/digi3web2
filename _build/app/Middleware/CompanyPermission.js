"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CompanyPermission {
    async handle({ auth, response, params }, next) {
        await auth.use('api').authenticate();
        const user = auth.use('api').user;
        const { company_id } = params;
        if (user.superuser || !company_id) {
            await next();
        }
        else {
            if (company_id != user?.companies_id)
                return response.unauthorized({ error: 'Unauthorized: company_id' });
            await next();
        }
    }
}
exports.default = CompanyPermission;
//# sourceMappingURL=CompanyPermission.js.map