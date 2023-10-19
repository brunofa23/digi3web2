"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const validations_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/Validations/validations"));
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
class LevelPermission {
    async handle({ auth, response }, next, customGuards) {
        const authenticate = await auth.use('api').authenticate();
        if (authenticate.superuser) {
            await next();
        }
        for (const guard of customGuards) {
            //console.log("entrei no LEVELPERMISSIONS", guard);
            if (guard === 'get')
                await next();
            else {
                let errorValidation = await new validations_1.default('error_10');
                throw new BadRequestException_1.default(errorValidation.messages, errorValidation.status, errorValidation.code);
            }
        }
    }
}
exports.default = LevelPermission;
//# sourceMappingURL=LevelPermission.js.map