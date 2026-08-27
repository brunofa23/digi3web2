"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFileName = exports.mountNameFile = exports.renameFileGoogle = exports.totalFilesInFolder = exports.indeximagesinitial = exports.deleteFile = exports.fileRename = exports.downloadImage = exports.validateFilesNameToId = exports.transformFilesNameToId = void 0;
const Bookrecord_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Bookrecord"));
const Typebook_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Typebook"));
const Indeximage_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Indeximage"));
const Application_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Application"));
const Company_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Company"));
const ErrorlogImage_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/ErrorlogImage"));
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const pino_std_serializers_1 = require("pino-std-serializers");
const luxon_1 = require("luxon");
const fs_1 = require("fs");
const crypto_1 = __importDefault(require("crypto"));
const googledrive_1 = global[Symbol.for('ioc.use')]("App/Services/googleDrive/googledrive");
const PdfOptimizer_1 = __importDefault(require("../imageProcessing/PdfOptimizer"));
const Document_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Document"));
const fs = require('fs');
const path_1 = __importDefault(require("path"));
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
function safeDriveSearchLog(result) {
    if (Array.isArray(result)) {
        return { isArray: true, length: result.length };
    }
    return {
        isArray: false,
        message: result?.message,
        code: result?.code,
        type: result?.type,
    };
}
const pendingRenameQueue = new Map();
let pendingRenameTimer = null;
let isPendingRenameQueueRunning = false;
const pendingRenameBatchSize = 5;
const pendingRenameDelayMs = 1000;
const maxPendingRenameRoundsByTypebook = 50;
const maxGoogleDriveDeleteBatchSize = 20;
function hasDataImageLookup(dataImages) {
    return Boolean(dataImages?.id ||
        dataImages?.book ||
        dataImages?.sheet ||
        dataImages?.side ||
        dataImages?.cod ||
        dataImages?.approximateTerm ||
        dataImages?.indexBook);
}
function invalidFileRename(fileName, reason) {
    return {
        isInvalidFileRename: true,
        fileName: path_1.default.basename(fileName || ''),
        reason,
    };
}
function isInvalidFileRename(result) {
    return !result || result.isInvalidFileRename || !result.file_name;
}
function normalizeInvalidFileRename(fileName, result) {
    if (result?.isInvalidFileRename)
        return result;
    return invalidFileRename(fileName, 'Não foi possível identificar o registro correspondente para este arquivo.');
}
function getBookRecordNotFoundReason(objFileName, matchedFilePattern) {
    switch (matchedFilePattern) {
        case 'book_cod':
            return `Nenhum bookrecord encontrado para livro ${objFileName.book} e código ${objFileName.cod}.`;
        case 'book_sheet_side':
        case 'book_sheet_side_insert':
            return `Nenhum bookrecord encontrado para livro ${objFileName.book}, folha ${objFileName.sheet} e lado ${objFileName.side}.`;
        case 'book_term':
            return `Nenhum bookrecord encontrado para livro ${objFileName.book} e termo aproximado ${objFileName.approximate_term}.`;
        case 'document_prot':
            return `Nenhum documento encontrado para livro ${objFileName.book} e protocolo ${objFileName.prot}.`;
        case 'id':
            return `Nenhum bookrecord encontrado para id ${objFileName.id} e código ${objFileName.cod}.`;
        default:
            return 'Nenhum bookrecord encontrado para os dados informados.';
    }
}
const acceptedFileNameFormats = 'L1(1).jpg, L1_5_F.jpg, L1F(5)F.jpg, L1F(5)V.jpg, T1(123).jpg ou P1(123).jpg.';
function throwInvalidFiles(invalidFiles) {
    const hasInvalidFormat = invalidFiles.some((file) => String(file.reason || '').includes('Formato não aceito'));
    const message = [
        'Alguns arquivos não puderam ser enviados:',
        ...invalidFiles.map((file) => {
            if (String(file.reason || '').includes('Formato não aceito'))
                return `- ${file.fileName}`;
            return `- ${file.fileName}: ${file.reason}`;
        }),
        ...(hasInvalidFormat ? ['', `Formatos aceitos: ${acceptedFileNameFormats}`] : []),
    ].join('\n');
    const error = new BadRequestException_1.default(message, 422, 'invalid_image_file_names');
    error.invalidFiles = invalidFiles;
    throw error;
}
async function deleteImage(folderPath) {
    try {
        fs.unlink(`${folderPath}`, (err) => {
            if (err) {
                throw "ERRO DELETE::" + err;
            }
            return true;
        });
    }
    catch (error) {
        return { "ERRO DELETE::>": pino_std_serializers_1.err, error };
    }
}
async function getLocalFileMetadata(filePath) {
    const stat = await fs_1.promises.stat(filePath);
    const hash = crypto_1.default.createHash('md5');
    await new Promise((resolve, reject) => {
        const stream = fs.createReadStream(filePath);
        stream.on('data', (chunk) => hash.update(chunk));
        stream.on('end', () => resolve());
        stream.on('error', reject);
    });
    return {
        size: stat.size,
        md5Checksum: hash.digest('hex'),
    };
}
async function findDuplicateIndeximage(companiesId, typebooksId, bookrecordsId, driveFolderId, md5Checksum, fileSize) {
    if (!companiesId || !typebooksId || !bookrecordsId || !driveFolderId || !md5Checksum || !fileSize)
        return null;
    return Indeximage_1.default.query()
        .where('companies_id', companiesId)
        .andWhere('typebooks_id', typebooksId)
        .andWhere('bookrecords_id', bookrecordsId)
        .andWhere('drive_folder_id', driveFolderId)
        .andWhere('drive_md5_checksum', md5Checksum)
        .andWhere('drive_file_size', fileSize)
        .first();
}
function getUploadReportItem(objfileRename, image, idParent) {
    return {
        file_name: objfileRename.file_name,
        original_file_name: image?.clientName || path_1.default.basename(String(image || objfileRename.file_name)),
        companies_id: objfileRename.companies_id,
        typebooks_id: objfileRename.typebooks_id,
        bookrecords_id: objfileRename.bookrecords_id,
        seq: objfileRename.seq,
        cod: objfileRename.register || objfileRename.cod,
        book: objfileRename.book,
        sheet: objfileRename.sheet,
        side: objfileRename.side,
        approximate_term: objfileRename.approximate_term,
        indexbook: objfileRename.indexbook,
        drive_folder_id: objfileRename.drive_folder_id || idParent,
    };
}
async function downloadImage(fileName, typebook_id, company_id, cloud_number) {
    const directoryParent = await Typebook_1.default.query()
        .where('id', typebook_id)
        .andWhere('companies_id', company_id)
        .first();
    if (!directoryParent) {
        throw new Error(`Typebook ${typebook_id} não encontrado para empresa ${company_id}`);
    }
    const parent = await (0, googledrive_1.sendSearchFile)(directoryParent.path, cloud_number);
    if (!parent?.length) {
        console.log('erro 155454 downloadImage pasta nao encontrada', {
            fileName,
            typebook_id,
            company_id,
            cloud_number,
            path: directoryParent.path,
            parent: safeDriveSearchLog(parent),
        });
        throw new Error(`Pasta ${directoryParent.path} não encontrada na nuvem`);
    }
    const extension = path_1.default.extname(fileName);
    const fileId = await (0, googledrive_1.sendSearchFile)(fileName, cloud_number, parent[0].id);
    if (!fileId?.length) {
        throw new Error(`Arquivo ${fileName} não encontrado na pasta ${directoryParent.path}`);
    }
    const download = await (0, googledrive_1.sendDownloadFile)(fileId[0].id, extension, cloud_number);
    return download;
}
exports.downloadImage = downloadImage;
async function ensureDriveFolder(path, cloud_number, companies_id) {
    const found = await (0, googledrive_1.sendSearchFile)(path, cloud_number);
    if (found && found[0]?.id)
        return found[0].id;
    const company = await Company_1.default.findByOrFail('id', companies_id);
    const roots = await (0, googledrive_1.sendSearchFile)(company.foldername, cloud_number);
    const parentCompanyId = roots?.[0]?.id;
    if (!parentCompanyId) {
        console.log('erro 155454 ensureDriveFolder pasta raiz nao encontrada', {
            path,
            cloud_number,
            companies_id,
            company_foldername: company.foldername,
            found: safeDriveSearchLog(found),
            roots: safeDriveSearchLog(roots),
        });
        throw new BadRequestException_1.default('company root folder not found in Google Drive', 404);
    }
    const created = await (0, googledrive_1.sendCreateFolder)(path, cloud_number, parentCompanyId);
    const createdId = created?.id ?? created?.[0]?.id;
    if (!createdId) {
        throw new BadRequestException_1.default('failed to create folder on Google Drive', 500);
    }
    return createdId;
}
async function transformFilesNameToId(images, params, companies_id, cloud_number, capture = false, dataImages = {}) {
    try {
        const uploadsBasePath = Application_1.default.tmpPath('uploads');
        const folderPath = Application_1.default.tmpPath(`/uploads/Client_${companies_id}`);
        await fs_1.promises.mkdir(uploadsBasePath, { recursive: true });
        await fs_1.promises.mkdir(folderPath, { recursive: true });
    }
    catch (error) {
        throw new BadRequestException_1.default('could not create client directory', 409, error);
    }
    const directoryParent = await Typebook_1.default.query()
        .where('id', params.typebooks_id)
        .andWhere('companies_id', companies_id)
        .first();
    if (!directoryParent)
        throw new BadRequestException_1.default('undefined book', 409);
    const parentId = await ensureDriveFolder(directoryParent.path, cloud_number, companies_id);
    if (capture) {
        const validateFileRename = await fileRename(images, params.typebooks_id, companies_id, {}, true);
        if (isInvalidFileRename(validateFileRename)) {
            throwInvalidFiles([normalizeInvalidFileRename(images, validateFileRename)]);
        }
        const _fileRename = await fileRename(images, params.typebooks_id, companies_id);
        if (isInvalidFileRename(_fileRename)) {
            throwInvalidFiles([normalizeInvalidFileRename(images, _fileRename)]);
        }
        try {
            await pushImageToGoogle(images, Application_1.default.tmpPath(`/uploads/Client_${companies_id}`), _fileRename, parentId, cloud_number, true);
            return images;
        }
        catch (error) {
            console.log(error);
            return error;
        }
    }
    const result = [];
    const validImages = [];
    const invalidFiles = [];
    for (const image of images) {
        if (!image)
            continue;
        if (!image.isValid) {
            console.log("Error", image.errors);
            continue;
        }
        const validateFileRename = await fileRename(image.clientName, params.typebooks_id, companies_id, dataImages, true);
        if (isInvalidFileRename(validateFileRename)) {
            invalidFiles.push(normalizeInvalidFileRename(image.clientName, validateFileRename));
            continue;
        }
        validImages.push(image);
    }
    if (invalidFiles.length > 0) {
        throwInvalidFiles(invalidFiles);
    }
    for (const image of validImages) {
        const _fileRename = await fileRename(image['clientName'], params.typebooks_id, companies_id, dataImages);
        if (isInvalidFileRename(_fileRename)) {
            throwInvalidFiles([normalizeInvalidFileRename(image['clientName'], _fileRename)]);
        }
        try {
            const r = await pushImageToGoogle(image, Application_1.default.tmpPath(`/uploads/Client_${companies_id}`), _fileRename, parentId, cloud_number);
            result.push(r);
        }
        catch (error) {
            throw new BadRequestException_1.default(error + 'pushImageToGoogle', 409);
        }
        finally {
        }
    }
    return result;
}
exports.transformFilesNameToId = transformFilesNameToId;
async function validateFilesNameToId(fileNames, params, companies_id, dataImages = {}) {
    const invalidFiles = [];
    const names = Array.isArray(fileNames) ? fileNames : fileNames ? [fileNames] : [];
    for (const fileName of names) {
        const validateFileRename = await fileRename(fileName, params.typebooks_id, companies_id, dataImages, true);
        if (isInvalidFileRename(validateFileRename)) {
            invalidFiles.push(normalizeInvalidFileRename(fileName, validateFileRename));
        }
    }
    if (invalidFiles.length > 0) {
        throwInvalidFiles(invalidFiles);
    }
    return { valid: true };
}
exports.validateFilesNameToId = validateFilesNameToId;
async function renameFileGoogle(filename, folderPath, newTitle, cloud_number, driveFileId = null) {
    try {
        if (driveFileId) {
            await (0, googledrive_1.sendRenameFile)(driveFileId, newTitle, cloud_number);
            return true;
        }
        const idFolderPath = await (0, googledrive_1.sendSearchFile)(folderPath, cloud_number);
        if (!idFolderPath?.[0]?.id)
            return false;
        const idFile = await (0, googledrive_1.sendSearchFile)(filename, cloud_number, idFolderPath[0].id);
        if (!idFile?.[0]?.id)
            return false;
        await (0, googledrive_1.sendRenameFile)(idFile[0].id, newTitle, cloud_number);
        return true;
    }
    catch (error) {
        return false;
    }
}
exports.renameFileGoogle = renameFileGoogle;
function enqueuePendingRenameProcessing(companiesId, typebooksId) {
    if (!companiesId || !typebooksId)
        return;
    const queueKey = `${companiesId}:${typebooksId}`;
    const currentRounds = pendingRenameQueue.get(queueKey) || 0;
    pendingRenameQueue.set(queueKey, Math.min(currentRounds + 1, maxPendingRenameRoundsByTypebook));
    schedulePendingRenameProcessing();
}
function schedulePendingRenameProcessing() {
    if (pendingRenameTimer || isPendingRenameQueueRunning)
        return;
    pendingRenameTimer = setTimeout(() => {
        pendingRenameTimer = null;
        processPendingRenameQueue();
    }, pendingRenameDelayMs);
}
async function processPendingRenameQueue() {
    if (isPendingRenameQueueRunning)
        return;
    isPendingRenameQueueRunning = true;
    try {
        while (pendingRenameQueue.size > 0) {
            const queueKey = pendingRenameQueue.keys().next().value;
            const rounds = pendingRenameQueue.get(queueKey) || 1;
            if (rounds <= 1) {
                pendingRenameQueue.delete(queueKey);
            }
            else {
                pendingRenameQueue.set(queueKey, rounds - 1);
            }
            const [companiesId, typebooksId] = queueKey.split(':').map(Number);
            await processPendingRenameBatch(companiesId, typebooksId);
            await sleep(pendingRenameDelayMs);
        }
    }
    catch (error) {
        console.error('Erro ao processar fila de renomeação de imagens:', error);
    }
    finally {
        isPendingRenameQueueRunning = false;
        if (pendingRenameQueue.size > 0) {
            schedulePendingRenameProcessing();
        }
    }
}
async function processPendingRenameBatch(companiesId, typebooksId) {
    const typebook = await Typebook_1.default.query()
        .preload('company')
        .where('companies_id', companiesId)
        .andWhere('id', typebooksId)
        .first();
    if (!typebook?.path || !typebook.company?.cloud)
        return;
    const pendingImages = await Indeximage_1.default.query()
        .where('companies_id', companiesId)
        .andWhere('typebooks_id', typebooksId)
        .whereNotNull('previous_file_name')
        .orderBy('updated_at', 'desc')
        .limit(pendingRenameBatchSize);
    for (const image of pendingImages) {
        if (!image.file_name || !image.previous_file_name)
            continue;
        const fileWasRenamed = await renameFileGoogle(image.file_name, typebook.path, image.previous_file_name, typebook.company.cloud, image.drive_file_id);
        if (!fileWasRenamed)
            continue;
        await Indeximage_1.default.query()
            .where('companies_id', companiesId)
            .andWhere('typebooks_id', typebooksId)
            .andWhere('bookrecords_id', image.bookrecords_id)
            .andWhere('seq', image.seq)
            .andWhere('file_name', image.file_name)
            .update({
            file_name: image.previous_file_name,
            previous_file_name: null,
        });
    }
}
async function pushImageToGoogle(image, folderPath, objfileRename, idParent, cloud_number, capture = false) {
    try {
        let localFilePath = path_1.default.join(folderPath, objfileRename.file_name);
        if (capture) {
            localFilePath = path_1.default.join(path_1.default.dirname(image), objfileRename.file_name);
            await fs_1.promises.rename(image, localFilePath);
        }
        else {
            const newPath = path_1.default.join(folderPath, objfileRename.file_name);
            await image.move(folderPath, { name: objfileRename.file_name, overwrite: true });
            if (image.subtype.toLowerCase() === 'pdf') {
                const returnPathFile = await PdfOptimizer_1.default.compressIfScanned(`${folderPath}/${objfileRename.file_name}`);
                fs.renameSync(returnPathFile, newPath);
            }
        }
        const localMetadata = await getLocalFileMetadata(localFilePath);
        const duplicateIndeximage = await findDuplicateIndeximage(objfileRename.companies_id, objfileRename.typebooks_id, objfileRename.bookrecords_id, idParent, localMetadata.md5Checksum, localMetadata.size);
        if (duplicateIndeximage) {
            await deleteImage(localFilePath);
            return {
                ...getUploadReportItem(objfileRename, image, idParent),
                uploaded: false,
                skipped: true,
                reason: 'duplicate_file',
                message: 'Arquivo já enviado anteriormente para esta pasta.',
                drive_file_size: localMetadata.size,
                drive_md5_checksum: localMetadata.md5Checksum,
                drive_folder_id: idParent,
                duplicate: {
                    file_name: duplicateIndeximage.file_name,
                    drive_file_id: duplicateIndeximage.drive_file_id,
                    same_name: duplicateIndeximage.file_name === objfileRename.file_name,
                },
            };
        }
        const sendUpload = await (0, googledrive_1.sendUploadFiles)(idParent, folderPath, `${objfileRename.file_name}`, cloud_number);
        if (sendUpload.status !== 200) {
            delete objfileRename.date_atualization;
            await ErrorlogImage_1.default.create(objfileRename);
            throw new BadRequestException_1.default('Falha ao enviar arquivo para o Google Drive', 409);
        }
        const driveFileSize = sendUpload.data?.size ? Number(sendUpload.data.size) : localMetadata.size;
        const driveMd5Checksum = sendUpload.data?.md5Checksum || localMetadata.md5Checksum;
        const driveFolderId = Array.isArray(sendUpload.data?.parents) && sendUpload.data.parents.length
            ? sendUpload.data.parents[0]
            : idParent;
        if (sendUpload.data?.md5Checksum && sendUpload.data.md5Checksum !== localMetadata.md5Checksum) {
            throw new BadRequestException_1.default('Checksum retornado pelo Google Drive diferente do arquivo enviado', 409);
        }
        if (sendUpload.data?.size && Number(sendUpload.data.size) !== localMetadata.size) {
            throw new BadRequestException_1.default('Tamanho retornado pelo Google Drive diferente do arquivo enviado', 409);
        }
        if (!objfileRename.typeBookFile || objfileRename.typeBookFile == false) {
            objfileRename.drive_file_id = sendUpload.data?.id || null;
            objfileRename.drive_file_size = driveFileSize;
            objfileRename.drive_md5_checksum = driveMd5Checksum;
            objfileRename.drive_folder_id = driveFolderId;
            const date_atualization = luxon_1.DateTime.now();
            objfileRename.date_atualization = date_atualization.toFormat('yyyy-MM-dd HH:mm');
            await Indeximage_1.default.create(objfileRename);
        }
        await deleteImage(`${folderPath}/${objfileRename.file_name}`);
    }
    catch (error) {
        throw new BadRequestException_1.default(error + ' sendUploadFiles', 409);
    }
    return {
        ...getUploadReportItem(objfileRename, image, idParent),
        uploaded: true,
        skipped: false,
        drive_file_id: objfileRename.drive_file_id || null,
        drive_file_size: objfileRename.drive_file_size || null,
        drive_md5_checksum: objfileRename.drive_md5_checksum || null,
        drive_folder_id: objfileRename.drive_folder_id || idParent,
    };
}
async function fileRename(originalFileName, typebooks_id, companies_id, dataImages = {}, validateOnly = false) {
    let objFileName;
    let separators;
    let arrayFileName;
    let isCreateBookrecord = false;
    let isCreateCover = false;
    let matchedFilePattern = '';
    const regexBookAndCod = /^L\d+\(\d+\).*$/;
    const regexBookSheetSide = /^L\d+_\d+_[FV].*/;
    const regexBookAndTerm = /^T\d+\(\d+\)(.*?)\.\w+$/;
    const regexDocumentAndProt = /^P(\d+)\((\d+)\)(.*?)(?:\.[^.]+)?$/i;
    const regexBookSheetSideInsertBookrecord = /^l(\d+)f\((\d+)\)([vf])(\d)?[^.]*\.(\w+)$/i;
    const regexBookCoverInsertBookrecord = /^L([1-9]\d*)C\(([1-9]\d*)\)([a-zA-Z]*)\.(.+)$/i;
    const query = Bookrecord_1.default.query()
        .preload('indeximage', query => {
        query.where('indeximages.typebooks_id', typebooks_id);
        query.andWhere('indeximages.companies_id', '=', companies_id);
    })
        .where('bookrecords.typebooks_id', '=', typebooks_id)
        .andWhere('bookrecords.companies_id', '=', companies_id);
    if (dataImages.typeBookFile) {
        let fileName;
        const ext = path_1.default.extname(originalFileName).toLowerCase();
        switch (true) {
            case (dataImages.book && dataImages.sheet && dataImages.side):
                fileName = `L${dataImages.book}_${dataImages.sheet}_${dataImages.side}-${dataImages.typeBookFile}${ext}`;
                break;
            case (dataImages.book && dataImages.cod):
                fileName = `L${dataImages.book}(${dataImages.cod})-${dataImages.typeBookFile}${ext}`;
                break;
            case (dataImages.book && dataImages.approximateTerm):
                fileName = `T${dataImages.book}(${dataImages.approximateTerm})-${dataImages.typeBookFile}${ext}`;
                break;
        }
        if (!fileName) {
            return invalidFileRename(originalFileName, 'Dados insuficientes para nomear arquivo do tipo informado.');
        }
        return {
            file_name: fileName,
            typebooks_id,
            companies_id,
            previous_file_name: originalFileName,
            typeBookFile: true
        };
    }
    switch (true) {
        case regexBookCoverInsertBookrecord.test(originalFileName.toUpperCase()): {
            matchedFilePattern = 'book_cover';
            const match = originalFileName.match(regexBookCoverInsertBookrecord);
            if (match) {
                objFileName = {
                    book: match[1],
                    sheet: 0,
                    letter: match[3] || "",
                    ext: "." + match[4].toLowerCase(),
                };
                query.andWhere('book', objFileName.book);
                isCreateCover = true;
            }
            break;
        }
        case regexBookSheetSideInsertBookrecord.test(originalFileName): {
            matchedFilePattern = 'book_sheet_side_insert';
            const match = originalFileName.match(regexBookSheetSideInsertBookrecord);
            if (match) {
                objFileName = {
                    book: match[1],
                    sheet: match[2],
                    side: match[3].toUpperCase(),
                    indexbook: match[4] ? Number(match[4]) : null,
                    ext: path_1.default.extname(originalFileName).toLowerCase()
                };
                query.andWhere('book', objFileName.book);
                query.andWhere('sheet', objFileName.sheet);
                query.andWhere('side', objFileName.side);
                if (objFileName?.indexbook)
                    query.andWhere('indexbook', objFileName.indexbook);
                else
                    query.andWhereNull('indexbook');
                isCreateBookrecord = true;
                break;
            }
        }
        case regexBookAndCod.test(originalFileName.toUpperCase()): {
            matchedFilePattern = 'book_cod';
            separators = ["L", '\'', '(', ')', '|', '-'];
            arrayFileName = originalFileName.split(new RegExp('([' + separators.join('') + '])'));
            objFileName = {
                type: arrayFileName[1],
                book: arrayFileName[2],
                cod: arrayFileName[4],
                ext: arrayFileName[6]
            };
            query.andWhere('cod', objFileName.cod);
            query.andWhere('book', objFileName.book);
            break;
        }
        case regexBookSheetSide.test(originalFileName.toUpperCase()): {
            matchedFilePattern = 'book_sheet_side';
            separators = ["L", '_', '|', '-'];
            arrayFileName = originalFileName.split(new RegExp('([' + separators.join('') + '])'));
            objFileName = {
                type: arrayFileName[1],
                book: arrayFileName[2],
                sheet: arrayFileName[4],
                side: arrayFileName[6][0],
                ext: path_1.default.extname(originalFileName).toLowerCase()
            };
            query.andWhere('book', objFileName.book);
            query.andWhere('sheet', objFileName.sheet);
            query.andWhere('side', objFileName.side);
            break;
        }
        case path_1.default.basename(originalFileName).startsWith('Id'): {
            matchedFilePattern = 'id';
            const arrayFileName = path_1.default.basename(originalFileName).split(/[_,.\s]/);
            objFileName = {
                id: arrayFileName[0].replace('Id', ''),
                cod: arrayFileName[1].replace('(', '').replace(')', ''),
                ext: `.${arrayFileName[arrayFileName.length - 1]}`
            };
            originalFileName = path_1.default.basename(originalFileName);
            query.andWhere('id', objFileName.id);
            query.andWhere('cod', objFileName.cod);
            break;
        }
        case regexBookAndTerm.test(originalFileName.toUpperCase()): {
            matchedFilePattern = 'book_term';
            const arrayFileName = originalFileName.substring(1).split(/[()\.]/);
            objFileName = {
                book: arrayFileName[0],
                approximate_term: arrayFileName[1],
                ext: `.${arrayFileName[3]}`
            };
            query.andWhere('approximate_term', objFileName.approximate_term);
            query.andWhere('book', objFileName.book);
            break;
        }
        case regexDocumentAndProt.test(originalFileName.toUpperCase()): {
            matchedFilePattern = 'document_prot';
            const match = originalFileName.match(regexDocumentAndProt);
            if (match) {
                objFileName = {
                    book: match[1],
                    prot: match[2],
                    obs: match[3]?.trim() || null,
                    ext: path_1.default.extname(originalFileName).toLowerCase(),
                };
            }
            query.andWhere('book', objFileName.book);
            query.whereHas('document', q => {
                q.where('documents.prot', objFileName.prot);
            });
            isCreateBookrecord = true;
            break;
        }
        default: {
            if (!hasDataImageLookup(dataImages)) {
                return invalidFileRename(originalFileName, 'Formato não aceito.');
            }
            matchedFilePattern = 'data_images';
            if (dataImages.id)
                query.andWhere('id', dataImages.id);
            if (dataImages.book)
                query.andWhere('book', dataImages.book);
            if (dataImages.sheet)
                query.andWhere('sheet', dataImages.sheet);
            if (dataImages.side)
                query.andWhere('side', dataImages.side);
            if (dataImages.cod)
                query.andWhere('cod', dataImages.cod);
            if (dataImages.approximateTerm)
                query.andWhere('approximate_term', dataImages.approximateTerm);
            if (dataImages.indexBook)
                query.andWhere('indexbook', dataImages.indexBook);
            objFileName = { ext: path_1.default.extname(originalFileName).toLowerCase() };
        }
    }
    try {
        let bookRecord = await query.first();
        let seq = 0;
        if (bookRecord === null || isCreateCover) {
            if (isCreateBookrecord || isCreateCover) {
                if (validateOnly) {
                    const book = await Typebook_1.default.query()
                        .where('companies_id', companies_id)
                        .andWhere('id', typebooks_id)
                        .first();
                    if (!book) {
                        return invalidFileRename(originalFileName, 'Tipo de livro não encontrado para criação do bookrecord.');
                    }
                    return { file_name: originalFileName };
                }
                try {
                    const query = Typebook_1.default.query()
                        .where('companies_id', companies_id)
                        .andWhere('id', typebooks_id);
                    const book = await query.first();
                    if (!book) {
                        return invalidFileRename(originalFileName, 'Tipo de livro não encontrado para criação do bookrecord.');
                    }
                    const query2 = Bookrecord_1.default.query()
                        .where('typebooks_id', typebooks_id)
                        .andWhere('companies_id', companies_id)
                        .max('cod as max_cod');
                    const bookRecordFind = await query2.first();
                    const { ext, prot, obs, ...objFileNameWithoutExt } = objFileName;
                    const objectInsert = {
                        books_id: book.books_id,
                        typebooks_id: typebooks_id,
                        companies_id: companies_id,
                        cod: bookRecordFind?.$extras.max_cod + 1,
                        ...objFileNameWithoutExt
                    };
                    bookRecord = await Bookrecord_1.default.create(objectInsert);
                    await Document_1.default.create({
                        bookrecords_id: bookRecord.id,
                        typebooks_id: bookRecord.typebooks_id,
                        books_id: bookRecord.books_id,
                        companies_id: bookRecord.companies_id,
                        prot: prot == 0 ? null : prot,
                        obs
                    });
                    seq = 1;
                }
                catch (error) {
                    console.log("!!!!!!!", error);
                    return invalidFileRename(originalFileName, 'Não foi possível criar o bookrecord para este arquivo.');
                }
            }
            else {
                return invalidFileRename(originalFileName, getBookRecordNotFoundReason(objFileName, matchedFilePattern));
            }
        }
        else {
            if (validateOnly) {
                return { file_name: originalFileName };
            }
            if (bookRecord.indeximage.length == 0) {
                seq = 1;
            }
            else {
                seq = bookRecord.indeximage[bookRecord.indeximage.length - 1].seq + 1;
            }
        }
        let fileRename;
        try {
            fileRename = {
                file_name: await mountNameFile(bookRecord, seq, objFileName.ext),
                bookrecords_id: bookRecord.id,
                typebooks_id,
                companies_id,
                seq,
                ext: objFileName.ext,
            };
        }
        catch (error) {
            return error;
        }
        return fileRename;
    }
    catch (error) {
        return error;
    }
}
exports.fileRename = fileRename;
async function mountNameFile(bookRecord, seq, extFile) {
    return mountNameFileWithTimestamp(bookRecord, seq, extFile);
}
exports.mountNameFile = mountNameFile;
function getStableFileTimestamp(fileName, fallbackDate) {
    const timestamp = path_1.default.basename(fileName || '').match(/_(\d{8,14})(?=\.[^.]+$)/)?.[1];
    if (timestamp)
        return timestamp;
    if (fallbackDate?.isValid)
        return fallbackDate.toFormat('yyyyMMddHHmm');
    return luxon_1.DateTime.now().toFormat('yyyyMMddHHmm');
}
async function mountNameFileWithTimestamp(bookRecord, seq, extFile, fileTimestamp) {
    if (!extFile.startsWith('.'))
        extFile = path_1.default.extname(extFile).toLowerCase();
    const dateFile = fileTimestamp || luxon_1.DateTime.now().toFormat('yyyyMMddHHmm');
    return `Id${bookRecord.id}_${seq}(${bookRecord.cod})_${bookRecord.typebooks_id}_${bookRecord.book}_${!bookRecord.sheet || bookRecord.sheet == null ? "" : bookRecord.sheet}_${!bookRecord.approximate_term || bookRecord.approximate_term == null ? '' : bookRecord.approximate_term}_${!bookRecord.side || bookRecord.side == null ? '' : bookRecord.side}_${bookRecord.books_id}_${!bookRecord.indexbook || bookRecord.indexbook == null ? '' : bookRecord.indexbook}_${!bookRecord.obs || bookRecord.obs == null ? '' : bookRecord.obs}_${!bookRecord.letter || bookRecord.letter == null ? '' : bookRecord.letter}_${!bookRecord.year || bookRecord.year == null ? '' : bookRecord.year}_${dateFile}${extFile.toLowerCase()}`;
}
async function deleteFile(listFiles, cloud_number) {
    try {
        if (!Array.isArray(listFiles) || listFiles.length === 0) {
            return "nenhum arquivo para excluir";
        }
        if (listFiles.length > maxGoogleDriveDeleteBatchSize) {
            throw new Error(`Exclusão em massa bloqueada no Google Drive: ${listFiles.length} arquivos`);
        }
        const idFolder = await (0, googledrive_1.sendSearchFile)(listFiles[0]['path'], cloud_number);
        if (!idFolder?.[0]?.id) {
            throw new Error('Pasta Google Drive não encontrada para exclusão');
        }
        let idFile;
        for (const file of listFiles) {
            idFile = await (0, googledrive_1.sendSearchFile)(file['file_name'], cloud_number, idFolder[0].id);
            if (!idFile?.[0]?.id)
                continue;
            await (0, googledrive_1.sendDeleteFile)(idFile[0].id, cloud_number);
        }
        return "excluido!!!";
    }
    catch (error) {
        throw error;
    }
}
exports.deleteFile = deleteFile;
async function updateFileName(bookRecord, schedulePendingRename = true) {
    try {
        const _indexImage = await Indeximage_1.default.query()
            .preload('typebooks', (query) => {
            query.where('id', bookRecord.typebooks_id)
                .andWhere('companies_id', bookRecord.companies_id);
        })
            .where('indeximages.bookrecords_id', bookRecord.id)
            .andWhere('indeximages.typebooks_id', bookRecord.typebooks_id)
            .andWhere('indeximages.companies_id', bookRecord.companies_id);
        let hasPendingRename = false;
        if (_indexImage.length > 0) {
            for (const data of _indexImage) {
                const fileTimestamp = getStableFileTimestamp(data.file_name, data.date_atualization || data.createdAt);
                const newFileName = await mountNameFileWithTimestamp(bookRecord, data?.seq, data.file_name, fileTimestamp);
                await Indeximage_1.default.query()
                    .where('bookrecords_id', '=', data.bookrecords_id)
                    .andWhere('typebooks_id', '=', data.typebooks_id)
                    .andWhere('companies_id', '=', data.companies_id)
                    .andWhere('seq', '=', data.seq)
                    .update({ previous_file_name: newFileName });
                hasPendingRename = true;
            }
        }
        if (hasPendingRename && schedulePendingRename) {
            enqueuePendingRenameProcessing(bookRecord.companies_id, bookRecord.typebooks_id);
        }
    }
    catch (error) {
        throw error;
    }
}
exports.updateFileName = updateFileName;
async function totalFilesInFolder(folderName, cloud_number, book = []) {
    try {
        const idFolder = await (0, googledrive_1.sendSearchFile)(folderName, cloud_number);
        const listFiles = await (0, googledrive_1.sendListAllFiles)(cloud_number, idFolder, book);
        if (listFiles) {
            return listFiles;
        }
        else
            return 0;
    }
    catch (error) {
        return 0;
    }
}
exports.totalFilesInFolder = totalFilesInFolder;
async function indeximagesinitial(folderName, companies_id, cloud_number, listFilesImages = [], book = []) {
    console.log("@@PASSO 66.1");
    let listFiles = [];
    if (Array.isArray(listFilesImages) && listFilesImages.length > 0) {
        console.log("@@PASSO 66.2##");
        listFiles = listFilesImages;
    }
    else {
        console.log("@@PASSO 66.3##");
        listFiles = await totalFilesInFolder(folderName?.path, cloud_number, book);
    }
    console.log("@@PASSO 66.2");
    const bookRecord = [];
    const indexImages = [];
    const uniqueIds = new Set();
    console.log("@@PASSO 66.3");
    for (const file of listFiles) {
        console.log("@@PASSO 66.4");
        if (!/^id/i.test(file))
            continue;
        const fileSplit = file.split('_');
        if (!fileSplit || fileSplit.length < 12)
            continue;
        const idMatch = fileSplit[0]?.match(/\d+/g);
        const codMatch = fileSplit[1]?.match(/\((\d+)\)/);
        const seqMatch = fileSplit[1]?.match(/^(\d+)/);
        if (!idMatch || !idMatch[0] || !seqMatch || !seqMatch[0])
            continue;
        const id = idMatch[0];
        const typebooks_id = fileSplit[2];
        const bookrecords_id = id;
        const seq = seqMatch[0];
        const ext = path_1.default.extname(file);
        const booksMatch = fileSplit[7]?.match(/\d+/g);
        const books_id = booksMatch && booksMatch[0] ? booksMatch[0] : null;
        const cod = codMatch && codMatch[1] ? codMatch[1] : null;
        const book = fileSplit[3] === '' ? null : fileSplit[3];
        const sheet = fileSplit[4] === '' ? null : fileSplit[4];
        const side = fileSplit[6] || null;
        const approximate_term = fileSplit[5] === '' ? null : fileSplit[5];
        const indexbook = fileSplit[8] === '' ? null : fileSplit[8];
        const obs = fileSplit[9] === '' ? null : fileSplit[9];
        const letter = fileSplit[10] === '' ? null : fileSplit[10];
        const year = fileSplit[11] === '' ? null : fileSplit[11];
        const yeardoc = fileSplit[4] === '' ? null : fileSplit[4];
        const month = fileSplit[6] === '' ? null : fileSplit[6];
        if (!uniqueIds.has(id)) {
            uniqueIds.add(id);
            bookRecord.push({
                id,
                typebooks_id,
                books_id,
                companies_id,
                cod,
                book,
                sheet,
                side,
                approximate_term,
                indexbook,
                obs,
                letter,
                year,
                yeardoc,
                month,
            });
        }
        indexImages.push({
            bookrecords_id,
            typebooks_id,
            companies_id,
            seq,
            ext,
            file_name: file,
            previous_file_name: file,
        });
    }
    bookRecord.sort((a, b) => Number(a.id) - Number(b.id));
    indexImages.sort((a, b) => {
        const idDiff = Number(a.bookrecords_id) - Number(b.bookrecords_id);
        if (idDiff !== 0)
            return idDiff;
        return Number(a.seq) - Number(b.seq);
    });
    console.log("@@PASSO 66.5");
    return { bookRecord, indexImages };
}
exports.indeximagesinitial = indeximagesinitial;
//# sourceMappingURL=fileRename.js.map