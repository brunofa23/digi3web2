"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Indeximage_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Indeximage"));
const FileRename = require('../../Services/fileRename/fileRename');
const Application_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Application"));
const luxon_1 = require("luxon");
const Date = require('../../Services/Dates/format');
const { Logtail } = require("@logtail/node");
const logtail = new Logtail("2QyWC3ehQAWeC6343xpMSjTQ");
const fs = require('fs');
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
        await auth.use('api').authenticate();
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
        body.seq = params.id;
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
        const files = await FileRename.transformFilesNameToId(images, params, authenticate.companies_id);
        return files;
    }
    async uploadCapture({ auth, request, params }) {
        logtail.info("Entrei no upload capture");
        const authenticate = await auth.use('api').authenticate();
        const { imageCaptureBase64, cod, id } = request.requestData;
        logtail.info('request>>>', { cod, id });
        let base64Image = imageCaptureBase64.split(';base64,').pop();
        const folderPath = Application_1.default.tmpPath(`/uploads/Client_${authenticate.companies_id}`);
        try {
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath);
            }
        }
        catch (error) {
            return error;
        }
        var dateNow = Date.format(luxon_1.DateTime.now());
        const file_name = `Id${id}_(${cod})_${params.typebooks_id}_${dateNow}`;
        fs.writeFile(`${folderPath}/${file_name}.jpeg`, base64Image, { encoding: 'base64' }, function (err) {
            console.log('File created', folderPath);
            logtail.info('File created', { folderPath });
        });
        const file = await FileRename.transformFilesNameToId(`${folderPath}/${file_name}.jpeg`, params, authenticate.companies_id, true);
        console.log(">>>FINAL NO UPLOAD CAPTURE");
        logtail.info('>>>FINAL NO UPLOAD CAPTURE');
        return { sucesso: "sucesso", file, typebook: params.typebooks_id };
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