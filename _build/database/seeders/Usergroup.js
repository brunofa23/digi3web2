"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Seeder_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Seeder"));
const Usergroup_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Usergroup"));
class default_1 extends Seeder_1.default {
    async run() {
        await Usergroup_1.default.createMany([
            {
                name: "Digi3",
            },
            {
                name: "Titular",
            },
            {
                name: "Substituto",
            },
            {
                name: "Escrevente",
            },
            {
                name: "Auxiliar",
            }
        ]);
    }
}
exports.default = default_1;
//# sourceMappingURL=Usergroup.js.map