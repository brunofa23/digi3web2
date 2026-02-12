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
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
const BookrecordValidator_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Validators/BookrecordValidator"));
const luxon_1 = require("luxon");
const fileRename = require('../../Services/fileRename/fileRename');
class BookrecordsController {
    async index({ auth, request, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const { codstart, codend, bookstart, bookend, approximateterm, indexbook, indexbookend, year, letter, sheetstart, sheetend, side, obs, sheetzero, noAttachment, lastPagesOfEachBook, codmax, document, month, yeardoc, prot, documenttype_id, free, averb_anot, book_name, book_number, sheet_number, created_atstart, created_atend, document_type_book_id, obs_document, fin_entity_List } = request.qs();
        let query = " 1=1 ";
        if (!codstart && !codend && !approximateterm && !year && !indexbook && !letter && !bookstart && !bookend && !sheetstart && !sheetend && !side && (!sheetzero || sheetzero == 'false') &&
            (lastPagesOfEachBook == 'false' || !lastPagesOfEachBook) && noAttachment == 'false' && !obs)
            return null;
        if (lastPagesOfEachBook) {
            query += ` and sheet in (select max(sheet) from bookrecords bookrecords1 where (bookrecords1.book = bookrecords.book) and (bookrecords1.typebooks_id=bookrecords.typebooks_id)) `;
        }
        const page = request.input('page', 1);
        const limit = Env_1.default.get('PAGINATION');
        let data;
        let queryExecute;
        if (noAttachment) {
            queryExecute = Bookrecord_1.default.query()
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
                .orderBy("sheet", "asc");
        }
        else if (codmax) {
            data = await Database_1.default.from('bookrecords')
                .where('companies_id', authenticate.companies_id)
                .where('typebooks_id', params.typebooks_id)
                .max('cod as codmax');
            return response.status(200).send(data);
        }
        else {
            queryExecute = Bookrecord_1.default.query()
                .where("bookrecords.companies_id", authenticate.companies_id)
                .if(params.typebooks_id > 0, query => {
                query.andWhere("bookrecords.typebooks_id", params.typebooks_id);
            })
                .preload('indeximage', (queryIndex) => {
                queryIndex.where("companies_id", '=', authenticate.companies_id);
            })
                .preload('document', query => {
                query.preload('documenttype', query => {
                    query.select('name');
                })
                    .preload('documenttypebook', query => {
                    query.select('description');
                })
                    .preload('entity', query => {
                    query.select('description');
                });
            });
            if (params.typebooks_id == 0)
                queryExecute.preload('typebooks', query => {
                    query.where('companies_id', authenticate.companies_id);
                    query.select('name');
                })
                    .whereRaw(query)
                    .orderBy("book", "asc")
                    .orderBy("cod", "asc")
                    .orderBy("sheet", "asc");
        }
        if (codstart != undefined && codend == undefined)
            queryExecute.where('cod', codstart);
        else if (codstart != undefined && codend != undefined)
            queryExecute.where('cod', '>=', codstart);
        if (codend != undefined)
            queryExecute.where('cod', '<=', codend);
        if (bookstart != undefined && bookend == undefined)
            queryExecute.where('book', bookstart);
        else if (bookstart != undefined && bookend != undefined)
            queryExecute.where('book', '>=', bookstart);
        if (bookend != undefined)
            queryExecute.where('book', '<=', bookend);
        if (book_number && document != 'true')
            queryExecute.where('book', book_number);
        if (sheetstart != undefined && sheetend == undefined)
            queryExecute.where('sheet', sheetstart);
        else if (sheetstart != undefined && sheetend != undefined)
            queryExecute.where('sheet', '>=', sheetstart);
        if (sheetend != undefined)
            queryExecute.where('sheet', '<=', sheetend);
        if (sheet_number && document != 'true')
            queryExecute.where('sheet', sheet_number);
        if (side != undefined)
            queryExecute.where('side', side);
        if (approximateterm != undefined)
            queryExecute.where('approximate_term', approximateterm);
        if (obs != undefined)
            queryExecute.where('obs', obs);
        const hasStart = indexbook !== undefined && indexbook !== null && indexbook !== '';
        const hasEnd = indexbookend !== undefined && indexbookend !== null && indexbookend !== '';
        if (indexbook == 0)
            queryExecute.andWhereNull('indexbook');
        else if (hasStart && !hasEnd) {
            queryExecute.where('indexbook', indexbook);
        }
        else if (hasStart && hasEnd) {
            queryExecute.whereBetween('indexbook', [indexbook, indexbookend]);
        }
        if (year != undefined)
            queryExecute.where('year', year);
        if (letter != undefined)
            queryExecute.where('letter', letter);
        if (document != 'true')
            if (!sheetzero || (sheetzero == 'false'))
                queryExecute.where('sheet', '>', 0);
        if (document == 'true') {
            if (params.typebooks_id == 0)
                queryExecute.preload('typebooks', query => {
                    query.select('name');
                });
            queryExecute.whereHas('document', query => {
                if (created_atstart != undefined) {
                    query.where('created_at', '>=', created_atstart);
                }
                if (created_atend != undefined) {
                    query.where('created_at', '<=', luxon_1.DateTime.fromISO(created_atend).plus({ days: 1 }).toFormat("yyyy-MM-dd"));
                }
                if (prot != undefined)
                    query.where('documents.prot', prot);
                if (documenttype_id != undefined)
                    query.where('documenttype_id', documenttype_id);
                if (document_type_book_id != undefined)
                    query.where('document_type_book_id', document_type_book_id);
                if (free == 'true') {
                    query.where('free', 1);
                }
                if (averb_anot == 'true') {
                    query.where('averb_anot', 1);
                }
                if (book_name != undefined)
                    query.where('book_name', book_name);
                if (book_number != undefined)
                    query.where('book_number', book_number);
                if (sheet_number != undefined)
                    query.where('sheet_number', sheet_number);
                if (month != undefined)
                    query.where('month', month);
                if (yeardoc != undefined)
                    query.where('yeardoc', yeardoc);
                if (obs_document != undefined)
                    query.where('obs', 'like', `%${obs_document}%`);
                query.if(fin_entity_List, q => {
                    const ids = String(fin_entity_List)
                        .split(',')
                        .map((id) => Number(id.trim()))
                        .filter((id) => !isNaN(id));
                    if (ids.length > 1) {
                        q.whereIn('fin_entities_id', ids);
                    }
                    else if (ids.length === 1) {
                        q.where('fin_entities_id', ids[0]);
                    }
                });
            });
        }
        data = await queryExecute.paginate(page, limit);
        return response.status(200).send(data);
    }
    async fastFind({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const { book, sheet, typebook } = request.only(['book', 'sheet', 'typebook']);
        if (!book || !sheet)
            return;
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
    async fastFindDocuments({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const { prot, dateStart, dateEnd, book_number, book_name, sheet_number, obs } = request.only(['prot', 'dateStart', 'dateEnd', 'book_number', 'book_name', 'sheet_number', 'avert_anot', 'typebook', 'obs']);
        const query = Bookrecord_1.default.query()
            .select('bookrecords.*')
            .innerJoin('documents', (join) => {
            join.on('bookrecords.id', 'documents.bookrecords_id')
                .andOn('bookrecords.companies_id', 'documents.companies_id');
        })
            .where("bookrecords.companies_id", authenticate.companies_id)
            .leftOuterJoin('indeximages', (join) => {
            join.on('bookrecords.id', 'indeximages.bookrecords_id')
                .andOn('bookrecords.companies_id', 'indeximages.companies_id')
                .andOn('bookrecords.typebooks_id', 'indeximages.typebooks_id');
        })
            .preload('document')
            .preload('indeximage')
            .preload('typebooks', (subQuery) => {
            subQuery.select('typebooks.name');
            subQuery.where('companies_id', authenticate.companies_id);
        });
        if (prot)
            query.where('documents.prot', '=', prot);
        if (dateStart)
            query.where('documents.created_at', '>=', dateStart);
        if (dateEnd)
            query.where('documents.created_at', '<=', dateEnd);
        if (prot)
            query.where('documents.prot', prot);
        if (book_number)
            query.where('documents.book_number', book_number);
        if (sheet_number)
            query.where('documents.sheet_number', sheet_number);
        if (book_name)
            query.where('documents.book_name', book_name);
        if (obs)
            query.where('documents.obs', 'like', `%${obs}%`);
        query.groupBy('bookrecords.id', 'bookrecords.typebooks_id', 'bookrecords.books_id', 'bookrecords.companies_id', 'bookrecords.cod', 'bookrecords.book', 'bookrecords.sheet', 'bookrecords.side', 'bookrecords.approximate_term', 'bookrecords.indexbook', 'bookrecords.letter', 'bookrecords.year', 'bookrecords.model');
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
    async store({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const body = await request.validate(BookrecordValidator_1.default);
        const { document } = request.only(['document']);
        try {
            body.companies_id = authenticate.companies_id;
            body.userid = authenticate.id;
            const bookrecord = await Bookrecord_1.default.create(body);
            let createdDocument = null;
            if (bookrecord.books_id === 13 && document) {
                const cleanDocument = { ...document };
                delete cleanDocument.documenttype;
                delete cleanDocument.documenttypebook;
                cleanDocument.bookrecords_id = bookrecord.id;
                cleanDocument.typebooks_id = bookrecord.typebooks_id;
                cleanDocument.books_id = bookrecord.books_id;
                cleanDocument.companies_id = bookrecord.companies_id;
                createdDocument = await Document_1.default.create(cleanDocument);
            }
            await bookrecord.load((loader) => {
                loader
                    .preload('document', (documentQuery) => {
                    documentQuery
                        .preload('documenttype')
                        .preload('documenttypebook');
                });
            });
            await fileRename.updateFileName(bookrecord);
            return response.status(201).send({
                success: true,
                message: 'Registro criado com sucesso',
                bookrecord,
                document: createdDocument,
            });
        }
        catch (error) {
            console.error('Erro ao criar registro:', error);
            throw new BadRequestException_1.default('Erro ao criar registro', 400, error);
        }
    }
    async update({ auth, request, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const { document } = request.only(['document']);
        const body = request.only(Bookrecord_1.default.fillable);
        try {
            const bookrecord = await Bookrecord_1.default.query()
                .where('id', params.id)
                .andWhere('typebooks_id', body.typebooks_id)
                .andWhere('companies_id', authenticate.companies_id)
                .firstOrFail();
            bookrecord.merge({
                ...body,
                companies_id: authenticate.companies_id,
                userid: authenticate.id,
            });
            await bookrecord.save();
            let updatedDocument = null;
            if (bookrecord.books_id === 13 && document && document.id) {
                const doc = await Document_1.default.query()
                    .where('id', document.id)
                    .andWhere('typebooks_id', bookrecord.typebooks_id)
                    .andWhere('companies_id', authenticate.companies_id)
                    .first();
                if (doc) {
                    const cleanDocument = { ...document };
                    delete cleanDocument.documenttype;
                    delete cleanDocument.documenttypebook;
                    doc.merge(cleanDocument);
                    await doc.save();
                    updatedDocument = doc;
                }
            }
            await bookrecord.load((loader) => {
                loader
                    .preload('document', (documentQuery) => {
                    documentQuery
                        .preload('documenttype')
                        .preload('documenttypebook');
                });
            });
            await fileRename.updateFileName(bookrecord);
            return response.status(200).send({
                success: true,
                message: 'Registro atualizado com sucesso',
                bookrecord,
                document: updatedDocument,
            });
        }
        catch (error) {
            console.error('Erro ao atualizar registro:', error);
            throw new BadRequestException_1.default('Erro ao atualizar registro', 400, error);
        }
    }
    async destroy({ auth, params, response }) {
        const { companies_id } = await auth.use('api').authenticate();
        try {
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
        console.log("passei aqui........111111");
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
    async generateOrUpdateBookrecords2({ auth, params, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const rawIndexbook = request.input('indexbook');
        const indexbookWasSent = rawIndexbook !== undefined;
        const forceIndexbookNull = indexbookWasSent && (rawIndexbook === 0 || rawIndexbook === '0');
        const body = await request.validate({
            schema: Validator_1.schema.create({
                renumerate_cod: Validator_1.schema.boolean.optional(),
                is_create: Validator_1.schema.boolean.optional(),
                by_sheet: Validator_1.schema.string.optional(),
                start_cod: Validator_1.schema.number(),
                end_cod: Validator_1.schema.number(),
                book: Validator_1.schema.number.optional(),
                book_replace: Validator_1.schema.number.optional(),
                sheet: Validator_1.schema.number.optional(),
                side: Validator_1.schema.string.optional(),
                model_book: Validator_1.schema.string.optional(),
                books_id: Validator_1.schema.number(),
                indexbook: Validator_1.schema.number.optional(),
                year: Validator_1.schema.number.optional(),
                approximate_term: Validator_1.schema.number.optional(),
                obs: Validator_1.schema.string.optional(),
            }),
        });
        if (body.start_cod > body.end_cod) {
            throw new BadRequestException_1.default("erro: codigo inicial maior que o final");
        }
        if (body.book_replace && body.book_replace > 0) {
            const updatedCount = await Bookrecord_1.default.query()
                .where("companies_id", authenticate.companies_id)
                .andWhere("typebooks_id", params.typebooks_id)
                .where("books_id", body.books_id)
                .andWhere("book", body.book)
                .update({ book: body.book_replace });
            return response.status(200).send({
                message: `Bookrecords atualizados para ${body.book_replace}!`,
                updatedCount,
            });
        }
        const shouldApplyModel = (body.sheet !== undefined || body.side !== undefined || body.model_book !== undefined);
        const shouldRenumerate = !!body.renumerate_cod && shouldApplyModel;
        const zeroToNull = (v) => (v === 0 || v === "0" ? null : v);
        const bodyIndexbook = forceIndexbookNull ? null : body.indexbook;
        const bodyYear = zeroToNull(body.year);
        const bodyApprox = zeroToNull(body.approximate_term);
        const bodyObs = zeroToNull(body.obs);
        const getGeneratedId = (baseRecord) => (body.is_create ? undefined : baseRecord?.id);
        function modelBookNext(model_book, side, sheet) {
            if (!model_book)
                return { side, sheet: (sheet ?? 0) + 1 };
            switch (model_book) {
                case "C": return { side: null, sheet: 0 };
                case "F": return { side: "F", sheet: (sheet ?? 0) + 1 };
                case "V": return { side: "V", sheet: (sheet ?? 0) + 1 };
                case "FV": return { side: side === "F" ? "V" : "F", sheet: (sheet ?? 0) + 1 };
                case "FVFV":
                    if (side === "F")
                        return { side: "V", sheet };
                    return { side: "F", sheet: (sheet ?? 0) + 1 };
                case "F-IMPAR": return { side: "F", sheet: (sheet ?? 0) + 2 };
                case "V-PAR": return { side: "V", sheet: (sheet ?? 0) + 2 };
                default: return { side, sheet: (sheet ?? 0) + 1 };
            }
        }
        try {
            const query = Bookrecord_1.default.query()
                .andWhere("companies_id", authenticate.companies_id)
                .andWhere("typebooks_id", params.typebooks_id)
                .where("books_id", body.books_id)
                .andWhere("book", body.book);
            if (body.by_sheet == "S") {
                query.andWhere("sheet", ">=", body.start_cod).andWhere("sheet", "<=", body.end_cod);
            }
            else {
                query.andWhere("cod", ">=", body.start_cod).andWhere("cod", "<=", body.end_cod);
            }
            const result = await query;
            if (body.renumerate_cod) {
                const sideRank = (s) => (s === "F" ? 0 : s === "V" ? 1 : 2);
                const ordered = (result ?? []).slice().sort((a, b) => {
                    if (body.by_sheet == "S") {
                        const as = a?.sheet ?? 0;
                        const bs = b?.sheet ?? 0;
                        if (as !== bs)
                            return as - bs;
                        const sa = sideRank(a?.side);
                        const sb = sideRank(b?.side);
                        if (sa !== sb)
                            return sa - sb;
                        return (a?.id ?? 0) - (b?.id ?? 0);
                    }
                    else {
                        const ac = a?.cod ?? 0;
                        const bc = b?.cod ?? 0;
                        if (ac !== bc)
                            return ac - bc;
                        return (a?.id ?? 0) - (b?.id ?? 0);
                    }
                });
                let newCod = (body.sheet ?? body.start_cod);
                const trx = await Database_1.default.transaction();
                try {
                    for (const rec of ordered) {
                        const updatePayload = { cod: newCod++ };
                        if (indexbookWasSent) {
                            updatePayload.indexbook = forceIndexbookNull ? null : bodyIndexbook;
                        }
                        await Bookrecord_1.default.query({ client: trx })
                            .where("id", rec.id)
                            .update(updatePayload);
                    }
                    await trx.commit();
                    return response.status(200).send({
                        message: "Cod renumerado com sucesso (sem alterar outros campos).",
                        updatedCount: ordered.length,
                        start_from: body.sheet ?? body.start_cod,
                        last_cod: newCod - 1,
                    });
                }
                catch (err) {
                    await trx.rollback();
                    throw err;
                }
            }
            function overwriteIfValid(bodyValue, dbValue) {
                return bodyValue !== undefined && bodyValue !== null && bodyValue !== "" ? bodyValue : dbValue;
            }
            const generatedArray = [];
            let sequenceSheet = body.sheet ?? body.start_cod;
            const defaultSideForModel = (() => {
                switch (body.model_book) {
                    case "F":
                    case "F-IMPAR": return "F";
                    case "V":
                    case "V-PAR": return "V";
                    case "FV":
                    case "FVFV": return "F";
                    default: return body.side ?? null;
                }
            })();
            let sequenceSide = body.side ?? defaultSideForModel;
            const sortRecords = (arr) => (arr ?? []).slice().sort((a, b) => {
                const as = a?.sheet ?? 0;
                const bs = b?.sheet ?? 0;
                if (as !== bs)
                    return as - bs;
                return (a?.id ?? 0) - (b?.id ?? 0);
            });
            if (body.by_sheet == "S") {
                if (body.is_create) {
                    for (let sheetNum = body.start_cod; sheetNum <= body.end_cod; sheetNum++) {
                        let recordsForSheet = result.filter((r) => r.sheet === sheetNum);
                        recordsForSheet = sortRecords(recordsForSheet);
                        const minSlots = body.model_book === "FVFV" ? 2 : 1;
                        const slotsToProcess = Math.max(recordsForSheet.length, minSlots);
                        for (let slot = 0; slot < slotsToProcess; slot++) {
                            const baseRecord = recordsForSheet[slot] ?? null;
                            if (!shouldApplyModel) {
                                const assignedSide = baseRecord?.side ?? null;
                                const assignedSheetOut = baseRecord?.sheet ?? sheetNum;
                                generatedArray.push({
                                    id: getGeneratedId(baseRecord),
                                    typebooks_id: params.typebooks_id,
                                    books_id: baseRecord?.books_id ?? body.books_id,
                                    companies_id: authenticate.companies_id,
                                    cod: baseRecord?.cod ?? sheetNum,
                                    book: baseRecord?.book ?? body.book,
                                    sheet: assignedSheetOut,
                                    side: assignedSide,
                                    approximate_term: overwriteIfValid(bodyApprox, baseRecord?.approximate_term),
                                    indexbook: overwriteIfValid(bodyIndexbook, baseRecord?.indexbook),
                                    year: overwriteIfValid(bodyYear, baseRecord?.year),
                                    obs: overwriteIfValid(bodyObs, baseRecord?.obs),
                                });
                            }
                            else {
                                const assignedSide = sequenceSide ?? defaultSideForModel;
                                const assignedSheetOut = sequenceSheet;
                                generatedArray.push({
                                    id: getGeneratedId(baseRecord),
                                    typebooks_id: params.typebooks_id,
                                    books_id: baseRecord?.books_id ?? body.books_id,
                                    companies_id: authenticate.companies_id,
                                    cod: baseRecord?.cod ?? sheetNum,
                                    book: baseRecord?.book ?? body.book,
                                    sheet: assignedSheetOut,
                                    side: assignedSide,
                                    approximate_term: overwriteIfValid(bodyApprox, baseRecord?.approximate_term),
                                    indexbook: overwriteIfValid(bodyIndexbook, baseRecord?.indexbook),
                                    year: overwriteIfValid(bodyYear, baseRecord?.year),
                                    obs: overwriteIfValid(bodyObs, baseRecord?.obs),
                                });
                                const next = modelBookNext(body.model_book, sequenceSide, sequenceSheet);
                                sequenceSide = next.side;
                                sequenceSheet = next.sheet ?? sequenceSheet;
                            }
                        }
                    }
                }
                else {
                    const distinctSheets = Array.from(new Set(result.map((r) => r.sheet)))
                        .filter((s) => s !== undefined && s !== null)
                        .sort((a, b) => a - b);
                    for (const sheetVal of distinctSheets) {
                        let recordsForSheet = result.filter((r) => r.sheet === sheetVal);
                        recordsForSheet = sortRecords(recordsForSheet);
                        for (const baseRecord of recordsForSheet) {
                            if (!shouldApplyModel) {
                                const assignedSide = baseRecord?.side ?? null;
                                const assignedSheetOut = baseRecord?.sheet ?? sheetVal;
                                generatedArray.push({
                                    id: getGeneratedId(baseRecord),
                                    typebooks_id: params.typebooks_id,
                                    books_id: baseRecord?.books_id ?? body.books_id,
                                    companies_id: authenticate.companies_id,
                                    cod: baseRecord?.cod ?? sheetVal,
                                    book: baseRecord?.book ?? body.book,
                                    sheet: assignedSheetOut,
                                    side: assignedSide,
                                    approximate_term: overwriteIfValid(bodyApprox, baseRecord?.approximate_term),
                                    indexbook: overwriteIfValid(bodyIndexbook, baseRecord?.indexbook),
                                    year: overwriteIfValid(bodyYear, baseRecord?.year),
                                    obs: overwriteIfValid(bodyObs, baseRecord?.obs),
                                });
                            }
                            else {
                                const assignedSide = sequenceSide ?? defaultSideForModel;
                                const assignedSheetOut = sequenceSheet;
                                generatedArray.push({
                                    id: getGeneratedId(baseRecord),
                                    typebooks_id: params.typebooks_id,
                                    books_id: baseRecord?.books_id ?? body.books_id,
                                    companies_id: authenticate.companies_id,
                                    cod: baseRecord?.cod ?? sheetVal,
                                    book: baseRecord?.book ?? body.book,
                                    sheet: assignedSheetOut,
                                    side: assignedSide,
                                    approximate_term: overwriteIfValid(bodyApprox, baseRecord?.approximate_term),
                                    indexbook: overwriteIfValid(bodyIndexbook, baseRecord?.indexbook),
                                    year: overwriteIfValid(bodyYear, baseRecord?.year),
                                    obs: overwriteIfValid(bodyObs, baseRecord?.obs),
                                });
                                const next = modelBookNext(body.model_book, sequenceSide, sequenceSheet);
                                sequenceSide = next.side;
                                sequenceSheet = next.sheet ?? sequenceSheet;
                            }
                        }
                    }
                }
            }
            else {
                if (body.is_create) {
                    for (let cod = body.start_cod; cod <= body.end_cod; cod++) {
                        let recordsForCod = result.filter((r) => r.cod === cod);
                        recordsForCod = sortRecords(recordsForCod);
                        const slotsToProcess = Math.max(recordsForCod.length, 1);
                        for (let slot = 0; slot < slotsToProcess; slot++) {
                            const baseRecord = recordsForCod[slot] ?? null;
                            if (!shouldApplyModel) {
                                const assignedSide = baseRecord?.side ?? null;
                                const assignedSheetOut = baseRecord?.sheet ?? sequenceSheet;
                                generatedArray.push({
                                    id: getGeneratedId(baseRecord),
                                    typebooks_id: params.typebooks_id,
                                    books_id: baseRecord?.books_id ?? body.books_id,
                                    companies_id: authenticate.companies_id,
                                    cod: cod,
                                    book: baseRecord?.book ?? body.book,
                                    sheet: assignedSheetOut,
                                    side: assignedSide,
                                    approximate_term: overwriteIfValid(bodyApprox, baseRecord?.approximate_term),
                                    indexbook: overwriteIfValid(bodyIndexbook, baseRecord?.indexbook),
                                    year: overwriteIfValid(bodyYear, baseRecord?.year),
                                    obs: overwriteIfValid(bodyObs, baseRecord?.obs),
                                });
                            }
                            else {
                                const assignedSide = sequenceSide ?? defaultSideForModel;
                                const assignedSheetOut = sequenceSheet;
                                generatedArray.push({
                                    id: getGeneratedId(baseRecord),
                                    typebooks_id: params.typebooks_id,
                                    books_id: baseRecord?.books_id ?? body.books_id,
                                    companies_id: authenticate.companies_id,
                                    cod: cod,
                                    book: baseRecord?.book ?? body.book,
                                    sheet: assignedSheetOut,
                                    side: assignedSide,
                                    approximate_term: overwriteIfValid(bodyApprox, baseRecord?.approximate_term),
                                    indexbook: overwriteIfValid(bodyIndexbook, baseRecord?.indexbook),
                                    year: overwriteIfValid(bodyYear, baseRecord?.year),
                                    obs: overwriteIfValid(bodyObs, baseRecord?.obs),
                                });
                                const next = modelBookNext(body.model_book, sequenceSide, sequenceSheet);
                                sequenceSide = next.side;
                                sequenceSheet = next.sheet ?? sequenceSheet;
                            }
                        }
                    }
                }
                else {
                    const distinctCods = Array.from(new Set(result.map((r) => r.cod)))
                        .filter((c) => c !== undefined && c !== null)
                        .sort((a, b) => a - b);
                    for (const codVal of distinctCods) {
                        let recordsForCod = result.filter((r) => r.cod === codVal);
                        recordsForCod = sortRecords(recordsForCod);
                        for (const baseRecord of recordsForCod) {
                            if (!shouldApplyModel) {
                                const assignedSide = baseRecord?.side ?? null;
                                const assignedSheetOut = baseRecord?.sheet ?? sequenceSheet;
                                generatedArray.push({
                                    id: getGeneratedId(baseRecord),
                                    typebooks_id: params.typebooks_id,
                                    books_id: baseRecord?.books_id ?? body.books_id,
                                    companies_id: authenticate.companies_id,
                                    cod: codVal,
                                    book: baseRecord?.book ?? body.book,
                                    sheet: assignedSheetOut,
                                    side: assignedSide,
                                    approximate_term: overwriteIfValid(bodyApprox, baseRecord?.approximate_term),
                                    indexbook: overwriteIfValid(bodyIndexbook, baseRecord?.indexbook),
                                    year: overwriteIfValid(bodyYear, baseRecord?.year),
                                    obs: overwriteIfValid(bodyObs, baseRecord?.obs),
                                });
                            }
                            else {
                                const assignedSide = sequenceSide ?? defaultSideForModel;
                                const assignedSheetOut = sequenceSheet;
                                generatedArray.push({
                                    id: getGeneratedId(baseRecord),
                                    typebooks_id: params.typebooks_id,
                                    books_id: baseRecord?.books_id ?? body.books_id,
                                    companies_id: authenticate.companies_id,
                                    cod: codVal,
                                    book: baseRecord?.book ?? body.book,
                                    sheet: assignedSheetOut,
                                    side: assignedSide,
                                    approximate_term: overwriteIfValid(bodyApprox, baseRecord?.approximate_term),
                                    indexbook: overwriteIfValid(bodyIndexbook, baseRecord?.indexbook),
                                    year: overwriteIfValid(bodyYear, baseRecord?.year),
                                    obs: overwriteIfValid(bodyObs, baseRecord?.obs),
                                });
                                const next = modelBookNext(body.model_book, sequenceSide, sequenceSheet);
                                sequenceSide = next.side;
                                sequenceSheet = next.sheet ?? sequenceSheet;
                            }
                        }
                    }
                }
            }
            if (shouldRenumerate) {
                let newCod = body.sheet ?? body.start_cod;
                const sideRank = (s) => (s === "F" ? 0 : s === "V" ? 1 : 2);
                generatedArray.sort((a, b) => {
                    if (a.sheet !== b.sheet)
                        return a.sheet - b.sheet;
                    const sa = sideRank(a.side);
                    const sb = sideRank(b.side);
                    if (sa !== sb)
                        return sa - sb;
                    return (a.id ?? 0) - (b.id ?? 0);
                });
                for (const rec of generatedArray) {
                    rec.cod = newCod++;
                }
            }
            if (body.approximate_term !== undefined) {
                let newApprox = bodyApprox ?? null;
                if (newApprox !== null) {
                    for (const rec of generatedArray) {
                        rec.approximate_term = newApprox++;
                    }
                }
                else {
                    for (const rec of generatedArray) {
                        rec.approximate_term = null;
                    }
                }
            }
            const trx = await Database_1.default.transaction();
            try {
                for (const record of generatedArray) {
                    if (record.id) {
                        const updateData = {};
                        if (shouldApplyModel) {
                            updateData.sheet = record.sheet;
                            updateData.side = record.side;
                        }
                        if (shouldRenumerate) {
                            updateData.cod = record.cod;
                        }
                        if (body.approximate_term !== undefined)
                            updateData.approximate_term = bodyApprox;
                        if (indexbookWasSent) {
                            updateData.indexbook = forceIndexbookNull ? null : bodyIndexbook;
                        }
                        if (body.year !== undefined)
                            updateData.year = bodyYear;
                        if (body.obs !== undefined)
                            updateData.obs = bodyObs;
                        const finalUpdateData = Object.fromEntries(Object.entries(updateData).filter(([_, v]) => v !== undefined && v !== ""));
                        if (Object.keys(finalUpdateData).length > 0) {
                            await Bookrecord_1.default.query({ client: trx })
                                .where("id", record.id)
                                .update(finalUpdateData);
                        }
                    }
                    else if (body.is_create) {
                        const createPayload = {
                            typebooks_id: params.typebooks_id,
                            books_id: record.books_id,
                            companies_id: authenticate.companies_id,
                            cod: record.cod,
                            book: record.book,
                            sheet: record.sheet,
                            side: record.side,
                        };
                        if (body.approximate_term !== undefined)
                            createPayload.approximate_term = bodyApprox;
                        if (indexbookWasSent) {
                            createPayload.indexbook = forceIndexbookNull ? null : bodyIndexbook;
                        }
                        if (body.year !== undefined)
                            createPayload.year = bodyYear;
                        if (body.obs !== undefined)
                            createPayload.obs = bodyObs;
                        await Bookrecord_1.default.create(createPayload, { client: trx });
                    }
                }
                await trx.commit();
            }
            catch (err) {
                await trx.rollback();
                throw err;
            }
            return response.status(200).send({
                message: "Bookrecords atualizados/criados com sucesso!",
                data: generatedArray,
            });
        }
        catch (error) {
            console.error(error);
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
    async bookSummary({ auth, params, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const typebooks_id = Number(params.typebooks_id);
        const qs = request.qs();
        const book = Number(qs.book || 0);
        const bookStart = Number(qs.bookStart || 0);
        const bookEnd = Number(qs.bookEnd || 0);
        const countSheetNotExists = qs.countSheetNotExists;
        const indexBook = qs.indexBook !== undefined && qs.indexBook !== null && qs.indexBook !== ''
            ? Number(qs.indexBook)
            : undefined;
        try {
            const query = Database_1.default
                .from('bookrecords')
                .select('book', 'indexbook', 'year')
                .min('cod as initialCod')
                .max('cod as finalCod')
                .min('sheet as initialSheet')
                .max('sheet as finalSheet')
                .count('* as totalRows')
                .select(Database_1.default.raw(`
          (
            SELECT CONCAT(CAST(bkr.sheet AS CHAR), bkr.side)
            FROM bookrecords bkr
            WHERE bkr.companies_id = bookrecords.companies_id
              AND bkr.typebooks_id = bookrecords.typebooks_id
              AND bkr.book = bookrecords.book
              AND bkr.year = bookrecords.year
              AND bkr.side = 'V'
              AND bkr.sheet = 1
              AND (IFNULL(bkr.indexbook, 999999) = IFNULL(bookrecords.indexbook, 999999))
            LIMIT 1
          ) as sheetInicial
        `))
                .select(Database_1.default.raw(`
          (
            SELECT COUNT(*)
            FROM indeximages
            INNER JOIN bookrecords bkr ON
              indeximages.bookrecords_id = bkr.id
              AND indeximages.companies_id = bkr.companies_id
              AND indeximages.typebooks_id = bkr.typebooks_id
            WHERE bkr.companies_id = bookrecords.companies_id
              AND bkr.typebooks_id = bookrecords.typebooks_id
              AND bkr.book = bookrecords.book
              AND bkr.year = bookrecords.year
              AND (IFNULL(bkr.indexbook,999999) = IFNULL(bookrecords.indexbook,999999))
              AND indeximages.companies_id = ${authenticate.companies_id}
              AND indeximages.typebooks_id = ${typebooks_id}
          ) as totalFiles
        `))
                .where('companies_id', authenticate.companies_id)
                .andWhere('typebooks_id', typebooks_id);
            if (book > 0) {
                query.andWhere('book', book);
            }
            else if (bookStart > 0 || bookEnd > 0) {
                if (bookStart > 0)
                    query.andWhere('book', '>=', bookStart);
                if (bookEnd > 0)
                    query.andWhere('book', '<=', bookEnd);
            }
            if (typeof indexBook === 'number' && indexBook > 0)
                query.andWhere('indexbook', indexBook);
            else if (indexBook === 0)
                query.andWhereNull('indexbook');
            query.groupBy('book', 'indexbook', 'year');
            query.orderBy('bookrecords.book');
            const bookSummaryPayload = await query;
            async function verifySide(bookNum, indexbookGroup, yearGroup) {
                const generateSequence = (start, end) => Array.from({ length: end - start + 1 }, (_, i) => start + i);
                const findMissingItems = (completeList, currentList, keyFn) => {
                    const currentSet = new Set(currentList.map(keyFn));
                    return completeList.filter(item => !currentSet.has(keyFn(item)));
                };
                const sheetWithSideQuery = Bookrecord_1.default.query()
                    .where('companies_id', authenticate.companies_id)
                    .andWhere('typebooks_id', typebooks_id)
                    .andWhere('book', bookNum);
                if (indexbookGroup === null)
                    sheetWithSideQuery.andWhereNull('indexbook');
                else
                    sheetWithSideQuery.andWhere('indexbook', indexbookGroup);
                if (yearGroup === null) {
                    sheetWithSideQuery.whereNull('year');
                }
                else {
                    sheetWithSideQuery.andWhere('year', yearGroup);
                }
                const sheetWithSide = await sheetWithSideQuery;
                const sheetCount = sheetWithSide.map(item => ({ sheet: item.sheet, side: item.side }));
                const maxSheet = Math.max(0, ...sheetCount.map(item => item.sheet));
                if (!maxSheet)
                    return '';
                if (countSheetNotExists === 'P') {
                    const completeSheetList = generateSequence(1, maxSheet);
                    const currentSheetSet = new Set(sheetCount.map(item => item.sheet));
                    const missingSheets = completeSheetList.filter(s => !currentSheetSet.has(s));
                    return missingSheets.join(', ');
                }
                const sides = countSheetNotExists === 'V'
                    ? ['V']
                    : countSheetNotExists === 'F'
                        ? ['F']
                        : ['F', 'V'];
                const completeList = generateSequence(1, maxSheet).flatMap(sheet => sides.map(side => ({ sheet, side })));
                const missingItems = findMissingItems(completeList, sheetCount, item => `${item.sheet}-${item.side}`);
                if (countSheetNotExists === 'I') {
                    const oddItens = missingItems.filter(item => item.sheet % 2 !== 0 && item.side === 'F');
                    return oddItens.map(item => `${item.sheet}${item.side}`).join(', ');
                }
                if (countSheetNotExists === 'PA') {
                    const pairItens = missingItems.filter(item => item.sheet % 2 === 0 && item.side === 'V');
                    return pairItens.map(item => `${item.sheet}${item.side}`).join(', ');
                }
                return missingItems.map(item => `${item.sheet}${item.side}`).join(', ');
            }
            if (countSheetNotExists) {
                const bookSumaryList = [];
                for (const item of bookSummaryPayload) {
                    const idx = item.indexbook === null || item.indexbook === undefined
                        ? null
                        : Number(item.indexbook);
                    const yearGroup = item.year === null || item.year === undefined ? null : Number(item.year);
                    item.side = await verifySide(Number(item.book), idx, yearGroup);
                    bookSumaryList.push(item);
                }
                return response.status(200).send(bookSumaryList);
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
        let { startCod, endCod, year, month, box, prot, box_replace } = request.requestData;
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
                    companies_id: authenticate.companies_id,
                };
                const verifyBookRecord = await Bookrecord_1.default.query()
                    .where('cod', bookRecord.cod)
                    .andWhere('companies_id', authenticate.companies_id)
                    .andWhere('typebooks_id', bookRecord.typebooks_id)
                    .andWhere('books_id', 13)
                    .andWhere('book', bookRecord.book).first();
                if (verifyBookRecord) {
                    if (box_replace)
                        bookRecord.book = box_replace;
                    const bookRecordId = await Bookrecord_1.default.query()
                        .where('id', verifyBookRecord.id)
                        .andWhere('typebooks_id', verifyBookRecord.typebooks_id)
                        .andWhere('companies_id', verifyBookRecord.companies_id)
                        .andWhere('books_id', 13)
                        .update(bookRecord);
                    document.bookrecords_id = verifyBookRecord.id;
                    if (prot)
                        document.prot = prot++;
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
                    document.typebooks_id = bookRecord.typebooks_id;
                    document.books_id = 13;
                    document.companies_id = bookRecord.companies_id;
                    if (prot)
                        document.prot = prot++;
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
    async maxBookRecord({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const { typebooks_id } = request.only(['typebooks_id']);
        if (typebooks_id == undefined)
            return;
        const maxBook = await Bookrecord_1.default.query()
            .where('typebooks_id', typebooks_id)
            .andWhere('companies_id', authenticate.companies_id)
            .max('book as max_book')
            .first();
        let maxSheet;
        if (maxBook) {
            maxSheet = await Bookrecord_1.default.query()
                .where('typebooks_id', typebooks_id)
                .andWhere('companies_id', authenticate.companies_id)
                .andWhere('book', maxBook?.$extras.max_book)
                .max('sheet as max_sheet')
                .first();
        }
        const query = Bookrecord_1.default.query()
            .where('books_id', 13)
            .andWhere('companies_id', authenticate.companies_id)
            .max('cod as max_cod');
        const maxCodDocument = await query.first();
        return response.status(200).send({ max_book: maxBook?.$extras.max_book, max_sheet: maxSheet.$extras.max_sheet, max_cod_document: maxCodDocument?.$extras.max_cod });
    }
}
exports.default = BookrecordsController;
//# sourceMappingURL=BookrecordsController.js.map