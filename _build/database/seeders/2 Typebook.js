"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Seeder_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Seeder"));
const Typebook_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Typebook"));
class default_1 extends Seeder_1.default {
    async run() {
        await Typebook_1.default.createMany([
            {
                "id": 1,
                "companies_id": 2,
                "name": "NASCIMENTO",
                "status": 1,
                "path": "NASCIMENTO",
                "books_id": 3,
            },
            {
                "id": 2,
                "companies_id": 2,
                "name": "CASAMENTO",
                "status": 1,
                "path": "CASAMENTO",
                "books_id": 2,
            },
            {
                "id": 3,
                "companies_id": 2,
                "name": "B Auxiliar",
                "status": 1,
                "path": "BAUXILIAR",
                "books_id": 2,
            },
            {
                "id": 4,
                "companies_id": 2,
                "name": "Óbito",
                "status": 1,
                "path": "OBITO",
                "books_id": 4,
            }
        ]);
    }
}
exports.default = default_1;
//# sourceMappingURL=2%20Typebook.js.map