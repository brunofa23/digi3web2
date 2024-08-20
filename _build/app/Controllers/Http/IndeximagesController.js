"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Indeximage_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Indeximage"));
const Application_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Application"));
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const format_1 = __importDefault(require("../../Services/Dates/format"));
const Bookrecord_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Bookrecord"));
const Company_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Company"));
const Typebook_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Typebook"));
const formatDate = new format_1.default(new Date);
const FileRename = require('../../Services/fileRename/fileRename');
const fs = require('fs');
const path = require('path');
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
        const data = await Indeximage_1.default.query()
            .preload('typebooks', (queryIndex) => {
            queryIndex.where("id", 2)
                .andWhere('companies_id', '=', 16);
        })
            .where('bookrecords_id', '=', 12394)
            .andWhere('typebooks_id', '=', 2)
            .andWhere('companies_id', '=', 16);
        return response.send({ data });
    }
    async show({ params }) {
        const data = await Indeximage_1.default.findOrFail(params.id);
        return {
            data: data,
        };
    }
    async destroy({ auth, params, response }) {
        const { companies_id } = await auth.use('api').authenticate();
        try {
            const query = Indeximage_1.default.query()
                .preload('typebooks', (query) => {
                query.where('id', params.typebooks_id)
                    .andWhere('companies_id', companies_id);
            })
                .preload('company')
                .where('typebooks_id', '=', params.typebooks_id)
                .andWhere('bookrecords_id', "=", params.bookrecords_id)
                .andWhere('companies_id', "=", companies_id)
                .andWhere('file_name', "like", decodeURIComponent(params.file_name));
            const listOfImagesToDeleteGDrive = await query.first();
            if (listOfImagesToDeleteGDrive) {
                var file_name = { file_name: listOfImagesToDeleteGDrive.file_name, path: listOfImagesToDeleteGDrive.typebooks.path };
                FileRename.deleteFile([file_name], listOfImagesToDeleteGDrive.company.cloud);
            }
            await Indeximage_1.default.query()
                .where('typebooks_id', '=', params.typebooks_id)
                .andWhere('bookrecords_id', "=", params.bookrecords_id)
                .andWhere('companies_id', "=", companies_id)
                .andWhere('file_name', "like", decodeURIComponent(params.file_name))
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
        const company = await Company_1.default.find(authenticate.companies_id);
        const images = request.files('images', {
            size: '100mb',
            extnames: ['jpg', 'png', 'jpeg', 'pdf', 'JPG', 'PNG', 'JPEG', 'PDF'],
        });
        const { dataImages } = request['requestBody'];
        const { indexImagesInitial, updateImage } = request['requestData'];
        if (indexImagesInitial == 'true') {
            const listFilesImages = images.map((image) => {
                const imageName = image.clientName;
                return imageName;
            });
            const listFiles = await FileRename.indeximagesinitial("", authenticate.companies_id, company?.cloud, listFilesImages);
            for (const item of listFiles.bookRecord) {
                try {
                    await Bookrecord_1.default.create(item);
                }
                catch (error) {
                    console.log("ERRO BOOKRECORD::", error);
                }
            }
        }
        if (updateImage) {
            const query = Bookrecord_1.default.query()
                .where('typebooks_id', params.typebooks_id)
                .andWhere('companies_id', authenticate.companies_id)
                .andWhere('book', dataImages.book)
                .andWhere('side', dataImages.side)
                .andWhere('sheet', dataImages.sheet);
            if (dataImages.indexBook)
                query.andWhere('indexbook', dataImages.indexBook);
            const bookRecord = await query.first();
            if (!bookRecord || dataImages.sheet == 0) {
                const books_id = await Typebook_1.default.query().where('id', params.typebooks_id)
                    .andWhere('companies_id', authenticate.companies_id).first();
                const codBookrecord = await Bookrecord_1.default.query()
                    .where('typebooks_id', params.typebooks_id)
                    .andWhere('companies_id', authenticate.companies_id)
                    .max('cod as max_cod').firstOrFail();
                if (dataImages.sheet == 0 && books_id) {
                    const book = await Bookrecord_1.default.create({
                        typebooks_id: params.typebooks_id,
                        companies_id: authenticate.companies_id,
                        cod: (codBookrecord?.$extras.max_cod + 1),
                        books_id: books_id.books_id,
                        book: dataImages.book,
                        sheet: dataImages.sheet,
                        indexbook: dataImages.indexBook,
                    });
                    dataImages.id = book.id;
                }
                else if (books_id) {
                    const book = await Bookrecord_1.default.create({
                        typebooks_id: params.typebooks_id,
                        companies_id: authenticate.companies_id,
                        cod: (codBookrecord?.$extras.max_cod + 1),
                        books_id: books_id.books_id,
                        book: dataImages.book,
                        sheet: dataImages.sheet,
                        side: dataImages.side,
                        indexbook: dataImages.indexBook
                    });
                    dataImages.id = book.id;
                }
            }
        }
        const files = await FileRename.transformFilesNameToId(images, params, authenticate.companies_id, company?.cloud, false, dataImages);
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
        fs.writeFile(`${folderPath}/${file_name}.jpeg`, base64Image, { encoding: 'base64' }, function (err) {
            console.log('File created', { folderPath });
        });
        const file = await FileRename.transformFilesNameToId(`${folderPath}/${file_name}.jpeg`, params, authenticate.companies_id, true);
        return { sucesso: "sucesso", file, typebook: params.typebooks_id };
    }
    async download({ auth, params, request }) {
        const authenticate = await auth.use('api').authenticate();
        const { typebook_id } = request.only(['typebook_id']);
        const body = request.only(Indeximage_1.default.fillable);
        const fileName = params.id;
        const company = await Company_1.default.find(authenticate.companies_id);
        const fileDownload = await FileRename.downloadImage(fileName, typebook_id, authenticate.companies_id, company?.cloud);
        return { fileDownload: fileDownload.dataURI, fileName, extension: path.extname(fileName), body, size: fileDownload.size };
    }
}
exports.default = IndeximagesController;
//# sourceMappingURL=IndeximagesController.js.map