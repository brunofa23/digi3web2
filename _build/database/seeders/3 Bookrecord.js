"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Seeder_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Seeder"));
const Bookrecord_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Bookrecord"));
class default_1 extends Seeder_1.default {
    async run() {
        await Bookrecord_1.default.createMany([]);
    }
}
exports.default = default_1;
//# sourceMappingURL=3%20Bookrecord.js.map