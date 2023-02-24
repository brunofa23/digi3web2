"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Bookrecord_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Bookrecord"));
const Indeximage_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Indeximage"));
const Application_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Application"));
const Company_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Company"));
const authorize = global[Symbol.for('ioc.use')]('App/Services/googleDrive/googledrive');
const fs = require('fs');
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
async function transformFilesNameToId(images, params, companies_id) {
    const _companies_id = companies_id;
    let result = [];
    let query = "";
    const folderPath = Application_1.default.tmpPath(`/uploads/Client_${companies_id}`);
    try {
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath);
        }
    }
    catch (error) {
        return error;
    }
    const directoryParent = await Bookrecord_1.default.query()
        .preload('typebooks')
        .where('typebooks_id', '=', params.typebooks_id)
        .andWhere('companies_id', '=', companies_id).first();
    if (!directoryParent || directoryParent == undefined)
        return "LIVRO SEM REGISTROS PARA VINCULAR IMAGENS";
    let parent = await authorize.sendSearchFile(directoryParent?.typebooks.path);
    if (parent.length == 0) {
        const company = await Company_1.default.findByOrFail('id', _companies_id);
        const idFolderCompany = await authorize.sendSearchFile(company.foldername);
        await authorize.sendCreateFolder(directoryParent?.typebooks.path, idFolderCompany[0].id);
        await sleep(2000);
    }
    await sleep(1000);
    const idParent = await authorize.sendSearchFile(directoryParent?.typebooks.path);
    let cont = 0;
    for (let image of images) {
        cont++;
        if (cont >= 5) {
            console.log("Begin");
            await sleep(2000);
            console.log("End");
            cont = 0;
        }
        if (!image) {
            console.log("não é imagem");
        }
        if (!image.isValid) {
            console.log("Error", image.errors);
        }
        if (image.clientName.toUpperCase().startsWith('L')) {
            let separators = ["L", '\'', '(', ')', '|', '-'];
            let arrayFileName = image.clientName.split(new RegExp('([' + separators.join('') + '])'));
            query = ` cod =${arrayFileName[4]} and book = ${arrayFileName[2]} `;
            try {
                const name = await Bookrecord_1.default.query()
                    .preload('typebooks')
                    .where('typebooks_id', '=', params.typebooks_id)
                    .andWhere('companies_id', '=', _companies_id)
                    .whereRaw(query);
                const data = await Indeximage_1.default.query()
                    .where('bookrecords_id', name[0].id)
                    .andWhere('typebooks_id', '=', params.typebooks_id)
                    .andWhere('companies_id', '=', _companies_id)
                    .orderBy('seq', 'desc').first();
                console.log("passei aqui...");
                if (!data)
                    this.seq = 0;
                else
                    this.seq = data.seq + 1;
                const fileName = `id${name[0].id}_${this.seq}(${name[0].cod})_${name[0].typebooks_id}_${name[0].book}_${name[0].sheet}_${name[0].approximate_term == null ? '' : name[0].approximate_term}_${name[0].side}_${name[0].books_id}.${image.extname}`;
                const bookrecords_id = name[0].id;
                const typebooks_id = params.typebooks_id;
                const companies_id = _companies_id;
                const seq = this.seq;
                const ext = image.extname;
                const file_name = fileName;
                const previous_file_name = image.clientName;
                const indexImage = {
                    bookrecords_id,
                    typebooks_id,
                    companies_id,
                    seq,
                    ext,
                    file_name,
                    previous_file_name
                };
                if (image && image.isValid) {
                    await image.move(folderPath, { name: fileName, overwrite: true });
                    await authorize.sendUploadFiles(idParent[0].id, folderPath, `${fileName}`);
                    const dataIndexImage = await Indeximage_1.default.create(indexImage);
                    await deleteImage(`${folderPath}/${fileName}`);
                    result.push(dataIndexImage);
                }
            }
            catch (error) {
                console.log(error);
            }
        }
    }
    console.log("total:", result.length);
    return result.length;
}
async function downloadImage(fileName, companies_id) {
    const fileId = await authorize.sendSearchFile(fileName);
    console.log(fileId);
    const download = await authorize.sendDownloadFile(fileId[0].id);
    return download;
}
module.exports = { transformFilesNameToId, downloadImage };
//# sourceMappingURL=fileRename.js.map