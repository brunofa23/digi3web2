"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Seeder_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Seeder"));
const Eventtype_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Eventtype"));
class default_1 extends Seeder_1.default {
    async run() {
        await Eventtype_1.default.createMany([
            {
                "id": 1,
                "name": "Criação de Livros",
                "description": ""
            },
            {
                "id": 2,
                "name": "Ajustar Imagens",
                "description": ""
            },
            {
                "id": 3,
                "name": "Outros",
                "description": ""
            },
        ]);
    }
}
exports.default = default_1;
//# sourceMappingURL=Eventtype.js.map