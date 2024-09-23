"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Seeder_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Seeder"));
const Documenttype_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Documenttype"));
class default_1 extends Seeder_1.default {
    async run() {
        await Documenttype_1.default.createMany([
            {
                "id": 1,
                "name": "FOLHA DE SEGURANÇA",
            },
            {
                "id": 2,
                "name": "NASCIMENTO (LIVRO A)",
            },
            {
                "id": 3,
                "name": "OBITO (LIVRO C)",
            }
        ]);
    }
}
exports.default = default_1;
//# sourceMappingURL=Documenttype.js.map