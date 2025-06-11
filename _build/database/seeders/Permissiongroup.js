"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Seeder_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Seeder"));
const Permissiongroup_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Permissiongroup"));
class default_1 extends Seeder_1.default {
    async run() {
        await Permissiongroup_1.default.createMany([
            {
                id: 32,
                name: "Excluir Imagem - Tela de Visualização de Imagens",
                desc: "Excluir Imagem - Tela de Livros -> Visualizar Imagens -> Botão Excluir"
            },
        ]);
    }
}
exports.default = default_1;
//# sourceMappingURL=Permissiongroup.js.map