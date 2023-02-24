"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Seeder_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Seeder"));
const Bookrecord_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Bookrecord"));
class default_1 extends Seeder_1.default {
    async run() {
        await Bookrecord_1.default.createMany([
            {
                "typebooks_id": 1,
                "books_id": 3,
                "companies_id": 1,
                "cod": 1,
                "book": 1,
                "sheet": 1,
                "side": "F",
                "approximate_term": null,
                "index": 0,
                "obs": null,
                "letter": null,
                "year": null,
                "model": null
            },
            {
                "typebooks_id": 1,
                "books_id": 3,
                "companies_id": 1,
                "cod": 2,
                "book": 1,
                "sheet": 2,
                "side": "F",
                "approximate_term": null,
                "index": 0,
                "obs": null,
                "letter": null,
                "year": null,
                "model": null
            },
            {
                "typebooks_id": 1,
                "books_id": 3,
                "companies_id": 1,
                "cod": 3,
                "book": 1,
                "sheet": 3,
                "side": "F",
                "approximate_term": null,
                "index": 0,
                "obs": null,
                "letter": null,
                "year": null,
                "model": null
            },
            {
                "typebooks_id": 1,
                "books_id": 3,
                "companies_id": 1,
                "cod": 4,
                "book": 1,
                "sheet": 4,
                "side": "F",
                "approximate_term": null,
                "index": 0,
                "obs": null,
                "letter": null,
                "year": null,
                "model": null
            }, {
                "typebooks_id": 1,
                "books_id": 3,
                "companies_id": 1,
                "cod": 1,
                "book": 2,
                "sheet": 1,
                "side": "F",
                "approximate_term": null,
                "index": 0,
                "obs": null,
                "letter": null,
                "year": null,
                "model": null
            },
            {
                "typebooks_id": 1,
                "books_id": 3,
                "companies_id": 1,
                "cod": 2,
                "book": 2,
                "sheet": 2,
                "side": "F",
                "approximate_term": null,
                "index": 0,
                "obs": null,
                "letter": null,
                "year": null,
                "model": null
            },
            {
                "typebooks_id": 1,
                "books_id": 3,
                "companies_id": 1,
                "cod": 3,
                "book": 2,
                "sheet": 3,
                "side": "F",
                "approximate_term": null,
                "index": 0,
                "obs": null,
                "letter": null,
                "year": null,
                "model": null
            },
            {
                "typebooks_id": 2,
                "books_id": 2,
                "companies_id": 1,
                "cod": 1,
                "book": 1,
                "sheet": 1,
                "side": "F",
                "approximate_term": null,
                "index": 0,
                "obs": null,
                "letter": null,
                "year": null,
                "model": null
            },
            {
                "typebooks_id": 2,
                "books_id": 2,
                "companies_id": 1,
                "cod": 2,
                "book": 1,
                "sheet": 2,
                "side": "F",
                "approximate_term": null,
                "index": 0,
                "obs": null,
                "letter": null,
                "year": null,
                "model": null
            },
            {
                "typebooks_id": 2,
                "books_id": 2,
                "companies_id": 1,
                "cod": 3,
                "book": 1,
                "sheet": 3,
                "side": "F",
                "approximate_term": null,
                "index": 0,
                "obs": null,
                "letter": null,
                "year": null,
                "model": null
            },
            {
                "typebooks_id": 2,
                "books_id": 2,
                "companies_id": 1,
                "cod": 4,
                "book": 1,
                "sheet": 4,
                "side": "F",
                "approximate_term": null,
                "index": 0,
                "obs": null,
                "letter": null,
                "year": null,
                "model": null
            },
            {
                "typebooks_id": 1,
                "books_id": 3,
                "companies_id": 2,
                "cod": 1,
                "book": 1,
                "sheet": 1,
                "side": "F",
                "approximate_term": null,
                "index": 0,
                "obs": null,
                "letter": null,
                "year": null,
                "model": null
            },
            {
                "typebooks_id": 1,
                "books_id": 3,
                "companies_id": 2,
                "cod": 2,
                "book": 1,
                "sheet": 2,
                "side": "F",
                "approximate_term": null,
                "index": 0,
                "obs": null,
                "letter": null,
                "year": null,
                "model": null
            },
            {
                "typebooks_id": 1,
                "books_id": 3,
                "companies_id": 2,
                "cod": 3,
                "book": 1,
                "sheet": 3,
                "side": "F",
                "approximate_term": null,
                "index": 0,
                "obs": null,
                "letter": null,
                "year": null,
                "model": null
            }
        ]);
    }
}
exports.default = default_1;
//# sourceMappingURL=3%20Bookrecord.js.map