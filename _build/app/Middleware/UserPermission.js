"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const validations_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/Validations/validations"));
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const util_1 = global[Symbol.for('ioc.use')]("App/Services/util");
class UserPermission {
    async handle({ auth }, next, customGuards) {
        const authenticate = await auth.use('api').authenticate();
        const permissions = auth.use('api').token?.meta.payload.permissions;
        for (const guard of customGuards) {
            if (guard === 'get') {
                await next();
                return;
            }
            else if (guard === 'post' && authenticate.superuser) {
                await next();
                return;
            }
            else if (guard === 'patch' && authenticate.superuser) {
                await next();
                return;
            }
            else if (guard === 'authorizeAccessImages') {
                if ((0, util_1.verifyPermission)(authenticate.superuser, permissions, 30)) {
                    await next();
                    return;
                }
                else {
                    const errorValidation = await new validations_1.default('user_error_201');
                    throw new BadRequestException_1.default(errorValidation.messages, errorValidation.status, errorValidation.code);
                }
            }
            else {
                let errorValidation = await new validations_1.default('error_10');
                throw new BadRequestException_1.default(errorValidation.messages, errorValidation.status, errorValidation.code);
            }
        }
    }
}
exports.default = UserPermission;
//# sourceMappingURL=UserPermission.js.map