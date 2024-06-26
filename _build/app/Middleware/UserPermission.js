"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const validations_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/Validations/validations"));
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
class UserPermission {
    async handle({ auth }, next, customGuards) {
        const authenticate = await auth.use('api').authenticate();
        for (const guard of customGuards) {
            if (guard === 'get' && authenticate.permission_level >= 0) {
                await next();
            }
            else if (guard === 'post' && (authenticate.permission_level >= 5 || authenticate.superuser)) {
                await next();
            }
            else if (guard === 'patch' && (authenticate.permission_level >= 5 || authenticate.superuser)) {
                await next();
            }
            else if (guard === 'authorizeAccessImages' && (authenticate.permission_level >= 5 || authenticate.superuser)) {
                await next();
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