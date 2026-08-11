"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Seeder_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Seeder"));
const Company_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Company"));
class default_1 extends Seeder_1.default {
    async run() {
        await Company_1.default.createMany([
            {
                "id": 1,
                "name": "Digi3",
                "shortname": "Digi3",
                "address": "Rua Maria Magalhães de Souza",
                "number": 180,
                "complement": "Casa",
                "postalcode": 30820530,
                "district": "Alípio de Melo",
                "city": "Belo Horizonte",
                "state": "MG",
                "cnpj": 1111111111111111,
                "responsablename": "Vandir",
                "phoneresponsable": 31985228619,
                "email": "sistemasdigi3@gmail.com",
                "status": 1,
                "created_at": "",
                "updated_at": ""
            }
        ]);
    }
}
exports.default = default_1;
//# sourceMappingURL=1%20Company.js.map