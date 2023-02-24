"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Seeder_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Seeder"));
const User_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/User"));
class default_1 extends Seeder_1.default {
    async run() {
        await User_1.default.createMany([
            {
                "companies_id": 1,
                "name": "Administrador",
                "username": "admin",
                "email": "admin@digi3.com.br",
                "password": "12345",
                "remember_me_token": "12345",
                "permission_level": 5,
                "superuser": 1,
                "status": 1
            },
            {
                "companies_id": 1,
                "name": "Bruno",
                "username": "admin2",
                "email": "teste@teste.br",
                "password": "12345",
                "remember_me_token": "bruno",
                "permission_level": 3,
                "status": 0,
            },
        ]);
    }
}
exports.default = default_1;
//# sourceMappingURL=3%20User.js.map