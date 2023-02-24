"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Seeder_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Seeder"));
const Indeximage_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Indeximage"));
class default_1 extends Seeder_1.default {
    async run() {
        await Indeximage_1.default.createMany([
            {
                bookrecords_id: 3,
                typebooks_id: 8,
                companies_id: 1,
                seq: 0,
                ext: 'jgp',
                file_name: 'teste',
                previous_file_name: 'teste anterior',
                created_at: null,
                updated_at: null,
            },
            {
                bookrecords_id: 4,
                typebooks_id: 8,
                companies_id: 1,
                seq: 0,
                ext: 'jgp',
                file_name: 'teste 1',
                previous_file_name: 'teste anterior',
                created_at: null,
                updated_at: null,
            },
            {
                bookrecords_id: 5,
                typebooks_id: 6,
                companies_id: 1,
                seq: 0,
                ext: 'jgp',
                file_name: 'teste 2',
                previous_file_name: 'teste anterior',
                created_at: null,
                updated_at: null,
            },
            {
                bookrecords_id: 5,
                typebooks_id: 6,
                companies_id: 1,
                seq: 1,
                ext: 'jgp',
                file_name: 'teste 2',
                previous_file_name: 'teste anterior',
                created_at: null,
                updated_at: null,
            },
            {
                bookrecords_id: 6,
                typebooks_id: 6,
                companies_id: 1,
                seq: 0,
                ext: 'jgp',
                file_name: 'teste 2',
                previous_file_name: 'teste anterior',
                created_at: null,
                updated_at: null,
            },
            {
                bookrecords_id: 6,
                typebooks_id: 6,
                companies_id: 1,
                seq: 1,
                ext: 'jgp',
                file_name: 'teste 2',
                previous_file_name: 'teste anterior',
                created_at: null,
                updated_at: null,
            },
        ]);
    }
}
exports.default = default_1;
//# sourceMappingURL=4%20Indeximage.js.map