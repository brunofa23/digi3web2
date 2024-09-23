"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Documenttype_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Documenttype"));
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
class DocumentTypesController {
    async index({ auth, response, request }) {
        try {
            const documentType = await Documenttype_1.default.query();
            return response.status(200).send(documentType);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401, 'erro');
        }
    }
}
exports.default = DocumentTypesController;
//# sourceMappingURL=DocumentTypesController.js.map