"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const luxon_1 = require("luxon");
const OrderCertificate_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/OrderCertificate"));
const Person_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Person"));
const MarriedCertificate_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/MarriedCertificate"));
const SecondcopyCertificate_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/SecondcopyCertificate"));
const uploadImages_1 = global[Symbol.for('ioc.use')]("App/Services/uploads/uploadImages");
class OrderCertificatesController {
    toNumber(v) {
        if (v === null || v === undefined || v === '')
            return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    }
    parseJsonFieldOrFail(response, raw, fieldName) {
        if (raw === null || raw === undefined || raw === '')
            return null;
        if (typeof raw === 'object')
            return raw;
        if (typeof raw === 'string') {
            const trimmed = raw.trim();
            if (trimmed === '[object Object]') {
                response.badRequest({
                    message: `${fieldName} inválido: veio como "[object Object]". No front, envie JSON.stringify(${fieldName}).`,
                });
                return null;
            }
            try {
                return JSON.parse(trimmed);
            }
            catch {
                response.badRequest({ message: `${fieldName} inválido (JSON malformado)` });
                return null;
            }
        }
        response.badRequest({ message: `${fieldName} inválido: tipo inesperado` });
        return null;
    }
    async upsertPerson(personData, companiesId, trx) {
        if (!personData)
            return null;
        const hasAny = String(personData?.name ?? '').trim() !== '' ||
            String(personData?.cpf ?? '').trim() !== '' ||
            this.toNumber(personData?.id) !== null;
        if (!hasAny)
            return null;
        const personId = this.toNumber(personData?.id);
        let person;
        if (personId) {
            person = await Person_1.default.findOrFail(personId, { client: trx });
        }
        else {
            person = new Person_1.default();
        }
        person.useTransaction(trx);
        person.merge({
            companiesId,
            name: personData.name ?? '',
            nameMarried: personData.nameMarried ?? '',
            cpf: String(personData.cpf ?? '').trim() === '' ? null : String(personData.cpf),
            gender: personData.gender ?? '',
            deceased: personData.deceased ?? false,
            dateBirth: personData.dateBirth
                ? luxon_1.DateTime.fromISO(String(personData.dateBirth))
                : null,
            maritalStatus: personData.maritalStatus ?? '',
            illiterate: personData.illiterate ?? false,
            placeBirth: personData.placeBirth ?? '',
            nationality: personData.nationality ?? '',
            occupationId: personData.occupationId ?? null,
            zipCode: personData.zipCode ?? '',
            address: personData.address ?? '',
            streetNumber: personData.streetNumber ?? '',
            streetComplement: personData.streetComplement ?? '',
            district: personData.district ?? '',
            city: personData.city ?? '',
            state: personData.state ?? '',
            documentType: personData.documentType ?? '',
            documentNumber: personData.documentNumber ?? '',
            phone: personData.phone ?? '',
            cellphone: personData.cellphone ?? '',
            email: personData.email ?? '',
            mother: personData.mother ?? '',
            father: personData.father ?? '',
            inactive: personData.inactive ?? false,
        });
        await person.save();
        return person;
    }
    async saveMarriage(marriedData, companiesId, usrId, trx) {
        try {
            const groom = await this.upsertPerson(marriedData.groom, companiesId, trx);
            if (!groom)
                throw new Error('Groom (noivo) é obrigatório');
            const fatherGroom = await this.upsertPerson(marriedData.fatherGroom, companiesId, trx);
            const motherGroom = await this.upsertPerson(marriedData.motherGroom, companiesId, trx);
            const bride = await this.upsertPerson(marriedData.bride, companiesId, trx);
            if (!bride)
                throw new Error('Bride (noiva) é obrigatória');
            const fatherBride = await this.upsertPerson(marriedData.fatherBride, companiesId, trx);
            const motherBride = await this.upsertPerson(marriedData.motherBride, companiesId, trx);
            const witness1 = await this.upsertPerson(marriedData.witness1, companiesId, trx);
            const witness2 = await this.upsertPerson(marriedData.witness2, companiesId, trx);
            const marriedCertificate = await MarriedCertificate_1.default.updateOrCreate({ id: marriedData.id }, {
                companiesId,
                usrId: usrId ?? null,
                groomPersonId: groom.id,
                fatherGroomPersonId: fatherGroom?.id ?? null,
                motherGroomPersonId: motherGroom?.id ?? null,
                bridePersonId: bride.id,
                fahterBridePersonId: fatherBride?.id ?? null,
                motherBridePersonId: motherBride?.id ?? null,
                witnessPersonId: witness1?.id ?? null,
                witness2PersonId: witness2?.id ?? null,
                statusId: marriedData.statusId ?? null,
                dthrSchedule: marriedData.dthrSchedule && String(marriedData.dthrSchedule).trim() !== ''
                    ? luxon_1.DateTime.fromISO(marriedData.dthrSchedule, { zone: 'America/Sao_Paulo' })
                    : null,
                dthrMarriage: marriedData.dthrMarriage ? luxon_1.DateTime.fromISO(marriedData.dthrMarriage) : null,
                type: marriedData.type ?? '',
                obs: marriedData.obs ?? '',
                churchName: marriedData.churchName ?? '',
                churchCity: marriedData.churchCity ?? '',
                maritalRegime: marriedData.maritalRegime ?? '',
                prenup: marriedData.prenup ?? false,
                registryOfficePrenup: marriedData.registryOfficePrenup ?? '',
                addresRegistryOfficePrenup: marriedData.addresRegistryOfficePrenup ?? '',
                bookRegistryOfficePrenup: marriedData.bookRegistryOfficePrenup ?? null,
                sheetRegistryOfficePrenup: marriedData.sheetRegistryOfficePrenup ?? null,
                dthrPrenup: marriedData.dthrPrenup ?? null,
                cerimonyLocation: marriedData.cerimonyLocation ?? '',
                otherCerimonyLocation: marriedData.otherCerimonyLocation ?? '',
                nameFormerSpouse: marriedData.nameFormerSpouse ?? '',
                dthrDivorceSpouse: marriedData.dthrDivorceSpouse ?? null,
                nameFormerSpouse2: marriedData.nameFormerSpouse2 ?? '',
                dthrDivorceSpouse2: marriedData.dthrDivorceSpouse2 ?? null,
                inactive: marriedData.inactive ?? false,
                statusForm: marriedData.statusForm ?? '',
            }, { client: trx });
            return marriedCertificate.id;
        }
        catch (error) {
            console.error('ERRO AO SALVAR MARRIAGE:', error);
            throw error;
        }
    }
    async saveSecondcopy(secondData, companiesId, usrId, trx) {
        try {
            const isValidId = (v) => {
                const n = typeof v === 'string' ? Number(v) : v;
                return typeof n === 'number' && Number.isFinite(n) && n > 0;
            };
            const toId = (v) => {
                if (v === null || v === undefined || v === '')
                    return null;
                const n = Number(v);
                return Number.isFinite(n) && n > 0 ? n : null;
            };
            const resolvePersonId = async (idField, personObj) => {
                if (personObj && (personObj.id || personObj.name || personObj.cpf)) {
                    const p = await this.upsertPerson(personObj, companiesId, trx);
                    if (p?.id)
                        return p.id;
                }
                const id = this.toNumber(idField);
                return id ?? null;
            };
            const applicantPersonObj = secondData?.applicantPerson ?? null;
            const registered1PersonObj = secondData?.registered1Person ?? null;
            const registered2PersonObj = secondData?.registered2Person ?? null;
            const applicantId = await resolvePersonId(secondData?.applicant, applicantPersonObj);
            if (!applicantId)
                throw new Error('Applicant (requerente) é obrigatório');
            const registered1Id = await resolvePersonId(secondData?.registered1, registered1PersonObj);
            if (!registered1Id)
                throw new Error('Registered1 (registrado 1) é obrigatório');
            const registered2Id = await resolvePersonId(secondData?.registered2, registered2PersonObj);
            const secondcopyId = toId(secondData?.id);
            let secondcopy;
            if (secondcopyId) {
                secondcopy = await SecondcopyCertificate_1.default.findOrFail(secondcopyId, { client: trx });
            }
            else {
                secondcopy = new SecondcopyCertificate_1.default();
            }
            secondcopy.useTransaction(trx);
            secondcopy.merge({
                companiesId,
                documenttypeId: secondData?.documenttypeId ?? null,
                paymentMethod: secondData?.paymentMethod ?? null,
                applicant: applicantId,
                registered1: registered1Id,
                typebookId: secondData.typebookId ?? null,
                book1: secondData?.book1 ?? null,
                sheet1: secondData?.sheet1 ?? null,
                city1: secondData?.city1 ?? null,
                term1: secondData?.term1 ?? null,
                registered2: registered2Id ?? null,
                book2: secondData?.book2 ?? null,
                sheet2: secondData?.sheet2 ?? null,
                city2: secondData?.city2 ?? null,
                obs: secondData?.obs ?? null,
                inactive: secondData?.inactive ?? null
            });
            console.log("@@@@@@@@@@@@@@@@@@", secondcopy);
            await secondcopy.save();
            return secondcopy.id;
        }
        catch (error) {
            console.error('ERRO AO SALVAR SECONDCOPY:', error);
            throw error;
        }
    }
    async index({ auth, request }) {
        const authenticate = await auth.use('api').authenticate();
        const dateStartOrderCertificate = request.input('dateStartOrderCertificate');
        const dateEndtOrderCertificate = request.input('dateEndOrderCertificate');
        const cpf = request.input('cpf')
            ? String(request.input('cpf')).replace(/\D/g, '')
            : null;
        const dateStartReceipt = request.input('dateStartReceipt') || null;
        const dateEndReceipt = request.input('dateEndReceipt') || null;
        const dateStartProtocol = request.input('dateStartProtocol') || null;
        const dateEndProtocol = request.input('dateEndProtocol') || null;
        const dateStartStamp = request.input('dateStartStamp') || null;
        const dateEndStamp = request.input('dateEndStamp') || null;
        const dateStartPrevision = request.input('dateStartPrevision') || null;
        const dateEndPrevision = request.input('dateEndPrevision') || null;
        const receiptId = request.input('receiptId') || null;
        const employeeVerificationId = request.input('employeeVerificationId') || null;
        const emolumentCode = request.input('emolumentCode') || null;
        const query = OrderCertificate_1.default.query()
            .preload('book', (query) => query.select('id', 'name'))
            .preload('marriedCertificate', (query) => {
            query.select('id', 'groomPersonId', 'bridePersonId');
            query.preload('groom', (q) => q.select('name', 'cpf'));
            query.preload('bride', (q) => q.select('name', 'cpf'));
        })
            .preload('secondcopyCertificate', (q) => {
            q.select('*');
            q.preload('applicantPerson', (p) => p.select('name', 'cpf'));
            q.preload('registered1Person', (p) => p.select('name', 'cpf'));
            q.preload('registered2Person', (p) => p.select('name', 'cpf'));
        })
            .preload('receipt', (q) => {
            q.select(['id', 'order_certificate_id', 'date_stamp']);
        })
            .where('companies_id', authenticate.companies_id);
        if (dateStartOrderCertificate)
            query.andWhere('created_at', '>=', dateStartOrderCertificate);
        if (dateEndtOrderCertificate) {
            query.andWhere('created_at', '<=', dateEndtOrderCertificate);
        }
        if (receiptId) {
            query.whereHas('receipt', (r) => {
                r.where('id', receiptId);
            });
        }
        if (dateStartReceipt || dateEndReceipt) {
            query.whereHas('receipt', (r) => {
                if (dateStartReceipt) {
                    r.where('created_at', '>=', dateStartReceipt);
                }
                if (dateEndReceipt) {
                    r.where('created_at', '<=', dateEndReceipt);
                }
            });
        }
        if (dateStartProtocol || dateEndProtocol) {
            query.whereHas('receipt', (r) => {
                if (dateStartProtocol) {
                    r.where('date_protocol', '>=', dateStartProtocol);
                }
                if (dateEndProtocol) {
                    r.where('date_protocol', '<=', dateEndProtocol);
                }
            });
        }
        if (dateStartStamp || dateEndStamp) {
            query.whereHas('receipt', (r) => {
                if (dateStartStamp) {
                    r.where('date_stamp', '>=', dateStartStamp);
                }
                if (dateEndStamp) {
                    r.where('date_stamp', '<=', dateEndStamp);
                }
            });
        }
        if (dateStartPrevision || dateEndPrevision) {
            query.whereHas('receipt', (r) => {
                if (dateStartPrevision) {
                    r.where('date_prevision', '>=', dateStartPrevision);
                }
                if (dateEndPrevision) {
                    r.where('date_prevision', '<=', dateEndPrevision);
                }
            });
        }
        if (employeeVerificationId) {
            query.whereHas('receipt', (r) => {
                r.whereHas('employeeVerificationXReceipts', (evxr) => {
                    evxr
                        .where('employeeVerificationId', employeeVerificationId)
                        .where('companiesId', authenticate.companies_id);
                });
            });
        }
        if (emolumentCode) {
            query.whereHas('receipt', (r) => {
                r.whereHas('items', (it) => {
                    it.whereHas('emolument', (e) => {
                        e.where('code', emolumentCode);
                        e.where('companiesId', authenticate.companies_id);
                    });
                });
            });
        }
        if (cpf) {
            query.where((q) => {
                q.whereHas('marriedCertificate', (mc) => {
                    mc
                        .whereHas('groom', (g) => {
                        g.where('cpf', cpf);
                    })
                        .orWhereHas('bride', (b) => {
                        b.where('cpf', cpf);
                    });
                });
                q.orWhereHas('secondcopyCertificate', (sc) => {
                    sc
                        .whereHas('applicantPerson', (p) => {
                        p.where('cpf', cpf);
                    })
                        .orWhereHas('registered1Person', (p) => {
                        p.where('cpf', cpf);
                    })
                        .orWhereHas('registered2Person', (p) => {
                        p.where('cpf', cpf);
                    });
                });
            });
        }
        const orderCertificate = await query.orderBy('id', 'asc');
        return orderCertificate;
    }
    async show({ auth, params, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const book_id = request.input('book_id');
        const query = OrderCertificate_1.default.query()
            .where('id', params.id)
            .andWhere('companies_id', authenticate.companies_id)
            .preload('book', (q) => q.select('id', 'name'));
        if (book_id == 2) {
            query.preload('marriedCertificate', (q) => {
                q.preload('groom', (qq) => qq.select('*'));
                q.preload('motherGroom', (qq) => qq.select('*'));
                q.preload('fatherGroom', (qq) => qq.select('*'));
                q.preload('bride', (qq) => qq.select('*'));
                q.preload('motherBride', (qq) => qq.select('*'));
                q.preload('fatherBride', (qq) => qq.select('*'));
                q.preload('witness1', (qq) => qq.select('*'));
                q.preload('witness2', (qq) => qq.select('*'));
            });
        }
        if (book_id == 21) {
            query.preload('secondcopyCertificate', (q) => {
                q.preload('applicantPerson', (p) => p.select('*'));
                q.preload('registered1Person', (p) => p.select('*'));
                q.preload('registered2Person', (p) => p.select('*'));
                q.preload('documenttype', (d) => d.select('*'));
            });
        }
        const orderCertificate = await query.first();
        if (!orderCertificate) {
            return response.notFound({ message: 'Pedido de certidão não encontrado' });
        }
        return orderCertificate;
    }
    async store({ auth, request, response }) {
        const user = await auth.use('api').authenticate();
        const body = request.body();
        const bookId = this.toNumber(body.bookId ?? body.book_id);
        const certificateId = this.toNumber(body.certificateId ?? body.certificate_id);
        const typeCertificate = this.toNumber(body.typeCertificate ?? body.type_certificate);
        if (!bookId) {
            return response.badRequest({ message: 'bookId é obrigatório' });
        }
        try {
            const orderCertificate = await Database_1.default.transaction(async (trx) => {
                let finalCertificateId = certificateId ?? null;
                if (bookId === 2 && body.marriedCertificate) {
                    const parsedMarriage = this.parseJsonFieldOrFail(response, body.marriedCertificate, 'marriedCertificate');
                    if (!parsedMarriage)
                        return null;
                    await Validator_1.validator.validate({
                        schema: Validator_1.schema.create({
                            groom: Validator_1.schema.object().members({
                                name: Validator_1.schema.string({ trim: true }),
                                cpf: Validator_1.schema.string({ trim: true }),
                            }),
                            bride: Validator_1.schema.object().members({
                                name: Validator_1.schema.string({ trim: true }),
                                cpf: Validator_1.schema.string({ trim: true }),
                            }),
                        }),
                        data: parsedMarriage,
                        messages: {
                            'groom.required': 'O noivo é obrigatório',
                            'groom.name.required': 'Nome do noivo é obrigatório',
                            'groom.cpf.required': 'CPF do noivo é obrigatório',
                            'bride.required': 'A noiva é obrigatória',
                            'bride.name.required': 'Nome da noiva é obrigatório',
                            'bride.cpf.required': 'CPF da noiva é obrigatório',
                        },
                    });
                    finalCertificateId = await this.saveMarriage(parsedMarriage, user.companies_id, user.id, trx);
                }
                if (bookId === 21 && (body.secondcopyCertificate || body.secondCopyCertificate)) {
                    const rawSecond = body.secondcopyCertificate ?? body.secondCopyCertificate;
                    const parsedSecond = this.parseJsonFieldOrFail(response, rawSecond, 'secondcopyCertificate');
                    if (!parsedSecond)
                        return null;
                    const applicant = parsedSecond?.applicant ?? parsedSecond?.applicantPerson;
                    const registered1 = parsedSecond?.registered1 ?? parsedSecond?.registered1Person;
                    await Validator_1.validator.validate({
                        schema: Validator_1.schema.create({
                            applicant: Validator_1.schema.object().members({
                                name: Validator_1.schema.string({ trim: true }),
                                cpf: Validator_1.schema.string({ trim: true }),
                            }),
                            registered1: Validator_1.schema.object().members({
                                name: Validator_1.schema.string({ trim: true }),
                                cpf: Validator_1.schema.string({ trim: true }),
                            }),
                        }),
                        data: { applicant, registered1 },
                        messages: {
                            'applicant.required': 'O requerente é obrigatório',
                            'applicant.name.required': 'Nome do requerente é obrigatório',
                            'applicant.cpf.required': 'CPF do requerente é obrigatório',
                            'registered1.required': 'O registrado 1 é obrigatório',
                            'registered1.name.required': 'Nome do registrado 1 é obrigatório',
                            'registered1.cpf.required': 'CPF do registrado 1 é obrigatório',
                        },
                    });
                    finalCertificateId = await this.saveSecondcopy(parsedSecond, user.companies_id, user.id, trx);
                }
                const oc = new OrderCertificate_1.default();
                oc.useTransaction(trx);
                oc.merge({
                    certificateId: finalCertificateId,
                    bookId,
                    companiesId: user.companies_id,
                    typeCertificate: typeCertificate ?? undefined,
                });
                await oc.save();
                return oc;
            });
            if (!orderCertificate)
                return;
            if (orderCertificate.bookId === 2 && orderCertificate.certificateId) {
                const companiesId = user.companies_id;
                const fileFields = [
                    { field: 'DocumentGroom', description: 'DocNoivo' },
                    { field: 'DocumentBride', description: 'DocNoiva' },
                    { field: 'BirthCertificateGroom', description: 'CertidaoNoivo' },
                    { field: 'BirthCertificateBride', description: 'CertidaoNoiva' },
                    { field: 'ProofResidenceGroom', description: 'ResidenciaNoivo' },
                    { field: 'ProofResidenceBride', description: 'ResidenciaNoiva' },
                    { field: 'MarriageCertificateGroom', description: 'CertidaoCasamentoNoivo' },
                    { field: 'MarriageCertificateBride', description: 'CertidaoCasamentoNoiva' },
                    { field: 'DocumentWitness1', description: 'DocTestemunha1' },
                    { field: 'DocumentWitness2', description: 'DocTestemunha2' },
                ];
                const fileOptions = {
                    size: '8mb',
                    extnames: ['jpg', 'png', 'jpeg', 'pdf', 'xls', 'JPG', 'PNG', 'JPEG', 'PDF', 'XLS'],
                };
                for (const cfg of fileFields) {
                    const file = request.file(cfg.field, fileOptions);
                    if (!file)
                        continue;
                    await (0, uploadImages_1.uploadImage)({
                        companiesId,
                        marriedCertificateId: orderCertificate.certificateId,
                        file,
                        description: cfg.description,
                    });
                }
            }
            await orderCertificate.load('book');
            if (orderCertificate.bookId === 2)
                await orderCertificate.load('marriedCertificate');
            if (orderCertificate.bookId === 21)
                await orderCertificate.load('secondcopyCertificate');
            return response.created(orderCertificate);
        }
        catch (error) {
            if (error.code === 'E_VALIDATION_FAILURE') {
                return response.status(422).send({ errors: error.messages.errors });
            }
            console.error('❌ ERRO STORE:', error);
            return response.internalServerError({ message: 'Erro ao criar pedido de certidão' });
        }
    }
    async update({ auth, params, request, response }) {
        const user = await auth.use('api').authenticate();
        const orderCertificate = await OrderCertificate_1.default.find(params.id);
        if (!orderCertificate) {
            return response.notFound({ message: 'Pedido não encontrado' });
        }
        const body = request.body();
        const bookId = this.toNumber(body.bookId ?? body.book_id);
        const certificateIdFromBody = this.toNumber(body.certificateId ?? body.certificate_id);
        const typeCertificate = this.toNumber(body.typeCertificate ?? body.type_certificate);
        if (!bookId) {
            return response.badRequest({ message: 'bookId é obrigatório' });
        }
        try {
            await Database_1.default.transaction(async (trx) => {
                orderCertificate.useTransaction(trx);
                const patch = {
                    bookId,
                    companiesId: user.companies_id,
                    typeCertificate: typeCertificate ?? undefined,
                };
                if (certificateIdFromBody !== null)
                    patch.certificateId = certificateIdFromBody;
                orderCertificate.merge(patch);
                await orderCertificate.save();
                if (bookId === 2 && body.marriedCertificate) {
                    const parsedMarriage = this.parseJsonFieldOrFail(response, body.marriedCertificate, 'marriedCertificate');
                    if (!parsedMarriage)
                        return;
                    await this.saveMarriage(parsedMarriage, user.companies_id, user.id, trx);
                }
                if (bookId === 21 && (body.secondcopyCertificate || body.secondCopyCertificate || body.secondcopyCertificate)) {
                    const rawSecond = body.secondcopyCertificate ?? body.secondcopyCertificate ?? body.secondCopyCertificate;
                    const parsedSecond = this.parseJsonFieldOrFail(response, rawSecond, 'secondcopyCertificate');
                    if (!parsedSecond)
                        return;
                    console.log("###############################", parsedSecond);
                    const secondcopyId = this.toNumber(body.certificateId ?? body.certificate_id) ??
                        orderCertificate.certificateId ??
                        this.toNumber(parsedSecond?.id);
                    if (!secondcopyId) {
                        return response.badRequest({
                            message: 'Não foi possível determinar o ID da certidão (secondcopy). Envie certificateId ou garanta o vínculo no pedido.',
                        });
                    }
                    parsedSecond.id = secondcopyId;
                    const savedSecondcopyId = await this.saveSecondcopy(parsedSecond, user.companies_id, user.id, trx);
                    console.log("!!!!!!!!!!!", savedSecondcopyId);
                    if (!orderCertificate.certificateId) {
                        orderCertificate.certificateId = savedSecondcopyId;
                        await orderCertificate.save();
                    }
                }
            });
            if (orderCertificate.bookId === 2 && orderCertificate.certificateId) {
                const companiesId = user.companies_id;
                const fileFields = [
                    { field: 'DocumentGroom', description: 'DocNoivo' },
                    { field: 'DocumentBride', description: 'DocNoiva' },
                    { field: 'BirthCertificateGroom', description: 'CertidaoNoivo' },
                    { field: 'BirthCertificateBride', description: 'CertidaoNoiva' },
                    { field: 'ProofResidenceGroom', description: 'ResidenciaNoivo' },
                    { field: 'ProofResidenceBride', description: 'ResidenciaNoiva' },
                    { field: 'MarriageCertificateGroom', description: 'CertidaoCasamentoNoivo' },
                    { field: 'MarriageCertificateBride', description: 'CertidaoCasamentoNoiva' },
                    { field: 'DocumentWitness1', description: 'DocTestemunha1' },
                    { field: 'DocumentWitness2', description: 'DocTestemunha2' },
                ];
                const fileOptions = {
                    size: '8mb',
                    extnames: ['jpg', 'png', 'jpeg', 'pdf', 'xls', 'JPG', 'PNG', 'JPEG', 'PDF', 'XLS'],
                };
                for (const cfg of fileFields) {
                    const file = request.file(cfg.field, fileOptions);
                    if (!file)
                        continue;
                    await (0, uploadImages_1.uploadImage)({
                        companiesId,
                        marriedCertificateId: orderCertificate.certificateId,
                        file,
                        description: cfg.description,
                    });
                }
            }
            await orderCertificate.load('book');
            if (orderCertificate.bookId === 2)
                await orderCertificate.load('marriedCertificate');
            if (orderCertificate.bookId === 21)
                await orderCertificate.load('secondcopyCertificate');
            const check = await SecondcopyCertificate_1.default.find(orderCertificate.certificateId);
            return orderCertificate;
        }
        catch (error) {
            console.error('❌ ERRO UPDATE:', error);
            return response.internalServerError({
                message: 'Erro ao atualizar pedido de certidão',
                error: error.message,
            });
        }
    }
}
exports.default = OrderCertificatesController;
//# sourceMappingURL=OrderCertificatesController.js.map