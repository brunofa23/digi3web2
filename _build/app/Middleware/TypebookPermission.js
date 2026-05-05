"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const validations_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/Validations/validations"));
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
class TypebookPermission {
    async handle({ auth }, next, customGuards) {
        const user = await auth.use('api').authenticate();
        let allowed = false;
        for (const guard of customGuards) {
            if (guard === 'get' && user.permission_level >= 0) {
                allowed = true;
                break;
            }
            if (guard === 'post' && (user.permission_level >= 4 || user.superuser)) {
                allowed = true;
                break;
            }
            if (guard === 'patch' && (user.permission_level >= 4 || user.superuser)) {
                allowed = true;
                break;
            }
            if (guard === 'destroy' && (user.permission_level >= 5 || user.superuser)) {
                allowed = true;
                break;
            }
        }
        if (!allowed) {
            const errorValidation = await new validations_1.default('error_10');
            throw new BadRequestException_1.default(errorValidation.messages, errorValidation.status, errorValidation.code);
        }
        await next();
    }
}
exports.default = TypebookPermission;
//# sourceMappingURL=TypebookPermission.js.map