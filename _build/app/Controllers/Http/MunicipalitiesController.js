"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const ufItems = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
    'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];
class MunicipalitiesController {
    async index({ auth, request }) {
        await auth.use('api').authenticate();
        const uf = String(request.input('uf') || '').trim().toUpperCase();
        if (!ufItems.includes(uf)) {
            throw new BadRequestException_1.default('Informe uma UF válida.', 400, 'municipality_invalid_uf');
        }
        return Database_1.default
            .from('municipalities')
            .where('uf', uf)
            .select('ibge_code as ibgeCode', 'name', 'uf', 'uf_ibge_code as ufIbgeCode')
            .orderBy('name', 'asc');
    }
}
exports.default = MunicipalitiesController;
//# sourceMappingURL=MunicipalitiesController.js.map