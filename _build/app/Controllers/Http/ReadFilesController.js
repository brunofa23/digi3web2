"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Application_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Application"));
const readFile_1 = global[Symbol.for('ioc.use')]("App/Services/readFile/readFile");
const Bookrecord_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Bookrecord"));
const Document_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Document"));
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const util_1 = global[Symbol.for('ioc.use')]("App/Services/util");
function hasRequiredProperties(obj, properties) {
    return properties.every(property => obj.hasOwnProperty(property));
}
const requiredProperties = ['id', 'cod', 'book'];
class ReadFilesController {
    async readFile({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const { typebooks_id, books_id } = request.only(['typebooks_id', 'books_id']);
        const file = request.file('file', {
            size: '100mb',
            extnames: ['xls', 'xlsx', 'csv']
        });
        if (!file?.isValid || file === undefined) {
            return file?.errors;
        }
        await file?.move(Application_1.default.tmpPath(`/uploads/Client_${authenticate.companies_id}`));
        const filePath = Application_1.default.tmpPath(`/uploads/Client_${authenticate.companies_id}/${file.clientName}`);
        const bookrecords = await (0, readFile_1.readFile)(filePath);
        const containsAll = requiredProperties.every(element => bookrecords.header.includes(element));
        if (!containsAll) {
            await (0, util_1.DeleteFiles)(filePath);
            return response.status(400).send('typebook_error_103');
        }
        for (const cell of bookrecords.header) {
            if (cell === '' || cell === undefined || cell === null) {
                console.log("Alguma coluna inválida:", cell);
                await (0, util_1.DeleteFiles)(filePath);
                return response.status(400).send('typebook_error_103');
            }
        }
        let totUpdate = 0;
        let totCreate = 0;
        const trx = await Database_1.default.beginGlobalTransaction();
        for (const bookrecord of bookrecords.data) {
            const hasProperties = hasRequiredProperties(bookrecord, requiredProperties);
            if (!hasProperties)
                continue;
            try {
                const searchPayload = await Bookrecord_1.default.query()
                    .where('id', bookrecord.id)
                    .andWhere('typebooks_id', typebooks_id)
                    .andWhere('books_id', books_id)
                    .andWhere('companies_id', authenticate.companies_id).first();
                if (searchPayload) {
                    await Bookrecord_1.default.query(trx)
                        .where('id', bookrecord.id)
                        .andWhere('typebooks_id', typebooks_id)
                        .andWhere('books_id', books_id)
                        .andWhere('companies_id', authenticate.companies_id)
                        .update({ cod: bookrecord.cod, book: bookrecord.book });
                    const update = await Document_1.default.query(trx)
                        .where('bookrecords_id', bookrecord.id)
                        .andWhere('typebooks_id', typebooks_id)
                        .andWhere('books_id', books_id)
                        .andWhere('companies_id', authenticate.companies_id)
                        .update({
                        bookrecords_id: bookrecord.id,
                        typebooks_id: typebooks_id,
                        books_id: books_id,
                        companies_id: authenticate.companies_id,
                        box2: bookrecord.box2,
                        month: bookrecord.month,
                        yeardoc: bookrecord.yeardoc,
                        intfield1: bookrecord.intfield1,
                        stringfield1: bookrecord.stringfield1,
                        datefield1: bookrecord.datefield1,
                        intfield2: bookrecord.intfield2,
                        stringfield2: bookrecord.stringfield2,
                        datefield2: bookrecord.datefield2,
                        intfield3: bookrecord.intfield3,
                        stringfield3: bookrecord.stringfield3,
                        datefield3: bookrecord.datefield3,
                        intfield4: bookrecord.intfield4,
                        stringfield4: bookrecord.stringfield4,
                        datefield4: bookrecord.datefield4,
                        intfield5: bookrecord.intfield5,
                        stringfield5: bookrecord.stringfield5,
                        datefield5: bookrecord.datefield5,
                        intfield6: bookrecord.intfield6,
                        stringfield6: bookrecord.stringfield6,
                        datefield6: bookrecord.datefield6,
                        intfield7: bookrecord.intfield7,
                        stringfield7: bookrecord.stringfield7,
                        datefield7: bookrecord.datefield7,
                        intfield8: bookrecord.intfield8,
                        stringfield8: bookrecord.stringfield8,
                        datefield8: bookrecord.datefield8,
                        intfield9: bookrecord.intfield9,
                        stringfield9: bookrecord.stringfield9,
                        datefield9: bookrecord.datefield9,
                        intfield10: bookrecord.intfield10,
                        stringfield10: bookrecord.stringfield10,
                        datefield10: bookrecord.datefield10,
                        intfield11: bookrecord.intfield11,
                        stringfield11: bookrecord.stringfield11,
                        datefield11: bookrecord.datefield11,
                        intfield12: bookrecord.intfield12,
                        stringfield12: bookrecord.stringfield12,
                        datefield12: bookrecord.datefield12,
                        intfield13: bookrecord.intfield13,
                        stringfield13: bookrecord.stringfield13,
                        datefield13: bookrecord.datefield13
                    });
                    if (update)
                        totUpdate++;
                }
                else {
                    await Bookrecord_1.default.create({
                        id: bookrecord.id,
                        typebooks_id: typebooks_id,
                        books_id: books_id,
                        companies_id: authenticate.companies_id,
                        cod: bookrecord.cod,
                        book: bookrecord.book
                    }, trx);
                    const create = await Document_1.default.create({
                        bookrecords_id: bookrecord.id,
                        typebooks_id: typebooks_id,
                        books_id: books_id,
                        companies_id: authenticate.companies_id,
                        box2: bookrecord.box2,
                        month: bookrecord.month,
                        yeardoc: bookrecord.yeardoc,
                        intfield1: bookrecord.intfield1,
                        stringfield1: bookrecord.stringfield1,
                        datefield1: bookrecord.datefield1,
                        intfield2: bookrecord.intfield2,
                        stringfield2: bookrecord.stringfield2,
                        datefield2: bookrecord.datefield2,
                        intfield3: bookrecord.intfield3,
                        stringfield3: bookrecord.stringfield3,
                        datefield3: bookrecord.datefield3,
                        intfield4: bookrecord.intfield4,
                        stringfield4: bookrecord.stringfield4,
                        datefield4: bookrecord.datefield4,
                        intfield5: bookrecord.intfield5,
                        stringfield5: bookrecord.stringfield5,
                        datefield5: bookrecord.datefield5,
                        intfield6: bookrecord.intfield6,
                        stringfield6: bookrecord.stringfield6,
                        datefield6: bookrecord.datefield6,
                        intfield7: bookrecord.intfield7,
                        stringfield7: bookrecord.stringfield7,
                        datefield7: bookrecord.datefield7,
                        intfield8: bookrecord.intfield8,
                        stringfield8: bookrecord.stringfield8,
                        datefield8: bookrecord.datefield8,
                        intfield9: bookrecord.intfield9,
                        stringfield9: bookrecord.stringfield9,
                        datefield9: bookrecord.datefield9,
                        intfield10: bookrecord.intfield10,
                        stringfield10: bookrecord.stringfield10,
                        datefield10: bookrecord.datefield10,
                        intfield11: bookrecord.intfield11,
                        stringfield11: bookrecord.stringfield11,
                        datefield11: bookrecord.datefield11,
                        intfield12: bookrecord.intfield12,
                        stringfield12: bookrecord.stringfield12,
                        datefield12: bookrecord.datefield12,
                        intfield13: bookrecord.intfield13,
                        stringfield13: bookrecord.stringfield13,
                        datefield13: bookrecord.datefield13
                    });
                    if (create.id)
                        totCreate++;
                }
                await trx.commit();
            }
            catch (error) {
                await trx.rollback();
                throw error;
            }
        }
        await (0, util_1.DeleteFiles)(filePath);
        return response.status(201).send({ resp: "Import Success!", totCreate, totUpdate });
    }
}
exports.default = ReadFilesController;
//# sourceMappingURL=ReadFilesController.js.map