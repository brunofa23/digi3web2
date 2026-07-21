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
const Document_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Document"));
const ImageUploadJob_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/ImageUploadJob"));
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const AuditLogger_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/Audit/AuditLogger"));
const sharp_1 = __importDefault(require("sharp"));
const formatDate = new format_1.default(new Date);
const FileRename = require('../../Services/fileRename/fileRename');
const fs = require('fs');
const path = require('path');
async function createUploadJob(payload) {
    try {
        return await ImageUploadJob_1.default.create({
            companiesId: payload.companiesId,
            typebooksId: payload.typebooksId,
            status: 'RECEIVED',
            source: payload.source,
            fileNames: JSON.stringify(payload.fileNames || []),
            dataImages: JSON.stringify(payload.dataImages || {}),
        });
    }
    catch (error) {
        console.error('Erro ao criar image_upload_job:', error);
        return null;
    }
}
async function updateUploadJob(uploadJob, status, data = {}) {
    if (!uploadJob)
        return null;
    try {
        uploadJob.merge({
            status,
            ...data,
        });
        await uploadJob.save();
    }
    catch (error) {
        console.error('Erro ao atualizar image_upload_job:', error);
    }
    return uploadJob;
}
function serializeUploadJob(uploadJob) {
    if (!uploadJob)
        return null;
    return {
        id: uploadJob.id,
        status: uploadJob.status,
        source: uploadJob.source,
        errorMessage: uploadJob.errorMessage,
        updatedAt: uploadJob.updatedAt,
    };
}
function getUploadJobErrorMessage(error) {
    if (typeof error === 'string')
        return error;
    return error?.message || error?.response?.message || 'Falha ao processar upload.';
}
function getExtnameFromMime(mimeType) {
    const subtype = mimeType?.split('/')?.[1]?.toLowerCase();
    if (!subtype)
        return 'jpeg';
    if (subtype === 'jpg')
        return 'jpeg';
    return subtype.split(';')[0];
}
function sanitizeUploadFileName(fileName, extname) {
    const fallback = `imagem_${Date.now()}.${extname}`;
    const baseName = path.basename(fileName || fallback).replace(/[^\w.\-]/g, '_');
    return baseName.includes('.') ? baseName : `${baseName}.${extname}`;
}
async function buildImageFromBase64Upload(payload) {
    const match = String(payload.imageBase64 || '').match(/^data:([^;]+);base64,(.+)$/);
    const mimeType = payload.imageType || match?.[1] || 'image/jpeg';
    const base64 = match?.[2] || payload.imageBase64;
    const extname = getExtnameFromMime(mimeType);
    const clientName = sanitizeUploadFileName(payload.imageName || '', extname);
    const buffer = Buffer.from(base64, 'base64');
    if (!buffer.length) {
        throw new BadRequestException_1.default('Arquivo base64 inválido.', 422);
    }
    const tmpDir = Application_1.default.tmpPath('uploads/base64');
    await fs.promises.mkdir(tmpDir, { recursive: true });
    const tmpPath = path.join(tmpDir, `${Date.now()}_${clientName}`);
    await fs.promises.writeFile(tmpPath, buffer);
    return {
        clientName,
        extname,
        subtype: extname,
        type: mimeType.split('/')[0] || 'image',
        tmpPath,
        size: buffer.length,
        isValid: true,
        errors: [],
        async move(folderPath, options = {}) {
            await fs.promises.mkdir(folderPath, { recursive: true });
            const targetPath = path.join(folderPath, options.name || clientName);
            await fs.promises.copyFile(tmpPath, targetPath);
            return true;
        },
    };
}
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
    async destroy(ctx) {
        const { auth, params, response } = ctx;
        const authenticate = await auth.use('api').authenticate();
        const companies_id = authenticate.companies_id;
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
            await AuditLogger_1.default.deleted(ctx, {
                companiesId: companies_id,
                userId: authenticate.id,
                action: 'indeximage_delete',
                entityTable: 'indeximages',
                resourceKey: `indeximages:${params.typebooks_id}:${params.bookrecords_id}:${decodeURIComponent(params.file_name)}`,
                entityKey: {
                    typebooks_id: Number(params.typebooks_id),
                    bookrecords_id: Number(params.bookrecords_id),
                    file_name: decodeURIComponent(params.file_name),
                },
                description: `Usuário ${authenticate.name || authenticate.username} excluiu a imagem ${decodeURIComponent(params.file_name)}`,
                beforeData: listOfImagesToDeleteGDrive,
                metadata: {
                    file_name: decodeURIComponent(params.file_name),
                },
            });
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
    async uploads(ctx) {
        const { auth, request, params, response } = ctx;
        const authenticate = await auth.use('api').authenticate();
        const company = await Company_1.default.find(authenticate.companies_id);
        let images = request.files('images', {
            size: '100mb',
            extnames: ['jpg', 'png', 'jpeg', 'pdf', 'JPG', 'PNG', 'JPEG', 'PDF', 'jfif', 'JFIF', 'tiff', 'TIFF', 'bmp', 'BMP', 'tif', 'TIF', 'webp', 'WEBP'],
        });
        let dataImagesRaw = request.input('dataImages');
        if (!dataImagesRaw) {
            dataImagesRaw = request?.['requestBody']?.dataImages;
        }
        let dataImages = {};
        if (dataImagesRaw) {
            try {
                dataImages = typeof dataImagesRaw === 'string' ? JSON.parse(dataImagesRaw) : dataImagesRaw;
            }
            catch (err) {
                dataImages = dataImagesRaw;
            }
        }
        const imageBase64 = request.input('imageBase64');
        if (!images.length && imageBase64) {
            images = [
                await buildImageFromBase64Upload({
                    imageBase64,
                    imageName: request.input('imageName'),
                    imageType: request.input('imageType'),
                }),
            ];
        }
        const indexImagesInitial = request.input('indexImagesInitial') === 'true';
        const updateImage = request.input('updateImage') === 'true';
        const updateImageDocument = request.input('updateImageDocument') === 'true';
        const landscape = !!(dataImages?.landscape === true ||
            dataImages?.landscape === 'true' ||
            dataImages?.landscape === 1 ||
            dataImages?.landscape === '1');
        const source = updateImageDocument
            ? 'updateImageDocument'
            : updateImage
                ? 'updateImage'
                : indexImagesInitial
                    ? 'indexImagesInitial'
                    : 'uploads';
        const uploadJob = await createUploadJob({
            companiesId: authenticate.companies_id,
            typebooksId: Number(params.typebooks_id) || null,
            source,
            fileNames: images.map((image) => image.clientName),
            dataImages,
        });
        try {
            if (!images.length) {
                await updateUploadJob(uploadJob, 'FAILED', {
                    errorMessage: 'Nenhum arquivo foi recebido no campo "images".',
                });
                return response.status(422).send({
                    message: 'Nenhum arquivo foi recebido no campo "images".',
                    uploadJob: serializeUploadJob(uploadJob),
                });
            }
            const invalidImages = images.filter((image) => !image.isValid);
            if (invalidImages.length) {
                const errorMessage = invalidImages
                    .map((image) => `${image.clientName}: ${JSON.stringify(image.errors || [])}`)
                    .join('; ');
                await updateUploadJob(uploadJob, 'FAILED', {
                    errorMessage: errorMessage.slice(0, 1000),
                });
                return response.status(422).send({
                    message: 'Um ou mais arquivos enviados são inválidos.',
                    errors: invalidImages.map((image) => ({
                        fileName: image.clientName,
                        errors: image.errors,
                    })),
                    uploadJob: serializeUploadJob(uploadJob),
                });
            }
            await updateUploadJob(uploadJob, 'PREPARING_RECORDS');
            if (indexImagesInitial) {
                const listFilesImages = images.map((image) => image.clientName);
                const listFiles = await FileRename.indeximagesinitial('', authenticate.companies_id, company?.cloud, listFilesImages);
                for (const item of listFiles.bookRecord) {
                    try {
                        await Bookrecord_1.default.create(item);
                    }
                    catch (error) {
                        console.log('ERRO BOOKRECORD::', error);
                    }
                }
            }
            if (updateImage) {
                if (dataImages?.book === undefined || dataImages?.book === null || dataImages?.book === '') {
                    await updateUploadJob(uploadJob, 'FAILED', {
                        errorMessage: 'Campo "book" é obrigatório em dataImages.',
                    });
                    return response.status(422).send({
                        message: 'Campo "book" é obrigatório em dataImages.',
                        uploadJob: serializeUploadJob(uploadJob),
                    });
                }
                const query = Bookrecord_1.default.query()
                    .where('typebooks_id', params.typebooks_id)
                    .andWhere('companies_id', authenticate.companies_id)
                    .andWhere('book', dataImages.book);
                if (dataImages.side)
                    query.andWhere('side', dataImages.side);
                if (dataImages.sheet !== undefined && dataImages.sheet !== null && dataImages.sheet !== '')
                    query.andWhere('sheet', dataImages.sheet);
                if (dataImages.indexBook)
                    query.andWhere('indexbook', dataImages.indexBook);
                if (dataImages.approximateTerm) {
                    query.andWhere('approximate_term', dataImages.approximateTerm);
                }
                const bookRecord = await query.first();
                if (!bookRecord || dataImages.sheet == 0) {
                    const books_id = await Typebook_1.default.query()
                        .where('id', params.typebooks_id)
                        .andWhere('companies_id', authenticate.companies_id)
                        .first();
                    const codBookrecord = await Bookrecord_1.default.query()
                        .where('typebooks_id', params.typebooks_id)
                        .andWhere('companies_id', authenticate.companies_id)
                        .max('cod as max_cod')
                        .firstOrFail();
                    if (dataImages.sheet == 0 && books_id) {
                        const book = await Bookrecord_1.default.create({
                            typebooks_id: params.typebooks_id,
                            companies_id: authenticate.companies_id,
                            cod: codBookrecord?.$extras.max_cod + 1,
                            books_id: books_id.books_id,
                            book: dataImages.book,
                            sheet: dataImages.sheet,
                            indexbook: dataImages.indexBook,
                            approximate_term: dataImages.approximateTerm,
                            letter: dataImages.letter,
                        });
                        dataImages.id = book.id;
                    }
                    else if (books_id) {
                        const book = await Bookrecord_1.default.create({
                            typebooks_id: params.typebooks_id,
                            companies_id: authenticate.companies_id,
                            cod: codBookrecord?.$extras.max_cod + 1,
                            books_id: books_id.books_id,
                            book: dataImages.book,
                            sheet: dataImages.sheet,
                            side: dataImages.side,
                            indexbook: dataImages.indexBook,
                            approximate_term: dataImages.approximateTerm,
                            letter: dataImages.letter,
                        });
                        dataImages.id = book.id;
                    }
                }
            }
            else if (updateImageDocument) {
                if (dataImages?.cod === undefined || dataImages?.cod === null || dataImages?.cod === '') {
                    await updateUploadJob(uploadJob, 'FAILED', {
                        errorMessage: 'Campo "cod" é obrigatório em dataImages.',
                    });
                    return response.status(422).send({
                        message: 'Campo "cod" é obrigatório em dataImages.',
                        uploadJob: serializeUploadJob(uploadJob),
                    });
                }
                const verifyExistBookrecord = await Bookrecord_1.default.query()
                    .where('companies_id', authenticate.companies_id)
                    .andWhere('cod', dataImages.cod)
                    .andWhere('typebooks_id', params.typebooks_id)
                    .first();
                if (verifyExistBookrecord) {
                    dataImages.id = verifyExistBookrecord.id;
                }
                else {
                    const trx = await Database_1.default.beginGlobalTransaction();
                    try {
                        const bookRecord = await Bookrecord_1.default.create({
                            typebooks_id: params.typebooks_id,
                            companies_id: authenticate.companies_id,
                            cod: dataImages.cod,
                            book: dataImages.book,
                            side: dataImages.side,
                            books_id: 13,
                        }, trx);
                        const normalizeIntOrNull = (value) => {
                            if (value === undefined || value === null || value === '')
                                return null;
                            return Number(value);
                        };
                        await Document_1.default.create({
                            bookrecords_id: bookRecord.id,
                            books_id: 13,
                            typebooks_id: params.typebooks_id,
                            companies_id: authenticate.companies_id,
                            prot: dataImages.prot,
                            documenttype_id: normalizeIntOrNull(dataImages?.documenttype_id),
                            document_type_book_id: normalizeIntOrNull(dataImages.document_type_book_id),
                            book_name: dataImages.book_name,
                            book_number: dataImages.book_number,
                            sheet_number: dataImages.sheet_number,
                            free: dataImages.free ? 1 : 0,
                            averb_anot: dataImages.averb_anot ? 1 : 0,
                            obs: dataImages.obs,
                        }, trx);
                        dataImages.id = bookRecord.id;
                        await trx.commit();
                    }
                    catch (error) {
                        await trx.rollback();
                        throw error;
                    }
                }
            }
            if (landscape) {
                for (const image of images) {
                    const ext = (image.extname || '').toLowerCase();
                    if (!['jpg', 'jpeg', 'png', 'jfif'].includes(ext))
                        continue;
                    if (!image.tmpPath)
                        continue;
                    try {
                        const inputPath = image.tmpPath;
                        const tempOutputPath = `${inputPath}_landscape`;
                        const imgSharp = (0, sharp_1.default)(inputPath);
                        const metadata = await imgSharp.metadata();
                        if (metadata.width && metadata.height && metadata.height > metadata.width) {
                            await imgSharp.rotate(-90).toFile(tempOutputPath);
                            await fs.promises.rename(tempOutputPath, inputPath);
                        }
                    }
                    catch (err) {
                        console.error('Erro ao rotacionar imagem para paisagem:', err);
                    }
                }
            }
            await updateUploadJob(uploadJob, 'SAVING_FILES');
            const files = await FileRename.transformFilesNameToId(images, params, authenticate.companies_id, company?.cloud, false, dataImages);
            if (!files?.length) {
                await updateUploadJob(uploadJob, 'FAILED', {
                    errorMessage: 'Nenhum arquivo foi enviado para o Google Drive.',
                });
                return response.status(422).send({
                    files,
                    uploadJob: serializeUploadJob(uploadJob),
                    message: 'Nenhum arquivo foi enviado para o Google Drive.',
                });
            }
            await updateUploadJob(uploadJob, 'COMPLETED', {
                resultFiles: JSON.stringify(files || []),
            });
            await AuditLogger_1.default.imageUpload(ctx, {
                companiesId: authenticate.companies_id,
                userId: authenticate.id,
                entityTable: 'indeximages',
                resourceKey: `indeximages-upload:${params.typebooks_id}:${uploadJob?.id || Date.now()}`,
                entityKey: {
                    typebooks_id: Number(params.typebooks_id),
                },
                description: `Usuário ${authenticate.name || authenticate.username} anexou ${files.length} imagem(ns)`,
                metadata: {
                    source,
                    upload_job_id: uploadJob?.id,
                    file_names: files.map((file) => file.file_name || file.fileName || file.name).filter(Boolean),
                    quantity: files.length,
                },
            });
            return response.status(201).send({
                files,
                uploadJob: serializeUploadJob(uploadJob),
                message: 'Arquivo Salvo com sucesso!!!',
            });
        }
        catch (error) {
            await updateUploadJob(uploadJob, 'FAILED', {
                errorMessage: getUploadJobErrorMessage(error).slice(0, 1000),
            });
            throw error;
        }
    }
    async uploadCapture({ auth, request, params }) {
        const authenticate = await auth.use('api').authenticate();
        const company = await Company_1.default.find(authenticate.companies_id);
        const { imageCaptureBase64, cod, id } = request.requestData;
        let base64Image = imageCaptureBase64.split(';base64,').pop();
        const uploadsBasePath = Application_1.default.tmpPath('uploads');
        const folderPath = Application_1.default.tmpPath(`/uploads/Client_${authenticate.companies_id}`);
        try {
            if (!fs.existsSync(uploadsBasePath)) {
                fs.mkdirSync(uploadsBasePath);
            }
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
        const file = await FileRename.transformFilesNameToId(`${folderPath}/${file_name}.jpeg`, params, authenticate.companies_id, company?.cloud, true);
        return { sucesso: "sucesso", file, typebook: params.typebooks_id };
    }
    async download(ctx) {
        const { auth, params, request } = ctx;
        const authenticate = await auth.use('api').authenticate();
        const { typebook_id } = request.only(['typebook_id']);
        const body = request.only(Indeximage_1.default.fillable);
        const fileName = params.id;
        const company = await Company_1.default.find(authenticate.companies_id);
        const indexImage = await Indeximage_1.default.query()
            .where('file_name', fileName)
            .andWhere('typebooks_id', typebook_id)
            .andWhere('companies_id', authenticate.companies_id)
            .first();
        const fileDownload = await FileRename.downloadImage(fileName, typebook_id, authenticate.companies_id, company?.cloud);
        await AuditLogger_1.default.imageView(ctx, {
            companiesId: authenticate.companies_id,
            userId: authenticate.id,
            entityTable: 'indeximages',
            resourceKey: `indeximages:${typebook_id}:${indexImage?.bookrecords_id || ''}:${indexImage?.seq || ''}:${fileName}`,
            entityKey: {
                typebooks_id: Number(typebook_id),
                bookrecords_id: indexImage?.bookrecords_id,
                seq: indexImage?.seq,
                file_name: fileName,
            },
            description: `Usuário ${authenticate.name || authenticate.username} visualizou a imagem ${fileName}`,
            metadata: {
                file_name: fileName,
                extension: path.extname(fileName),
                size: fileDownload.size,
            },
        });
        return {
            fileDownload: fileDownload.dataURI,
            fileName,
            extension: path.extname(fileName),
            body,
            size: fileDownload.size,
            index_text: indexImage?.index_text,
            bookrecords_id: indexImage?.bookrecords_id,
            typebooks_id: indexImage?.typebooks_id,
            seq: indexImage?.seq,
        };
    }
    async countProcessing({ auth, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const result = await Indeximage_1.default.query()
            .where('companies_id', authenticate.companies_id)
            .andWhere('typebooks_id', params.typebooks_id)
            .whereNotNull('previous_file_name')
            .count('* as total');
        return response.ok({
            total: Number(result[0].$extras.total),
        });
    }
}
exports.default = IndeximagesController;
//# sourceMappingURL=IndeximagesController.js.map