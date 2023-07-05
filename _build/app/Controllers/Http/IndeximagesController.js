"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Indeximage_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Indeximage"));
const Application_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Application"));
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const format_1 = __importDefault(require("../../Services/Dates/format"));
const formatDate = new format_1.default(new Date);
const FileRename = require('../../Services/fileRename/fileRename');
const fs = require('fs');
const path = require('path');
const { Logtail } = require("@logtail/node");
const logtail = new Logtail("2QyWC3ehQAWeC6343xpMSjTQ");
class IndeximagesController {
    async store({ request, response }) {
        const body = request.only(Indeximage_1.default.fillable);
        try {
            const data = await Indeximage_1.default.create(body);
            return response.status(201).send(data);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401, error);
        }
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
    async destroy({ auth, request, params, response }) {
        const { companies_id } = await auth.use('api').authenticate();
        try {
            const listOfImagesToDeleteGDrive = await Indeximage_1.default.query()
                .preload('typebooks')
                .where('typebooks_id', '=', params.typebooks_id)
                .andWhere('bookrecords_id', "=", params.bookrecords_id)
                .andWhere('companies_id', "=", companies_id)
                .andWhere('file_name', "like", params.file_name);
            if (listOfImagesToDeleteGDrive.length > 0) {
                var file_name = listOfImagesToDeleteGDrive.map(function (item) {
                    return { file_name: item.file_name, path: item.typebooks.path };
                });
                console.log("entrei do delete...", file_name);
                FileRename.deleteFile(file_name);
            }
            await Indeximage_1.default.query()
                .where('typebooks_id', '=', params.typebooks_id)
                .andWhere('bookrecords_id', "=", params.bookrecords_id)
                .andWhere('companies_id', "=", companies_id)
                .andWhere('file_name', "like", params.file_name)
                .delete();
            return response.status(201).send({ message: "Excluido com sucesso!!" });
        }
        catch (error) {
            return error;
        }
    }
    async update({ request, params, response }) {
        const body = request.only(Indeximage_1.default.fillable);
        body.bookrecords_id = params.id;
        body.typebooks_id = params.id2;
        body.seq = params.id;
        try {
            const data = await Indeximage_1.default
                .query()
                .where('bookrecords_id', '=', body.bookrecords_id)
                .where('typebooks_id', '=', body.typebooks_id)
                .where('seq', '=', body.seq);
            await data.fill(body).save();
            return response.status(201).send(data);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401);
        }
    }
    async uploads({ auth, request, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const images = request.files('images', {
            size: '6mb',
            extnames: ['jpg', 'png', 'jpeg', 'pdf', 'JPG', 'PNG', 'JPEG', 'PDF']
        });
        const { dataImages } = request['requestBody'];
        const files = await FileRename.transformFilesNameToId(images, params, authenticate.companies_id, false, dataImages);
        logtail.info("ARQUIVOS INDEXADOS>>>", files);
        logtail.flush();
        return response.status(201).send({ files, message: "Arquivo Salvo com sucesso!!!" });
    }
    async uploadCapture({ auth, request, params }) {
        const authenticate = await auth.use('api').authenticate();
        const { imageCaptureBase64, cod, id } = request.requestData;
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
        const dateNow = formatDate.formatDate(new Date);
        const file_name = `Id${id}_(${cod})_${params.typebooks_id}_${dateNow}`;
        console.log("FILENAME:::", file_name);
        fs.writeFile(`${folderPath}/${file_name}.jpeg`, base64Image, { encoding: 'base64' }, function (err) {
            logtail.info('File created', { folderPath });
        });
        const file = await FileRename.transformFilesNameToId(`${folderPath}/${file_name}.jpeg`, params, authenticate.companies_id, true);
        return { sucesso: "sucesso", file, typebook: params.typebooks_id };
    }
    async download({ auth, params, request }) {
        const body = request.only(Indeximage_1.default.fillable);
        const fileName = params.id;
        const authenticate = await auth.use('api').authenticate();
        const fileDownload = await FileRename.downloadImage(fileName, authenticate.companies_id);
        return { fileDownload, fileName, extension: path.extname(fileName), body };
    }
}
exports.default = IndeximagesController;
//# sourceMappingURL=IndeximagesController.js.map