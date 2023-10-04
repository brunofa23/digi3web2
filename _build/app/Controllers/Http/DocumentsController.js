"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Document_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Document"));
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const Indeximage_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Indeximage"));
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const BadRequestException_2 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const fileRename = require('../../Services/fileRename/fileRename');
class DocumentsController {
    async index({ auth, request, params, response }) {
        const documentPayload = request.only(Document_1.default.fillable);
        console.log("ONLY>>");
        try {
            const data = await Document_1.default.all();
            return response.status(200).send(data);
        }
        catch (error) {
            return error;
        }
    }
    async store({ auth, request, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const documentPayload = request.only(Document_1.default.fillable);
        documentPayload.companies_id = authenticate.companies_id;
        try {
            const data = await Document_1.default.create(documentPayload);
            return response.status(201).send(data);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401, error);
        }
    }
    async update({ auth, request, params, response }) {
        const { companies_id } = await auth.use('api').authenticate();
        const body = request.only(Document_1.default.fillable);
        body.id = params.id;
        body.companies_id = companies_id;
        try {
            const data = await Document_1.default.findOrFail(body.id);
            await data.fill(body).save();
            return response.status(201).send({ data, params: params.id });
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401, error);
        }
    }
    async destroy({ auth, request, params, response }) {
        const { companies_id } = await auth.use('api').authenticate();
        try {
            const listOfImagesToDeleteGDrive = await Indeximage_1.default.query()
                .preload('typebooks')
                .where('typebooks_id', '=', params.typebooks_id)
                .andWhere('documents_id', "=", params.id)
                .andWhere('companies_id', "=", companies_id);
            if (listOfImagesToDeleteGDrive.length > 0) {
                var file_name = listOfImagesToDeleteGDrive.map(function (item) {
                    return { file_name: item.file_name, path: item.typebooks.path };
                });
                fileRename.deleteFile(file_name);
            }
            await Indeximage_1.default.query()
                .where('typebooks_id', '=', params.typebooks_id)
                .andWhere('bookrecords_id', "=", params.id)
                .andWhere('companies_id', "=", companies_id).delete();
            const data = await Document_1.default.query()
                .where('id', "=", params.id)
                .andWhere('typebooks_id', '=', params.typebooks_id)
                .andWhere('companies_id', "=", companies_id).delete();
            return response.status(201).send({ data, message: "Excluido com sucesso!!" });
        }
        catch (error) {
            return error;
        }
    }
    async destroyManyBookRecords({ auth, request, response }) {
        console.log("destroy many documents>>>");
        const { companies_id } = await auth.use('api').authenticate();
        const { typebooks_id, Box, startCod, endCod, deleteImages } = request.only(['typebooks_id', 'Box', 'startCod', 'endCod', 'deleteImages']);
        async function deleteIndexImages() {
            try {
                const deleteData = await Indeximage_1.default
                    .query()
                    .delete()
                    .whereIn("documents_id", Database_1.default.from('documents')
                    .select('id')
                    .where('typebooks_id', '=', typebooks_id)
                    .andWhere('companies_id', '=', companies_id)
                    .whereRaw(query));
                return response.status(201).send({ deleteData });
            }
            catch (error) {
                return error;
            }
        }
        async function deleteBookrecord() {
            try {
                const data = await Document_1.default
                    .query()
                    .where('typebooks_id', '=', typebooks_id)
                    .andWhere('companies_id', '=', companies_id)
                    .whereRaw(query)
                    .delete();
                return response.status(201).send({ data });
            }
            catch (error) {
                return error;
            }
        }
        async function deleteImagesGoogle() {
            try {
                const listOfImagesToDeleteGDrive = await Indeximage_1.default
                    .query()
                    .preload('typebooks')
                    .whereIn("documents_id", Database_1.default.from('documents')
                    .select('id')
                    .where('typebooks_id', '=', typebooks_id)
                    .andWhere('companies_id', '=', companies_id)
                    .whereRaw(query));
                if (listOfImagesToDeleteGDrive.length > 0) {
                    var file_name = listOfImagesToDeleteGDrive.map(function (item) {
                        return { file_name: item.file_name, path: item.typebooks.path };
                    });
                    fileRename.deleteFile(file_name);
                }
            }
            catch (error) {
                return error;
            }
        }
        let query = '1 = 1';
        if (Box == undefined)
            return null;
        if (typebooks_id != undefined) {
            if (Box != undefined) {
                query += ` and book=${Box} `;
            }
            if (startCod != undefined && endCod != undefined && startCod > 0 && endCod > 0)
                query += ` and cod>=${startCod} and cod <=${endCod} `;
            try {
                if (deleteImages == 1) {
                    console.log("EXCLUI SOMENTE LIVRO");
                    await deleteIndexImages();
                    await deleteBookrecord();
                }
                else if (deleteImages == 2) {
                    console.log("EXCLUI SOMENTE IMAGENS");
                    await deleteImagesGoogle();
                    await deleteIndexImages();
                }
                else if (deleteImages == 3) {
                    console.log("EXCLUI TUDO");
                    await deleteImagesGoogle();
                    await deleteIndexImages();
                    await deleteBookrecord();
                }
            }
            catch (error) {
                throw new BadRequestException_2.default('Bad Request update', 401, 'bookrecord_error_102');
            }
        }
    }
}
exports.default = DocumentsController;
//# sourceMappingURL=DocumentsController.js.map