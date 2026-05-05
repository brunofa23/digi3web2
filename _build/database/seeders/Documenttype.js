"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Seeder_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Seeder"));
const Documenttype_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Documenttype"));
class default_1 extends Seeder_1.default {
    async run() {
        await Documenttype_1.default.query().delete();
        await Documenttype_1.default.createMany([
            {
                "id": 1,
                "name": "REGISTRO",
            },
            {
                "id": 2,
                "name": "CERTIDÃO",
            },
            {
                "id": 3,
                "name": "PROC. HABILITAÇÃO",
            },
            {
                "id": 4,
                "name": "MANDADOS",
            },
            {
                "id": 5,
                "name": "FOLHA DE SEGURANÇA",
            },
            {
                "id": 6,
                "name": "CPF",
            },
            {
                "id": 7,
                "name": "COMUNICAÇÃO RECEBIDA",
            },
            {
                "id": 8,
                "name": "COMUNICAÇÃO EXPEDIDA",
            },
            {
                "id": 9,
                "name": "COMUNICAÇÃO INTERNA",
            },
        ]);
    }
}
exports.default = default_1;
//# sourceMappingURL=Documenttype.js.map