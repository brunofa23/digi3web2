"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Token_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Token"));
class TokensController {
    async store({ auth, response, request }) {
        const authenticate = await auth.use('api').authenticate();
        const data = request.only(Token_1.default.fillable);
        if (authenticate.companies_id == 1 && authenticate.superuser == true) {
            try {
                const searchPayload = { name: data.name };
                const persistancePayload = data;
                await Token_1.default.updateOrCreate(searchPayload, persistancePayload);
                return response.status(200).send("salvo");
            }
            catch (error) {
                throw error;
            }
        }
        else
            return "não liberado";
    }
}
exports.default = TokensController;
//# sourceMappingURL=TokensController.js.map