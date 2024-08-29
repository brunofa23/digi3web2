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
const Document_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Document"));
const BookrecordValidator_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Validators/BookrecordValidator"));
const fileRename = require('../../Services/fileRename/fileRename');
class BookrecordsController {
    async index({ auth, request, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const { codstart, codend, bookstart, bookend, approximateterm, indexbook, year, letter, sheetstart, sheetend, side, obs, sheetzero, noAttachment, lastPagesOfEachBook, codMax, document } = request.requestData;
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
            if (document != 'true')
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
                    .andWhere('indeximages.typebooks_id', '=', params.typebooks_id)
                    .andWhere("companies_id", '=', authenticate.companies_id);
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
                .where("companies_id", authenticate.companies_id)
                .andWhere("typebooks_id", params.typebooks_id)
                .preload('indeximage', (queryIndex) => {
                queryIndex.where("typebooks_id", '=', params.typebooks_id)
                    .andWhere("companies_id", '=', authenticate.companies_id);
            })
                .preload('document', query => {
                query.where('typebooks_id', params.typebooks_id)
                    .andWhere("companies_id", authenticate.companies_id);
            })
                .whereRaw(query)
                .orderBy("book", "asc")
                .orderBy("cod", "asc")
                .orderBy("sheet", "asc")
                .paginate(page, limit);
        }
        return response.status(200).send(data);
    }
    async fastFind({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const { book, sheet, typebook } = request.only(['book', 'sheet', 'typebook']);
        const query = Bookrecord_1.default.query()
            .where("bookrecords.companies_id", authenticate.companies_id)
            .preload('indeximage', (subQuery) => {
            subQuery.select('indeximages.*');
            subQuery.where('companies_id', authenticate.companies_id);
        })
            .preload('typebooks', (subQuery) => {
            subQuery.select('typebooks.*');
            subQuery.where('companies_id', authenticate.companies_id);
        });
        if (book)
            query.where('bookrecords.book', book);
        if (sheet)
            query.where('bookrecords.sheet', sheet);
        if (typebook)
            query.where('bookrecords.typebooks_id', typebook);
        query.orderBy('bookrecords.book', 'asc')
            .orderBy('bookrecords.cod', 'asc')
            .orderBy('bookrecords.sheet', 'asc');
        const data = await query;
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
        const body = await request.validate(BookrecordValidator_1.default);
        const { document } = request.only(['document']);
        body.companies_id = companies_id;
        const bodyDocument = document;
        try {
            const data = await Bookrecord_1.default.create(body);
            if (body.books_id == 13 && data.id) {
                bodyDocument.bookrecords_id = data.id;
                await Document_1.default.create(bodyDocument);
            }
            return response.status(201).send(data);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401, error);
        }
    }
    async update({ auth, request, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const body = request.only(Bookrecord_1.default.fillable);
        const { document } = request.only(['document']);
        body.id = params.id;
        body.companies_id = authenticate.companies_id;
        body.userid = authenticate.id;
        try {
            await Bookrecord_1.default.query()
                .where('id', body.id)
                .andWhere('typebooks_id', body.typebooks_id)
                .andWhere('companies_id', authenticate.companies_id)
                .update(body);
            if (body.books_id == 13 && body.id) {
                await Document_1.default.query()
                    .where('id', document.id)
                    .andWhere('typebooks_id', body.typebooks_id)
                    .andWhere('companies_id', authenticate.companies_id)
                    .update(document);
            }
            fileRename.updateFileName(body);
            return response.status(201).send({ body, params: params.id });
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401, error);
        }
    }
    async destroy({ auth, request, params, response }) {
        const { companies_id } = await auth.use('api').authenticate();
        try {
            const listOfImagesToDeleteGDrive = await Indeximage_1.default.query()
                .preload('typebooks', (query) => {
                query.where('id', params.typebooks_id)
                    .andWhere('companies_id', companies_id);
            })
                .where('typebooks_id', params.typebooks_id)
                .andWhere('bookrecords_id', params.id)
                .andWhere('companies_id', companies_id);
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
        const { companies_id } = await auth.use('api').authenticate();
        const { typebooks_id, Book, Bookend, startCod, endCod, deleteImages } = request.only(['typebooks_id', 'Book', 'Bookend', 'startCod', 'endCod', 'deleteImages']);
        async function deleteIndexImages(query) {
            try {
                const deleteData = await Database_1.default
                    .from('indeximages')
                    .innerJoin('bookrecords', function () {
                    this.on('indeximages.bookrecords_id', 'bookrecords.id')
                        .andOn('indeximages.typebooks_id', 'bookrecords.typebooks_id')
                        .andOn('indeximages.companies_id', 'bookrecords.companies_id');
                })
                    .where('indeximages.typebooks_id', typebooks_id)
                    .andWhere('indeximages.companies_id', companies_id)
                    .whereRaw(query)
                    .delete();
                return response.status(201).send({ deleteData });
            }
            catch (error) {
                return error;
            }
        }
        async function deleteBookrecord(query) {
            try {
                const data = await Bookrecord_1.default
                    .query()
                    .where('typebooks_id', typebooks_id)
                    .andWhere('companies_id', companies_id)
                    .whereRaw(query)
                    .delete();
                return response.status(201).send({ data });
            }
            catch (error) {
                return error;
            }
        }
        async function deleteImagesGoogle(query) {
            try {
                const listOfImagesToDeleteGDrive = await Indeximage_1.default
                    .query()
                    .preload('typebooks', (query) => {
                    query.where('id', typebooks_id)
                        .andWhere('companies_id', companies_id);
                })
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
            if (Book != undefined && (Bookend > 0 && Bookend !== undefined)) {
                query += ` and book >=${Book} and book <=${Bookend}`;
            }
            else if (Book != undefined) {
                query += ` and book=${Book} `;
            }
            if (startCod > 0 && (endCod == undefined || endCod == 0))
                query += ` and cod=${startCod} `;
            else if (startCod != undefined && endCod != undefined && startCod > 0 && endCod > 0)
                query += ` and cod>=${startCod} and cod <=${endCod} `;
            try {
                if (deleteImages == 1) {
                    deleteIndexImages(query);
                    deleteBookrecord(query);
                    return;
                }
                else if (deleteImages == 2) {
                    await deleteIndexImages(query);
                }
                else if (deleteImages == 3) {
                    await deleteIndexImages(query);
                    await deleteBookrecord(query);
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
        let { generateBooks_id, generateBook, generateBookdestination, generateStartCode, generateEndCode, generateStartSheetInCodReference, generateSheetStart, generateSheetIncrement, generateSideStart, generateAlternateOfSides, generateApproximate_term, generateApproximate_termIncrement, generateIndex, generateIndexIncrement, generateYear, } = request.requestData;
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
        let contFirstSide = false;
        let sideNow = 0;
        let approximate_term = generateApproximate_term;
        let approximate_termIncrement = 0;
        let indexBook = generateIndex;
        let indexIncrement = generateIndexIncrement;
        let sheetStart = 0;
        let sheetIncrement = 0;
        const bookrecords = [];
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
            if (generateStartSheetInCodReference <= generateStartCode) {
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
                indexbook: (!generateIndex ? null : generateIndex),
                year: ((!generateYear ? undefined : generateYear)),
                typebooks_id: params.typebooks_id,
                books_id: generateBooks_id,
                companies_id: authenticate.companies_id,
                userid: authenticate.id
            });
        }
        try {
            for (const record of bookrecords) {
                const existingRecord = await Bookrecord_1.default.query()
                    .where('cod', record.cod)
                    .andWhere('book', record.book)
                    .andWhere('books_id', record.books_id)
                    .andWhere('typebooks_id', record.typebooks_id)
                    .andWhere('companies_id', record.companies_id)
                    .first();
                if (existingRecord) {
                    const book = record.book;
                    if (generateBookdestination > 0) {
                        record.book = generateBookdestination;
                    }
                    await Bookrecord_1.default.query()
                        .where('cod', record.cod)
                        .andWhere('book', book)
                        .andWhere('books_id', record.books_id)
                        .andWhere('typebooks_id', record.typebooks_id)
                        .andWhere('companies_id', record.companies_id)
                        .update(record);
                    const bookrecord = await Bookrecord_1.default.query()
                        .where('cod', record.cod)
                        .andWhere('book', book)
                        .andWhere('books_id', record.books_id)
                        .andWhere('typebooks_id', record.typebooks_id)
                        .andWhere('companies_id', record.companies_id).first();
                    record.id = existingRecord.id;
                    fileRename.updateFileName(bookrecord);
                }
                else {
                    await Bookrecord_1.default.create(record);
                }
            }
            let successValidation = await new validations_1.default('bookrecord_success_100');
            return response.status(201).send(successValidation.code);
        }
        catch (error) {
            throw new BadRequestException_1.default("Bad Request", 402, error);
        }
    }
    async indeximagesinitial({ auth, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        let listFiles;
        let foldername;
        try {
            foldername = await Typebook_1.default
                .query()
                .preload('company')
                .where("companies_id", "=", authenticate.companies_id)
                .andWhere("id", "=", params.typebooks_id).first();
            if (foldername) {
                await Typebook_1.default.query()
                    .where('companies_id', '=', authenticate.companies_id)
                    .andWhere('id', '=', foldername?.id)
                    .update({ dateindex: 'Indexing', totalfiles: null });
            }
            else
                throw "ERROR::SEM PASTA DE IMAGENS";
            const listFilesToModify = await Indeximage_1.default.query()
                .where("companies_id", "=", authenticate.companies_id)
                .andWhere("typebooks_id", "=", params.typebooks_id)
                .whereNotNull('previous_file_name');
            if (listFilesToModify) {
                for (const iterator of listFilesToModify) {
                    await fileRename.renameFileGoogle(iterator.file_name, foldername.path, iterator.previous_file_name, foldername.company.cloud);
                    await Indeximage_1.default.query()
                        .where("companies_id", "=", authenticate.companies_id)
                        .andWhere("typebooks_id", "=", params.typebooks_id)
                        .andWhere("bookrecords_id", iterator.bookrecords_id)
                        .andWhere("seq", iterator.seq)
                        .andWhere("file_name", iterator.file_name)
                        .update({ file_name: iterator.previous_file_name, previous_file_name: null });
                }
            }
            listFiles = await fileRename.indeximagesinitial(foldername, authenticate.companies_id, foldername.company.cloud);
        }
        catch (error) {
            console.log(error);
        }
        for (const item of listFiles.bookRecord) {
            try {
                const { yeardoc, month, ...itemBook } = item;
                const create = await Bookrecord_1.default.create(itemBook);
                if (item.books_id == 13)
                    await Document_1.default.create({ bookrecords_id: create.id, month: item.month, yeardoc: item.yeardoc });
            }
            catch (error) {
                console.log("chequiei aqui 77 error", error);
            }
        }
        for (const item of listFiles.indexImages) {
            try {
                await Indeximage_1.default.create(item);
            }
            catch (error) {
            }
        }
        try {
            const typebookPayload = await Typebook_1.default.query()
                .where('companies_id', '=', authenticate.companies_id)
                .andWhere('id', '=', foldername.id)
                .update({ dateindex: new Date(), totalfiles: listFiles.indexImages.length });
            return response.status(201).send(typebookPayload);
        }
        catch (error) {
            return error;
        }
    }
    async bookSummary({ auth, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const typebooks_id = params.typebooks_id;
        try {
            const query = Database_1.default
                .from('bookrecords')
                .select('book', 'indexbook')
                .min('cod as initialCod')
                .max('cod as finalCod')
                .min('sheet as initialSheet')
                .max('sheet as finalSheet')
                .count('* as totalRows')
                .select(Database_1.default.raw(`
    (SELECT COUNT(*)
     FROM indeximages
     INNER JOIN bookrecords bkr ON
       (indeximages.bookrecords_id = bkr.id AND
       indeximages.companies_id = bkr.companies_id AND
       indeximages.typebooks_id = bkr.typebooks_id)
     WHERE bkr.companies_id = bookrecords.companies_id
       AND bkr.typebooks_id = bookrecords.typebooks_id
       AND bkr.book = bookrecords.book
       AND (IFNULL(bkr.indexbook,999999) = IFNULL(bookrecords.indexbook,999999))
       AND indeximages.companies_id = ${authenticate.companies_id}
       AND indeximages.typebooks_id = ${typebooks_id}
       GROUP BY bkr.book, bkr.indexbook
         ) as totalFiles
  `))
                .where('companies_id', authenticate.companies_id)
                .where('typebooks_id', typebooks_id)
                .groupBy('book', 'indexbook')
                .orderBy('bookrecords.book');
            const bookSummaryPayload = await query;
            async function countSheet(book) {
                const query = `WITH RECURSIVE NumberList AS (
                                SELECT 1 AS sheet
                                UNION ALL
                                SELECT sheet + 1
                                FROM NumberList
                                WHERE sheet < (select max(sheet)from bookrecords where companies_id=${authenticate.companies_id} and typebooks_id=${typebooks_id} and book=${book})
                                )
                              SELECT nl.sheet
                              FROM NumberList nl
                              WHERE NOT EXISTS (
                              SELECT 1
                              FROM bookrecords br
                              WHERE br.sheet = nl.sheet
                               AND br.companies_id = ${authenticate.companies_id}
                                AND br.typebooks_id =  ${typebooks_id}
                                and br.book = ${book}
                          );`;
                const result = await Database_1.default.rawQuery(query);
                const data = result[0] || [];
                const values = data.map(row => row.sheet);
                const valuesString = values.join(',');
                return valuesString;
            }
            const bookSumaryList = [];
            for (const item of bookSummaryPayload) {
                item.noSheet = await countSheet(item.book);
                bookSumaryList.push(item);
            }
            return response.status(200).send(bookSummaryPayload);
        }
        catch (error) {
            return error;
        }
    }
    async sheetWithSide({ auth, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const { typebooks_id, book } = params;
        const query = `WITH RECURSIVE NumberList AS (
        SELECT 1 AS sheet
        UNION ALL
        SELECT sheet + 1
        FROM NumberList
        WHERE sheet < (select max(sheet)from bookrecords where companies_id=${authenticate.companies_id} and typebooks_id=${typebooks_id} and book=${book})
      ),
      Sides AS (
        SELECT 'V' AS side
        UNION ALL
        SELECT 'F' AS side
      ),
      PossibleCombinations AS (
        SELECT nl.sheet, s.side
        FROM NumberList nl
        CROSS JOIN Sides s
      )
      SELECT pc.sheet, pc.side
      FROM PossibleCombinations pc
      WHERE NOT EXISTS (
        SELECT 1
        FROM bookrecords br
        WHERE br.sheet = pc.sheet
          AND br.side = pc.side
          AND br.companies_id = ${authenticate.companies_id}
        AND br.typebooks_id =  ${typebooks_id}
        and br.book = ${book}
      );`;
        const result = await Database_1.default.rawQuery(query);
        const data = result[0] || [];
        const values = data.map(row => `${row.sheet}${row.side}`);
        const valuesString = values.join(', ');
        return response.status(200).send(valuesString);
    }
    async updatedFiles({ auth, request, response }) {
        const { datestart, dateend, companies_id, bookstart, bookend, sheetstart, sheetend, side, typebooks_id } = request.only(['datestart', 'dateend', 'companies_id', 'bookstart', 'bookend', 'sheetstart', 'sheetend', 'typebooks_id', 'side']);
        let query = '1=1';
        if (companies_id == undefined || companies_id == null) {
            throw new BadRequestException_1.default('Bad Request', 401, "Sem empresa Selecionada");
        }
        if (typebooks_id)
            query += ` and bookrecords.typebooks_id=${typebooks_id}`;
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
        try {
            const payLoad = await Database_1.default.from('bookrecords')
                .innerJoin('indeximages', (queryImages) => {
                queryImages.on('indeximages.bookrecords_id', 'bookrecords.id')
                    .andOn('indeximages.typebooks_id', 'bookrecords.typebooks_id')
                    .andOn('indeximages.companies_id', 'bookrecords.companies_id');
            })
                .select('bookrecords.*')
                .select('indeximages.file_name', 'indeximages.date_atualization')
                .whereBetween('indeximages.date_atualization', [datestart, dateend])
                .andWhere('bookrecords.companies_id', companies_id)
                .whereRaw(query);
            return response.status(200).send(payLoad);
        }
        catch (error) {
            return error;
        }
    }
    async generateOrUpdateBookrecordsDocument({ auth, request, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        let { startCod, endCod, year, month, box } = request.requestData;
        let bookRecord = {};
        let document = {};
        let cod = startCod;
        if (year == -1)
            document.yeardoc = null;
        else if (year)
            document.yeardoc = year;
        if (month == -1)
            document.month = null;
        else if (month)
            document.month = month;
        if (startCod > endCod)
            throw new BadRequestException_1.default("erro: codigo inicial maior que o final");
        while (startCod <= endCod) {
            try {
                bookRecord = {
                    cod: startCod,
                    typebooks_id: params.typebooks_id,
                    books_id: 13,
                    book: box,
                    companies_id: authenticate.companies_id
                };
                const verifyBookRecord = await Bookrecord_1.default.query()
                    .where('cod', bookRecord.cod)
                    .andWhere('companies_id', authenticate.companies_id)
                    .andWhere('typebooks_id', bookRecord.typebooks_id)
                    .andWhere('books_id', 13)
                    .andWhere('book', bookRecord.book).first();
                if (verifyBookRecord) {
                    const bookRecordId = await Bookrecord_1.default.query()
                        .where('id', verifyBookRecord.id)
                        .andWhere('typebooks_id', verifyBookRecord.typebooks_id)
                        .andWhere('companies_id', verifyBookRecord.companies_id)
                        .andWhere('books_id', 13)
                        .update(bookRecord);
                    document.bookrecords_id = verifyBookRecord.id;
                    const documentUpdate = await Document_1.default.query()
                        .where('bookrecords_id', verifyBookRecord.id)
                        .andWhere('typebooks_id', verifyBookRecord.typebooks_id)
                        .andWhere('companies_id', verifyBookRecord.companies_id)
                        .andWhere('books_id', 13)
                        .update(document);
                }
                else {
                    const bookRecordId = await Bookrecord_1.default.create(bookRecord);
                    document.bookrecords_id = bookRecordId.id;
                    await Document_1.default.create(document);
                }
                startCod++;
            }
            catch (error) {
                throw new BadRequestException_1.default("Bad Request", 402, error);
            }
        }
        let successValidation = await new validations_1.default('bookrecord_success_100');
        return response.status(201).send(successValidation.code);
    }
    async maxBookRecord({ auth, params, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const maxBook = await Bookrecord_1.default.query()
            .where('typebooks_id', params.typebooks_id)
            .andWhere('companies_id', authenticate.companies_id)
            .max('book as max_book')
            .first();
        let maxSheet;
        if (maxBook) {
            maxSheet = await Bookrecord_1.default.query()
                .where('typebooks_id', params.typebooks_id)
                .andWhere('companies_id', authenticate.companies_id)
                .andWhere('book', maxBook?.$extras.max_book)
                .max('sheet as max_sheet')
                .first();
        }
        return response.status(200).send({ max_book: maxBook?.$extras.max_book, max_sheet: maxSheet.$extras.max_sheet });
    }
}
exports.default = BookrecordsController;
//# sourceMappingURL=BookrecordsController.js.map