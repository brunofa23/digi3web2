"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const validations_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/Validations/validations"));
class TokenToImagesPermission {
    async handle({ auth }, next, customGuards) {
        const authenticate = await auth.use('api').authenticate();
        for (const guard of customGuards) {
            if (guard === 'post' && (authenticate.permission_level >= 4 || authenticate.superuser)) {
                await next();
            }
            else {
                let errorValidation = await new validations_1.default('user_error_201');
                throw new BadRequestException_1.default(errorValidation.messages, errorValidation.status, errorValidation.code);
            }
        }
    }
}
exports.default = TokenToImagesPermission;
//# sourceMappingURL=TokenToImagesPermission.js.map