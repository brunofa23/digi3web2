"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const Bookrecord_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Bookrecord"));
const Indeximage_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Indeximage"));
const Env_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Env"));
class BookrecordsController {
    async teste({ auth, request, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        return request;
        const data = await Bookrecord_1.default.query()
            .select('bookrecords.*').leftJoin('indeximages', 'bookrecords.id', '=', 'indeximages.bookrecords_id')
            .select(Database_1.default.raw('(select count(`seq`) from `indeximages` indeximagesA where bookrecords.id=indeximagesA.bookrecords_id limit 1) countfiles'))
            .where("bookrecords.companies_id", '=', authenticate.companies_id)
            .andWhere("bookrecords.typebooks_id", '=', params.typebooks_id)
            .preload('indeximage')
            .groupBy('bookrecords.id')
            .orderBy("book", "asc")
            .orderBy("cod", "asc")
            .orderBy("sheet", "asc");
        console.log(">>>>>pesquisa get", data);
        return response.send(data);
    }
    async index({ auth, request, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const { codstart, codend, bookstart, bookend, approximateterm, indexbook, year, letter, sheetstart, sheetend, side, sheetzero, lastPagesOfEachBook } = request.requestData;
        console.log(">>>>request", request.requestData);
        let query = " 1=1 ";
        if (!codstart && !codend && !approximateterm && !year && !indexbook && !letter && !bookstart && !bookend && !sheetstart && !sheetend && !side && (!sheetzero || sheetzero == 'false'))
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
            if (indexbook != undefined)
                query += ` and indexbook=${indexbook} `;
            if (year != undefined)
                query += ` and year like '${year}' `;
            if (sheetzero)
                query += ` and sheet>=0`;
        }
        if (lastPagesOfEachBook) {
            query += ` and sheet in (select max(sheet) from bookrecords bookrecords1 where (bookrecords1.book = bookrecords.book) and (bookrecords1.typebooks_id=bookrecords.typebooks_id)) `;
        }
        const page = request.input('page', 1);
        const limit = Env_1.default.get('PAGINATION');
        const data = await Bookrecord_1.default.query()
            .where("companies_id", '=', authenticate.companies_id)
            .andWhere("typebooks_id", '=', params.typebooks_id)
            .preload('indeximage')
            .whereRaw(query)
            .orderBy("book", "asc")
            .orderBy("cod", "asc")
            .orderBy("sheet", "asc")
            .paginate(page, limit);
        return response.send(data);
    }
    async show({ params }) {
        const data = await Bookrecord_1.default.findOrFail(params.id);
        return {
            data: data,
        };
    }
    async destroyManyBookRecords({ auth, request }) {
        const authenticate = await auth.use('api').authenticate();
        const { typebooks_id, Book, startCod, endCod } = request.requestBody;
        let query = '1 = 1';
        if (Book == undefined)
            return;
        if (typebooks_id != undefined) {
            if (Book != undefined) {
                query += ` and book=${Book} `;
            }
            if (startCod != undefined && endCod != undefined && startCod > 0 && endCod > 0)
                query += ` and cod>=${startCod} and cod <=${endCod} `;
            const dataIndexImages = await Indeximage_1.default.query().delete()
                .whereIn("bookrecords_id", Database_1.default.from('bookrecords').select('id').where('typebooks_id', '=', typebooks_id).whereRaw(query));
            const data = await Bookrecord_1.default.query().where('typebooks_id', '=', typebooks_id).whereRaw(query).delete();
            return { dataIndexImages, data };
        }
    }
    async destroy({ params }) {
        const data = await Bookrecord_1.default.findOrFail(params.id);
        await data.delete();
        return {
            message: "Livro excluido com sucesso.",
            data: data
        };
    }
    async update({ request, params }) {
        const body = request.only(Bookrecord_1.default.fillable);
        body.id = params.id;
        const data = await Bookrecord_1.default.findOrFail(body.id);
        await data.fill(body).save();
        return {
            message: 'Tipo de Livro cadastrado com sucesso!!',
            data: data,
            params: params.id
        };
    }
    async createorupdatebookrecords({ auth, request, params }) {
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
                console.log("NEW iterator:::", newRecord);
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
                console.log("UPDATE iterator:::", updateRecord);
            }
        }
        await Bookrecord_1.default.createMany(newRecord);
        await Bookrecord_1.default.updateOrCreateMany('id', updateRecord);
        return "sucesso!!";
    }
    async generateOrUpdateBookrecords({ auth, request, params, response }) {
        console.log(">>>>>PASSEI PELO generateOrUpdateBookrecords.....");
        const authenticate = await auth.use('api').authenticate();
        let { generateBooks_id, generateBook, generateBookdestination, generateStartCode, generateEndCode, generateStartSheetInCodReference, generateEndSheetInCodReference, generateSheetIncrement, generateSideStart, generateAlternateOfSides, generateApproximate_term, generateApproximate_termIncrement, generateIndex, generateIndexIncrement, generateYear } = request.requestData;
        const _startCode = generateStartCode;
        const _endCode = generateEndCode;
        if (!generateBook || isNaN(generateBook) || generateBook <= 0) {
            console.log("ERRRRRROR:", response.status(401));
            return response.status(401);
        }
        let contSheet = 0;
        let contIncrementSheet = 0;
        let contFirstSheet = false;
        let contFirstSide = false;
        let sideNow = 0;
        let approximate_term = generateApproximate_term;
        let approximate_termIncrement = 0;
        let indexBook = generateIndex;
        let indexIncrement = 0;
        const bookrecords = [];
        for (let index = 0; index < generateEndCode; index++) {
            if (generateStartCode >= generateStartSheetInCodReference) {
                if (contIncrementSheet < generateSheetIncrement) {
                    contIncrementSheet++;
                    if (contFirstSheet == false) {
                        contFirstSheet = true;
                        contSheet++;
                    }
                }
                else {
                    contIncrementSheet = 1;
                    contSheet++;
                }
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
            if (generateStartCode > generateEndSheetInCodReference)
                contSheet = 0;
            bookrecords.push({
                cod: generateStartCode++,
                book: generateBook,
                sheet: ((!generateStartSheetInCodReference && !generateEndSheetInCodReference) || (generateStartSheetInCodReference == 0 && generateEndSheetInCodReference == 0) ? undefined : contSheet),
                side: (!generateSideStart || (generateSideStart != "F" && generateSideStart != "V") ? undefined : generateSideStart),
                approximate_term: ((!generateApproximate_term || generateApproximate_term == 0) ? undefined : approximate_term),
                indexbook: ((!generateIndex || generateIndex == 0) ? undefined : indexBook),
                year: ((!generateYear ? undefined : generateYear)),
                typebooks_id: params.typebooks_id,
                books_id: generateBooks_id,
                companies_id: authenticate.companies_id
            });
        }
        console.log(">>>>>bookrecords>>>>>", bookrecords);
        const data = await Bookrecord_1.default.updateOrCreateMany(['cod', 'book', 'books_id', 'companies_id'], bookrecords);
        if (generateBook > 0 && generateBookdestination > 0) {
            await Bookrecord_1.default.query().where("companies_id", "=", authenticate.companies_id)
                .andWhere('book', '=', generateBook)
                .andWhereBetween('cod', [_startCode, _endCode]).update({ book: generateBookdestination });
        }
        return data.length;
    }
}
exports.default = BookrecordsController;
//# sourceMappingURL=BookrecordsController.js.map