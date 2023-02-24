"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Indeximage_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Indeximage"));
const FileRename = require('../../Services/fileRename/fileRename');
class IndeximagesController {
    async store({ request, response }) {
        const body = request.only(Indeximage_1.default.fillable);
        const data = await Indeximage_1.default.create(body);
        response.status(201);
        return {
            message: "Criado com sucesso",
            data: data,
        };
    }
    async index({ auth, response }) {
        const authenticate = await auth.use('api').authenticate();
        const data = await Indeximage_1.default.query();
        return response.send({ data });
    }
    async show({ params }) {
        const data = await Indeximage_1.default.findOrFail(params.id);
        return {
            data: data,
        };
    }
    async destroy({ params }) {
        const data = await Indeximage_1.default.findOrFail(params.id);
        await data.delete();
        return {
            message: "Livro excluido com sucesso.",
            data: data
        };
    }
    async update({ request, params }) {
        const body = request.only(Indeximage_1.default.fillable);
        body.bookrecords_id = params.id;
        body.typebooks_id = params.id2;
        body.seq = params.id3;
        const data = await Indeximage_1.default
            .query()
            .where('bookrecords_id', '=', body.bookrecords_id)
            .where('typebooks_id', '=', body.typebooks_id)
            .where('seq', '=', body.seq);
        await data.fill(body).save();
        return {
            message: 'Tipo de Livro cadastrado com sucesso!!',
            data: data,
            params: params
        };
    }
    async uploads({ auth, request, params }) {
        const authenticate = await auth.use('api').authenticate();
        const images = request.files('images', {
            size: '6mb',
            extnames: ['jpg', 'png', 'jpeg', 'pdf']
        });
        console.log("passei pelo Upload...");
        const files = await FileRename.transformFilesNameToId(images, params, authenticate.companies_id);
        return files;
        console.log("FINALIZADO!!!");
    }
    async download({ auth, params }) {
        const fileName = params.id;
        const authenticate = await auth.use('api').authenticate();
        const fileDownload = await FileRename.downloadImage(fileName, authenticate.companies_id);
        console.log(">>>>>>>FILEINFORMATRION", fileName);
        return { fileDownload, fileName };
    }
}
exports.default = IndeximagesController;
//# sourceMappingURL=IndeximagesController.js.map