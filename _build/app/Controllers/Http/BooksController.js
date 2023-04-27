"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Book_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Book"));
class BooksController {
    async store({ request, response }) {
        const body = request.only(Book_1.default.fillable);
        response.send(body);
        const data = await Book_1.default.create(body);
        response.status(201);
        return {
            message: "Criado com sucesso",
            data: data,
        };
    }
    async index({ response }) {
        const books = await Book_1.default
            .query()
            .preload('typebooks');
        return response.send(books);
    }
    async update({ request, params }) {
        const body = request.only(Book_1.default.fillable);
        body.id = params.id;
        const data = await Book_1.default.findOrFail(body.id);
        await data.fill(body).save();
        return {
            message: 'Tipo de Livro cadastrado com sucesso!!',
            data: data,
            body: body,
            params: params.id
        };
    }
    async destroy({ params }) {
        const data = await Book_1.default.findOrFail(params.id);
        await data.delete();
        return {
            message: "Livro excluido com sucesso.",
            data: data
        };
    }
}
exports.default = BooksController;
//# sourceMappingURL=BooksController.js.map