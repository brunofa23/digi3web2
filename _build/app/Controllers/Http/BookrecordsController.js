"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const Bookrecord_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Bookrecord"));
const Indeximage_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Indeximage"));
const Env_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Env"));
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const validations_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/Validations/validations"));
const BadRequestException_2 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const Typebook_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Typebook"));
const fileRename = require('../../Services/fileRename/fileRename');
class BookrecordsController {
    async index({ auth, request, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const { codstart, codend, bookstart, bookend, approximateterm, indexbook, year, letter, sheetstart, sheetend, side, obs, sheetzero, noAttachment, lastPagesOfEachBook, codMax } = request.requestData;
        console.log("request", request.requestData);
        let query = " 1=1 ";
        if (!codstart && !codend && !approximateterm && !year && !indexbook && !letter && !bookstart && !bookend && !sheetstart && !sheetend && !side && (!sheetzero || sheetzero == 'false') &&
            (lastPagesOfEachBook == 'false' || !lastPagesOfEachBook) && noAttachment == 'false' && !obs)
            return null;
        else {
            if (codstart != undefined && codend == undefined)
                query += ` and cod =${codstart} `;
            else if (codstart != undefined && codend != undefined)
                query += ` and cod >=${codstart} `;
            if (codend != undefined)
                query += ` and cod <= ${codend}`;
            if (bookstart != undefined && bookend == undefined)
                query += ` and book =${bookstart} `;
            else if (bookstart != undefined && bookend != undefined)
                query += ` and book >=${bookstart} `;
            if (bookend != undefined)
                query += ` and book <= ${bookend}`;
            if (sheetstart != undefined && sheetend == undefined)
                query += ` and sheet =${sheetstart} `;
            else if (sheetstart != undefined && sheetend != undefined)
                query += ` and sheet >=${sheetstart} `;
            if (sheetend != undefined)
                query += ` and sheet <= ${sheetend}`;
            if (side != undefined)
                query += ` and side = '${side}' `;
            if (approximateterm != undefined)
                query += ` and approximate_term=${approximateterm}`;
            if (obs != undefined)
                query += ` and obs like '${obs}%'`;
            if (indexbook != undefined)
                query += ` and indexbook=${indexbook} `;
            if (year != undefined)
                query += ` and year like '${year}%' `;
            if (letter != undefined)
                query += ` and letter like '${letter}' `;
            if (!sheetzero || (sheetzero == 'false'))
                query += ` and sheet>0`;
        }
        if (lastPagesOfEachBook) {
            query += ` and sheet in (select max(sheet) from bookrecords bookrecords1 where (bookrecords1.book = bookrecords.book) and (bookrecords1.typebooks_id=bookrecords.typebooks_id)) `;
        }
        const page = request.input('page', 1);
        const limit = Env_1.default.get('PAGINATION');
        let data;
        if (noAttachment) {
            data = await Bookrecord_1.default.query()
                .where('companies_id', '=', authenticate.companies_id)
                .andWhere('typebooks_id', '=', params.typebooks_id)
                .whereNotExists((subquery) => {
                subquery
                    .select('id')
                    .from('indeximages')
                    .whereColumn('indeximages.bookrecords_id', '=', 'bookrecords.id')
                    .andWhere('indeximages.typebooks_id', '=', params.typebooks_id);
            })
                .whereRaw(query)
                .orderBy("book", "asc")
                .orderBy("cod", "asc")
                .orderBy("sheet", "asc")
                .paginate(page, limit);
        }
        else if (codMax) {
            data = await Database_1.default.from('bookrecords')
                .where('companies_id', authenticate.companies_id)
                .where('typebooks_id', params.typebooks_id)
                .max('cod as codMax');
        }
        else {
            data = await Bookrecord_1.default.query()
                .where("companies_id", '=', authenticate.companies_id)
                .andWhere("typebooks_id", '=', params.typebooks_id)
                .preload('indeximage', (queryIndex) => {
                queryIndex.where("typebooks_id", '=', params.typebooks_id);
            })
                .whereRaw(query)
                .orderBy("book", "asc")
                .orderBy("cod", "asc")
                .orderBy("sheet", "asc")
                .paginate(page, limit);
        }
        return response.status(200).send(data);
    }
    async show({ params }) {
        const data = await Bookrecord_1.default.findOrFail(params.id);
        return {
            data: data,
        };
    }
    async store({ auth, request, params, response }) {
        const { companies_id } = await auth.use('api').authenticate();
        const body = request.only(Bookrecord_1.default.fillable);
        body.companies_id = companies_id;
        try {
            const data = await Bookrecord_1.default.create(body);
            return response.status(201).send(data);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401, error);
        }
    }
    async update({ auth, request, params, response }) {
        const { companies_id } = await auth.use('api').authenticate();
        const body = request.only(Bookrecord_1.default.fillable);
        body.id = params.id;
        body.companies_id = companies_id;
        try {
            const data = await Bookrecord_1.default.findOrFail(body.id);
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
                .andWhere('bookrecords_id', "=", params.id)
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
            const data = await Bookrecord_1.default.query()
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
        console.log("destroy many bookrecords>>>");
        const { companies_id } = await auth.use('api').authenticate();
        const { typebooks_id, Book, startCod, endCod, deleteImages } = request.only(['typebooks_id', 'Book', 'startCod', 'endCod', 'deleteImages']);
        async function deleteIndexImages() {
            try {
                const deleteData = await Indeximage_1.default
                    .query()
                    .delete()
                    .whereIn("bookrecords_id", Database_1.default.from('bookrecords')
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
                const data = await Bookrecord_1.default
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
                    .whereIn("bookrecords_id", Database_1.default.from('bookrecords')
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
        if (Book == undefined)
            return null;
        if (typebooks_id != undefined) {
            if (Book != undefined) {
                query += ` and book=${Book} `;
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
    async createorupdatebookrecords({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const _request = request.requestBody;
        let newRecord = [];
        let updateRecord = [];
        for (const iterator of _request) {
            if (!iterator.id) {
                newRecord.push({
                    typebooks_id: iterator.typebooks_id,
                    books_id: iterator.books_id,
                    companies_id: authenticate.companies_id,
                    cod: iterator.cod,
                    book: iterator.book,
                    sheet: iterator.sheet,
                    side: iterator.side,
                    approximate_term: iterator.approximate_term,
                    indexbook: iterator.indexbook,
                    obs: iterator.obs,
                    letter: iterator.letter,
                    year: iterator.year,
                    model: iterator.model
                });
            }
            else {
                updateRecord.push({
                    id: iterator.id,
                    typebooks_id: iterator.typebooks_id,
                    books_id: iterator.books_id,
                    companies_id: authenticate.companies_id,
                    cod: iterator.cod,
                    book: iterator.book,
                    sheet: iterator.sheet,
                    side: iterator.side,
                    approximate_term: iterator.approximate_term,
                    indexbook: iterator.indexbook,
                    obs: iterator.obs,
                    letter: iterator.letter,
                    year: iterator.year,
                    model: iterator.model
                });
            }
        }
        await Bookrecord_1.default.createMany(newRecord);
        await Bookrecord_1.default.updateOrCreateMany('id', updateRecord);
        return response.status(201).send({ "Mensage": "Sucess!" });
    }
    async generateOrUpdateBookrecords({ auth, request, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        let { generateBooks_id, generateBook, generateBookdestination, generateStartCode, generateEndCode, generateStartSheetInCodReference, generateEndSheetInCodReference, generateSheetStart, generateSheetIncrement, generateSideStart, generateAlternateOfSides, generateApproximate_term, generateApproximate_termIncrement, generateIndex, generateIndexIncrement, generateYear, } = request.requestData;
        const _startCode = generateStartCode;
        const _endCode = generateEndCode;
        if (!generateBook || isNaN(generateBook) || generateBook <= 0) {
            let errorValidation = await new validations_1.default('bookrecord_error_100');
            throw new BadRequestException_1.default(errorValidation.message, errorValidation.status, errorValidation.code);
        }
        if (!generateStartCode || generateStartCode <= 0) {
            let errorValidation = await new validations_1.default('bookrecord_error_101');
            throw new BadRequestException_1.default(errorValidation.message, errorValidation.status, errorValidation.code);
        }
        if (!generateEndCode || generateEndCode <= 0) {
            let errorValidation = await new validations_1.default('bookrecord_error_102');
            throw new BadRequestException_1.default(errorValidation.message, errorValidation.status, errorValidation.code);
        }
        let contSheet = !generateSheetStart ? 0 : generateSheetStart;
        let contFirstSide = false;
        let sideNow = 0;
        let approximate_term = generateApproximate_term;
        let approximate_termIncrement = 0;
        let indexBook = generateIndex;
        let indexIncrement = 0;
        let sheetStart = 0;
        let sheetIncrement = 0;
        let contSheetStartCod = 0;
        let contSheetStartCodini = false;
        let sheetStartInitial = true;
        const bookrecords = [];
        if (generateBookdestination <= 0 || !generateBookdestination || generateBookdestination == undefined) {
            for (let index = (generateStartCode + 1); index <= generateEndCode + 1; index++) {
                if (generateAlternateOfSides == "F")
                    generateSideStart = "F";
                else if (generateAlternateOfSides == "V")
                    generateSideStart = "V";
                else if (generateAlternateOfSides == "FV") {
                    if (contFirstSide == false) {
                        generateSideStart = (generateSideStart == "F" ? "V" : "F");
                        contFirstSide = true;
                    }
                    generateSideStart = (generateSideStart == "F" ? "V" : "F");
                }
                else if (generateAlternateOfSides == "FFVV") {
                    if (sideNow >= 2) {
                        generateSideStart = (generateSideStart == "F" ? "V" : "F");
                        sideNow = 0;
                    }
                    sideNow++;
                }
                if (generateApproximate_term > 0) {
                    if (index == 0) {
                        approximate_term = generateApproximate_term;
                        approximate_termIncrement++;
                        if (approximate_termIncrement >= generateApproximate_termIncrement && generateApproximate_termIncrement > 1) {
                            approximate_termIncrement = 0;
                        }
                    }
                    else {
                        if (approximate_termIncrement >= generateApproximate_termIncrement) {
                            approximate_termIncrement = 0;
                            approximate_term++;
                        }
                        approximate_termIncrement++;
                    }
                }
                if (generateIndex > 0) {
                    if (index == 0) {
                        indexBook = generateIndex;
                        indexIncrement++;
                        if (indexIncrement >= generateIndexIncrement && generateIndexIncrement > 1) {
                            indexIncrement = 0;
                        }
                    }
                    else {
                        if (indexIncrement >= generateIndexIncrement) {
                            indexIncrement = 0;
                            indexBook++;
                        }
                        indexIncrement++;
                    }
                }
                if (generateStartSheetInCodReference <= generateStartCode) {
                    console.log("Começar a contar::", generateStartSheetInCodReference);
                    if (generateSheetIncrement == 1) {
                        sheetStart = generateSheetStart;
                        generateStartSheetInCodReference++;
                        generateSheetStart++;
                    }
                    else if (generateSheetIncrement == 2) {
                        if (sheetIncrement < 2) {
                            sheetStart = generateSheetStart;
                            sheetIncrement++;
                        }
                        if (sheetIncrement == 2) {
                            sheetIncrement = 0;
                            generateStartSheetInCodReference++;
                            generateSheetStart++;
                        }
                    }
                    else if (generateSheetIncrement == 3) {
                        if (sheetIncrement < 3) {
                            sheetStart = generateSheetStart;
                            sheetIncrement++;
                        }
                        if (sheetIncrement == 3) {
                            sheetIncrement = 0;
                            generateStartSheetInCodReference++;
                            generateSheetStart++;
                        }
                    }
                    else if (generateSheetIncrement == 4) {
                        if (sheetIncrement < 4) {
                            sheetStart = generateSheetStart;
                            sheetIncrement++;
                        }
                        if (sheetIncrement == 4) {
                            sheetIncrement = 0;
                            generateStartSheetInCodReference++;
                            generateSheetStart++;
                        }
                    }
                }
                bookrecords.push({
                    cod: generateStartCode++,
                    book: generateBook,
                    sheet: ((!generateSheetStart || generateSheetStart == 0) ? undefined : sheetStart),
                    side: (!generateSideStart || (generateSideStart != "F" && generateSideStart != "V") ? undefined : generateSideStart),
                    approximate_term: ((!generateApproximate_term || generateApproximate_term == 0) ? undefined : approximate_term),
                    indexbook: ((!generateIndex || generateIndex == 0) ? undefined : indexBook),
                    year: ((!generateYear ? undefined : generateYear)),
                    typebooks_id: params.typebooks_id,
                    books_id: generateBooks_id,
                    companies_id: authenticate.companies_id
                });
            }
        }
        try {
            const data = await Bookrecord_1.default.updateOrCreateMany(['cod', 'book', 'books_id', 'companies_id'], bookrecords);
            if (generateBook > 0 && generateBookdestination > 0) {
                const teste = await Bookrecord_1.default.query().where("companies_id", "=", authenticate.companies_id)
                    .andWhere('book', '=', generateBook)
                    .andWhere('typebooks_id', '=', params.typebooks_id)
                    .update({ book: generateBookdestination });
                console.log("teste", teste);
            }
            let successValidation = await new validations_1.default('bookrecord_success_100');
            return response.status(201).send(data.length, successValidation.code);
        }
        catch (error) {
            throw new BadRequestException_1.default("Bad Request", 402);
        }
    }
    async indeximagesinitial({ auth, params }) {
        const authenticate = await auth.use('api').authenticate();
        let listFiles;
        try {
            const foldername = await Typebook_1.default.query().where("companies_id", "=", authenticate.companies_id).andWhere("id", "=", params.typebooks_id).first();
            listFiles = await fileRename.indeximagesinitial(foldername, authenticate.companies_id);
        }
        catch (error) {
            return error;
        }
        for (const item of listFiles.bookRecord) {
            try {
                await Bookrecord_1.default.create(item);
            }
            catch (error) {
                console.log("ERRO BOOKRECORD::", error);
            }
        }
        for (const item of listFiles.indexImages) {
            try {
                await Indeximage_1.default.create(item);
            }
            catch (error) {
                console.log("ERRO indeximage::", error);
            }
        }
        return "sucesso!!";
    }
}
exports.default = BookrecordsController;
//# sourceMappingURL=BookrecordsController.js.map