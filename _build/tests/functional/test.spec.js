"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const runner_1 = require("@japa/runner");
const Typebook_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Typebook"));
(0, runner_1.test)('test', async ({ client }) => {
    const books_id = await Typebook_1.default.findOrFail(236);
    console.log("######", books_id.books_id);
});
//# sourceMappingURL=test.spec.js.map