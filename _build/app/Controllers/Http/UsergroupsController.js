"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const Usergroup_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Usergroup"));
class UsergroupsController {
    async index({ auth, response }) {
        await auth.use('api').authenticate();
        try {
            const data = await Usergroup_1.default.query()
                .where('inactive', false)
                .orderBy('name');
            return response.ok(data);
        }
        catch (error) {
            throw new BadRequestException_1.default('Erro ao buscar lançamentos', 401, error);
        }
    }
}
exports.default = UsergroupsController;
//# sourceMappingURL=UsergroupsController.js.map