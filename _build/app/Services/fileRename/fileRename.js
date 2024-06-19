"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Bookrecord_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Bookrecord"));
const Typebook_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Typebook"));
const Indeximage_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Indeximage"));
const Application_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Application"));
const Company_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Company"));
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const pino_std_serializers_1 = require("pino-std-serializers");
const luxon_1 = require("luxon");
const googledrive_1 = global[Symbol.for('ioc.use')]("App/Services/googleDrive/googledrive");
const fs = require('fs');
const path = require('path');
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
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
async function downloadImage(fileName, typebook_id, company_id, cloud_number) {
    const directoryParent = await Typebook_1.default.query()
        .where('id', '=', typebook_id)
        .andWhere('companies_id', '=', company_id).first();
    const parent = await (0, googledrive_1.sendSearchFile)(directoryParent?.path, cloud_number);
    const extension = path.extname(fileName);
    const fileId = await (0, googledrive_1.sendSearchFile)(fileName, cloud_number, parent[0].id);
    const download = await (0, googledrive_1.sendDownloadFile)(fileId[0].id, extension, cloud_number);
    return download;
}
async function transformFilesNameToId(images, params, companies_id, cloud_number, capture = false, dataImages = {}) {
    const _companies_id = companies_id;
    let result = [];
    const folderPath = Application_1.default.tmpPath(`/uploads/Client_${companies_id}`);
    try {
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath);
        }
    }
    catch (error) {
        throw new BadRequestException_1.default('could not create client directory', 409, error);
    }
    const directoryParent = await Typebook_1.default.query()
        .where('id', '=', params.typebooks_id)
        .andWhere('companies_id', '=', companies_id).first();
    if (!directoryParent || directoryParent == undefined)
        throw new BadRequestException_1.default('undefined book', 409);
    let parent = await (0, googledrive_1.sendSearchFile)(directoryParent?.path, cloud_number);
    if (parent.length == 0) {
        const company = await Company_1.default.findByOrFail('id', _companies_id);
        const idFolderCompany = await (0, googledrive_1.sendSearchFile)(company.foldername, cloud_number);
        await (0, googledrive_1.sendCreateFolder)(directoryParent?.path, cloud_number, idFolderCompany[0].id);
        await sleep(2000);
    }
    await sleep(1000);
    const idParent = await (0, googledrive_1.sendSearchFile)(directoryParent?.path, cloud_number);
    if (capture) {
        const _fileRename = await fileRename(images, params.typebooks_id, companies_id);
        try {
            await pushImageToGoogle(images, folderPath, _fileRename, idParent[0].id, cloud_number, true);
            return images;
        }
        catch (error) {
            console.log(error);
            return error;
        }
    }
    let cont = 0;
    let _fileRename;
    for (let image of images) {
        cont++;
        if (cont >= 6) {
            await sleep(4000);
            cont = 0;
        }
        if (!image) {
            console.log("não é imagem");
        }
        if (!image.isValid) {
            console.log("Error", image.errors);
        }
        _fileRename = await fileRename(image.clientName, params.typebooks_id, companies_id, dataImages);
        try {
            if (image && image.isValid) {
                result.push(await pushImageToGoogle(image, folderPath, _fileRename, idParent[0].id, cloud_number));
            }
        }
        catch (error) {
            await new BadRequestException_1.default(error + 'pushImageToGoogle', 409);
        }
    }
    return result;
}
async function renameFileGoogle(filename, folderPath, newTitle, cloud_number) {
    console.log("renameFile>>>", cloud_number);
    try {
        const idFolderPath = await (0, googledrive_1.sendSearchFile)(folderPath, cloud_number);
        const idFile = await (0, googledrive_1.sendSearchFile)(filename, cloud_number, idFolderPath[0].id);
        const renameFile = await (0, googledrive_1.sendRenameFile)(idFile[0].id, newTitle, cloud_number);
    }
    catch (error) {
        console.log("ERROR 1456", error);
    }
}
async function pushImageToGoogle(image, folderPath, objfileRename, idParent, cloud_number, capture = false) {
    try {
        if (capture) {
            await fs.rename(image, `${path.dirname(image)}/${objfileRename.file_name}`, function (err) {
                if (err) {
                    throw err;
                }
                else {
                }
            });
        }
        else {
            await image.move(folderPath, { name: objfileRename.file_name, overwrite: true });
        }
        await (0, googledrive_1.sendUploadFiles)(idParent, folderPath, `${objfileRename.file_name}`, cloud_number);
        if (!objfileRename.typeBookFile || objfileRename.typeBookFile == false) {
            const date_atualization = luxon_1.DateTime.now();
            objfileRename.date_atualization = date_atualization.toFormat('yyyy-MM-dd HH:mm');
            await Indeximage_1.default.create(objfileRename);
        }
        await deleteImage(`${folderPath}/${objfileRename.file_name}`);
    }
    catch (error) {
        throw new BadRequestException_1.default(error + ' sendUploadFiles', 409);
    }
    return objfileRename.file_name;
}
async function fileRename(originalFileName, typebooks_id, companies_id, dataImages = {}) {
    let query;
    let objFileName;
    let separators;
    let arrayFileName;
    const regexBookAndCod = /^L\d+\(\d+\).*$/;
    const regexBookSheetSide = /^L\d+_\d+_[FV].*/;
    const regexBookAndTerm = /^T\d+\(\d+\)(.*?)\.\w+$/;
    if (dataImages.typeBookFile) {
        let fileName;
        if (dataImages.book && dataImages.sheet && dataImages.side) {
            fileName = `L${dataImages.book}_${dataImages.sheet}_${dataImages.side}-${dataImages.typeBookFile}${path.extname(originalFileName).toLowerCase()}`;
        }
        else if (dataImages.book && dataImages.cod) {
            fileName = `L${dataImages.book}(${dataImages.cod})-${dataImages.typeBookFile}${path.extname(originalFileName).toLowerCase()}`;
        }
        else if (dataImages.book && dataImages.approximateTerm) {
            fileName = `T${dataImages.book}(${dataImages.approximateTerm})-${dataImages.typeBookFile}${path.extname(originalFileName).toLowerCase()}`;
        }
        const fileRename = {
            file_name: fileName,
            typebooks_id,
            companies_id,
            previous_file_name: originalFileName,
            typeBookFile: true
        };
        return fileRename;
    }
    else if (regexBookAndCod.test(originalFileName.toUpperCase())) {
        separators = ["L", '\'', '(', ')', '|', '-'];
        arrayFileName = originalFileName.split(new RegExp('([' + separators.join('') + '])'));
        objFileName = {
            type: arrayFileName[1],
            book: arrayFileName[2],
            cod: arrayFileName[4],
            ext: arrayFileName[6]
        };
        query = ` cod =${objFileName.cod} and book = ${objFileName.book} `;
    }
    else if (regexBookSheetSide.test(originalFileName.toUpperCase())) {
        separators = ["L", '_', '|', '-'];
        arrayFileName = originalFileName.split(new RegExp('([' + separators.join('') + '])'));
        objFileName = {
            type: arrayFileName[1],
            book: arrayFileName[2],
            sheet: arrayFileName[4],
            side: arrayFileName[6][0],
            ext: path.extname(originalFileName).toLowerCase()
        };
        query = ` book = ${objFileName.book} and sheet =${objFileName.sheet} and side='${objFileName.side}'`;
    }
    else if (path.basename(originalFileName).startsWith('Id')) {
        const arrayFileName = path.basename(originalFileName).split(/[_,.\s]/);
        objFileName = {
            id: arrayFileName[0].replace('Id', ''),
            cod: arrayFileName[1].replace('(', '').replace(')', ''),
            ext: `.${arrayFileName[arrayFileName.length - 1]}`
        };
        originalFileName = path.basename(originalFileName);
        query = ` id=${objFileName.id} and cod=${objFileName.cod} `;
    }
    else if (regexBookAndTerm.test(originalFileName.toUpperCase())) {
        const arrayFileName = originalFileName.substring(1).split(/[()\.]/);
        objFileName = {
            book: arrayFileName[0],
            approximate_term: arrayFileName[1],
            ext: `.${arrayFileName[3]}`
        };
        query = ` approximate_term=${objFileName.approximate_term} and book=${objFileName.book} `;
    }
    else {
        if (dataImages.book)
            query = ` book = ${dataImages.book} `;
        if (dataImages.sheet)
            query += ` and sheet = ${dataImages.sheet} `;
        if (dataImages.side)
            query += ` and side = '${dataImages.side}' `;
        if (dataImages.cod)
            query += ` and cod = '${dataImages.cod}' `;
        if (dataImages.approximateTerm)
            query += ` and approximate_term = '${dataImages.approximateTerm}' `;
        objFileName = {
            ext: path.extname(originalFileName).toLowerCase()
        };
    }
    try {
        const bookRecord = await Bookrecord_1.default.query()
            .preload('indeximage')
            .where('typebooks_id', '=', typebooks_id)
            .andWhere('companies_id', '=', companies_id)
            .whereRaw(query).first();
        if (bookRecord === null)
            return;
        const seq = bookRecord?.indeximage.length;
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
async function mountNameFile(bookRecord, seq, extFile) {
    if (!extFile.startsWith('.'))
        extFile = path.extname(extFile).toLowerCase();
    let dateNow = luxon_1.DateTime.now();
    dateNow = dateNow.toFormat('yyyyMMddHHmm');
    return `Id${bookRecord.id}_${seq}(${bookRecord.cod})_${bookRecord.typebooks_id}_${bookRecord.book}_${!bookRecord.sheet || bookRecord.sheet == null ? "" : bookRecord.sheet}_${!bookRecord.approximate_term || bookRecord.approximate_term == null ? '' : bookRecord.approximate_term}_${!bookRecord.side || bookRecord.side == null ? '' : bookRecord.side}_${bookRecord.books_id}_${!bookRecord.indexbook || bookRecord.indexbook == null ? '' : bookRecord.indexbook}_${!bookRecord.obs || bookRecord.obs == null ? '' : bookRecord.obs}_${!bookRecord.letter || bookRecord.letter == null ? '' : bookRecord.letter}_${!bookRecord.year || bookRecord.year == null ? '' : bookRecord.year}_${dateNow}${extFile.toLowerCase()}`;
}
async function deleteFile(listFiles, cloud_number) {
    try {
        const idFolder = await (0, googledrive_1.sendSearchFile)(listFiles[0]['path'], cloud_number);
        let idFile;
        for (const file of listFiles) {
            idFile = await (0, googledrive_1.sendSearchFile)(file['file_name'], cloud_number, idFolder[0].id);
            await (0, googledrive_1.sendDeleteFile)(idFile[0].id, cloud_number);
        }
        return "excluido!!!";
    }
    catch (error) {
        throw error;
    }
}
async function updateFileName(bookRecord) {
    try {
        const _indexImage = await Indeximage_1.default.query()
            .preload('typebooks', (query) => {
            query.where('id', bookRecord.typebooks_id)
                .andWhere('companies_id', bookRecord.companies_id);
        })
            .where('indeximages.bookrecords_id', bookRecord.id)
            .andWhere('indeximages.typebooks_id', bookRecord.typebooks_id)
            .andWhere('indeximages.companies_id', bookRecord.companies_id);
        if (_indexImage.length > 0) {
            for (const data of _indexImage) {
                const newFileName = await mountNameFile(bookRecord, data?.seq, data.file_name);
                await Indeximage_1.default.query()
                    .where('bookrecords_id', '=', data.bookrecords_id)
                    .andWhere('typebooks_id', '=', data.typebooks_id)
                    .andWhere('companies_id', '=', data.companies_id)
                    .andWhere('seq', '=', data.seq)
                    .update({ previous_file_name: newFileName });
            }
        }
    }
    catch (error) {
        throw error;
    }
}
async function totalFilesInFolder(folderName, cloud_number) {
    try {
        const idFolder = await (0, googledrive_1.sendSearchFile)(folderName, cloud_number);
        const listFiles = await (0, googledrive_1.sendListAllFiles)(cloud_number, idFolder);
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
async function indeximagesinitial(folderName, companies_id, cloud_number, listFilesImages = []) {
    let listFiles;
    if (listFilesImages.length > 0) {
        listFiles = listFilesImages;
    }
    else {
        listFiles = await totalFilesInFolder(folderName?.path, cloud_number);
    }
    listFiles = listFiles.filter(item => item.startsWith("Id" || "id" || "ID"));
    const objlistFilesBookRecord = listFiles.map((file) => {
        const fileSplit = file.split("_");
        const id = fileSplit[0].match(/\d+/g)[0];
        const typebooks_id = fileSplit[2];
        const books_id = fileSplit[7].match(/\d+/g)[0];
        const cod = fileSplit[1].match(/\((\d+)\)/)[0].replace(/\(|\)/g, '');
        const book = fileSplit[3] == '' ? null : fileSplit[3];
        const sheet = fileSplit[4] == '' ? null : fileSplit[4];
        const side = fileSplit[6];
        const approximate_term = fileSplit[5];
        const indexbook = fileSplit[8] == '' ? null : fileSplit[8];
        const obs = fileSplit[9];
        const letter = fileSplit[10];
        const year = fileSplit[11];
        const yeardoc = fileSplit[4] == '' ? null : fileSplit[4];
        const month = fileSplit[6];
        return {
            id, typebooks_id, books_id, companies_id, cod, book, sheet, side,
            approximate_term, indexbook, obs, letter, year, yeardoc, month
        };
    });
    const indexImages = listFiles.map((file) => {
        const fileSplit = file.split("_");
        const bookrecords_id = fileSplit[0].match(/\d+/g)[0];
        const typebooks_id = fileSplit[2];
        const seq = fileSplit[1].match(/^(\d+)/)[0];
        const ext = path.extname(file);
        return {
            bookrecords_id, typebooks_id, companies_id, seq,
            ext, file_name: file, previous_file_name: file
        };
    });
    const uniqueIds = {};
    const bookRecord = objlistFilesBookRecord.filter(obj => {
        if (!uniqueIds[obj.id]) {
            uniqueIds[obj.id] = true;
            return true;
        }
        return false;
    });
    bookRecord.sort((a, b) => a.id - b.id);
    indexImages.sort((a, b) => a.id - b.id);
    return { bookRecord, indexImages };
}
module.exports = { transformFilesNameToId, downloadImage, fileRename, deleteFile, indeximagesinitial, totalFilesInFolder, renameFileGoogle, mountNameFile, updateFileName };
//# sourceMappingURL=fileRename.js.map