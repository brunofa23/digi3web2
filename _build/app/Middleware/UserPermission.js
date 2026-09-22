"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const validations_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/Validations/validations"));
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const util_1 = global[Symbol.for('ioc.use')]("App/Services/util");
class UserPermission {
    constructor() {
        this.usersPermissiongroupId = 5;
    }
    async handle({ auth }, next, customGuards) {
        const authenticate = await auth.use('api').authenticate();
        const permissions = auth.use('api').token?.meta.payload.permissions;
        for (const guard of customGuards) {
            if (guard === 'get' && (0, util_1.verifyPermission)(Boolean(authenticate.superuser), permissions, this.usersPermissiongroupId)) {
                await next();
                return;
            }
            else if (guard === 'post' && (0, util_1.verifyPermission)(Boolean(authenticate.superuser), permissions, this.usersPermissiongroupId)) {
                await next();
                return;
            }
            else if (guard === 'patch' && (0, util_1.verifyPermission)(Boolean(authenticate.superuser), permissions, this.usersPermissiongroupId)) {
                await next();
                return;
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