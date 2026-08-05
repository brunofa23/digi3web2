"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Seeder_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Seeder"));
const Book_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Book"));
class default_1 extends Seeder_1.default {
    async run() {
        await Book_1.default.createMany([
            {
                "id": 2,
                "name": "CASAMENTO (LIVRO B)",
                "namefolder": "CASAMENTO",
                "status": 1
            },
            {
                "id": 3,
                "name": "NASCIMENTO (LIVRO A)",
                "namefolder": "NASCIMENTO",
                "status": 1
            },
            {
                "id": 4,
                "name": "OBITO (LIVRO C)",
                "namefolder": "OBITO",
                "status": 1
            },
            {
                "id": 5,
                "name": "LIVRO D (EDITAL)",
                "namefolder": "LIVROD",
                "status": 1
            },
            {
                "id": 6,
                "name": "LIVRO E",
                "namefolder": "LIVROE",
                "status": 1
            },
            {
                "id": 7,
                "name": "INDICES",
                "namefolder": "INDICES",
                "status": 1
            },
            {
                "id": 13,
                "name": "DOCUMENTOS",
                "namefolder": "DOCUMENTOS",
                "status": 0
            },
            {
                "id": 16,
                "name": "NOTAS",
                "namefolder": "NOTAS",
                "status": 1
            },
            {
                "id": 17,
                "name": "IDPESSOAL",
                "namefolder": "IDPESSOAL",
                "status": 0
            },
            {
                "id": 18,
                "name": "TRANSCRIÇÕES",
                "namefolder": "TRANSCRICOES",
                "status": 1
            },
            {
                "id": 21,
                "name": "PREATD",
                "namefolder": "PREATD",
                "status": 1
            },
            {
                "id": 22,
                "name": "CARTOSOFT",
                "namefolder": "CARTOSOFT",
                "status": 1
            },
            {
                "id": 23,
                "name": "MANDADOS",
                "namefolder": "MANDADOS",
                "status": 1
            }
        ]);
    }
}
exports.default = default_1;
//# sourceMappingURL=1%20Book.js.map