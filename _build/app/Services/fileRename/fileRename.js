"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Bookrecord_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Bookrecord"));
const Indeximage_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Indeximage"));
const Application_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Application"));
const Company_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Company"));
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const authorize = global[Symbol.for('ioc.use')]('App/Services/googleDrive/googledrive');
const fs = require('fs');
const path = require('path');
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
function deleteImage(folderPath) {
    fs.unlink(`${folderPath}`, (err) => {
        if (err) {
            throw err;
        }
        console.log("Delete File successfully.");
    });
}
async function downloadImage(fileName) {
    const fileId = await authorize.sendSearchFile(fileName);
    console.log(fileId);
    const download = await authorize.sendDownloadFile(fileId[0].id);
    return download;
}
async function transformFilesNameToId(images, params, companies_id, capture = false) {
    const _companies_id = companies_id;
    let result = [];
    const folderPath = Application_1.default.tmpPath(`/uploads/Client_${companies_id}`);
    try {
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath);
        }
    }
    catch (error) {
        throw new BadRequestException_1.default('could not create client directory', 409);
    }
    const directoryParent = await Bookrecord_1.default.query()
        .preload('typebooks')
        .where('typebooks_id', '=', params.typebooks_id)
        .andWhere('companies_id', '=', companies_id).first();
    if (!directoryParent || directoryParent == undefined)
        throw new BadRequestException_1.default('undefined book', 409);
    let parent = await authorize.sendSearchFile(directoryParent?.typebooks.path);
    if (parent.length == 0) {
        const company = await Company_1.default.findByOrFail('id', _companies_id);
        const idFolderCompany = await authorize.sendSearchFile(company.foldername);
        await authorize.sendCreateFolder(directoryParent?.typebooks.path, idFolderCompany[0].id);
        await sleep(2000);
    }
    await sleep(1000);
    const idParent = await authorize.sendSearchFile(directoryParent?.typebooks.path);
    if (capture) {
        const _fileRename = await fileRename(images, params.typebooks_id, companies_id);
        try {
            await pushImageToGoogle(images, folderPath, _fileRename, idParent[0].id, true);
            console.log("UPLOAD COM SUCESSO!!!!");
            return images;
        }
        catch (error) {
            console.log(error);
            return error;
        }
    }
    let cont = 0;
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
        const _fileRename = await fileRename(image.clientName, params.typebooks_id, companies_id);
        try {
            if (image && image.isValid) {
                result.push(await pushImageToGoogle(image, folderPath, _fileRename, idParent[0].id));
            }
        }
        catch (error) {
            throw new BadRequestException_1.default(error + 'pushImageToGoogle', 409);
        }
    }
    return result;
}
async function pushImageToGoogle(image, folderPath, objfileRename, idParent, capture = false) {
    try {
        if (capture) {
            await fs.rename(image, `${path.dirname(image)}/${objfileRename.file_name}`, function (err) {
                if (err) {
                    throw err;
                }
                else {
                    console.log('Arquivo renomeado');
                }
            });
        }
        else {
            await image.move(folderPath, { name: objfileRename.file_name, overwrite: true });
        }
        await authorize.sendUploadFiles(idParent, folderPath, `${objfileRename.file_name}`);
        await Indeximage_1.default.create(objfileRename);
        await deleteImage(`${folderPath}/${objfileRename.file_name}`);
    }
    catch (error) {
        throw new BadRequestException_1.default(error + ' sendUploadFiles', 409);
    }
    return objfileRename.file_name;
}
async function fileRename(originalFileName, typebooks_id, companies_id) {
    let query;
    let objFileName;
    if (originalFileName.toUpperCase().startsWith('L')) {
        let separators = ["L", '\'', '(', ')', '|', '-'];
        const arrayFileName = originalFileName.split(new RegExp('([' + separators.join('') + '])'));
        objFileName = {
            type: arrayFileName[1],
            book: arrayFileName[2],
            cod: arrayFileName[4],
            ext: arrayFileName[6]
        };
        query = ` cod =${objFileName.cod} and book = ${objFileName.book} `;
    }
    else if (path.basename(originalFileName).startsWith('Id')) {
        const arrayFileName = path.basename(originalFileName).split(/[_,.\s]/);
        objFileName = {
            id: arrayFileName[0].replace('Id', ''),
            cod: arrayFileName[1].replace('(', '').replace(')', ''),
            ext: `.${arrayFileName[4]}`
        };
        originalFileName = path.basename(originalFileName);
        query = ` id=${objFileName.id} and cod=${objFileName.cod} `;
    }
    try {
        const name = await Bookrecord_1.default.query()
            .preload('typebooks')
            .where('typebooks_id', '=', typebooks_id)
            .andWhere('companies_id', '=', companies_id)
            .whereRaw(query);
        const _seq = await Indeximage_1.default.query()
            .where('bookrecords_id', name[0].id)
            .andWhere('typebooks_id', '=', typebooks_id)
            .andWhere('companies_id', '=', companies_id)
            .orderBy('seq', 'desc').first();
        const seq = (!_seq ? 0 : _seq.seq + 1);
        const fileRename = {
            file_name: `Id${name[0].id}_${seq}(${name[0].cod})_${name[0].typebooks_id}_${name[0].book}_${!name[0].sheet || name[0].sheet == null ? "" : name[0].sheet}_${!name[0].approximate_term || name[0].approximate_term == null ? '' : name[0].approximate_term}_${!name[0].side || name[0].side == null ? '' : name[0].side}_${name[0].books_id}${objFileName.ext}`,
            bookrecords_id: name[0].id,
            typebooks_id,
            companies_id,
            seq,
            ext: objFileName.ext,
            previous_file_name: originalFileName
        };
        return fileRename;
    }
    catch (error) {
        return error;
    }
}
module.exports = { transformFilesNameToId, downloadImage, fileRename };
//# sourceMappingURL=fileRename.js.map