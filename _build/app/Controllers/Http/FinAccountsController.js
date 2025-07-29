"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const FinAccount_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/FinAccount"));
const FinAccountStoreValidator_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Validators/FinAccountStoreValidator"));
const FinAccountUpdateValidator_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Validators/FinAccountUpdateValidator"));
const util_1 = global[Symbol.for('ioc.use')]("App/Services/util");
const finImages_1 = global[Symbol.for('ioc.use')]("App/Services/uploadFinImage/finImages");
const luxon_1 = require("luxon");
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
function toUTCISO(dateStr) {
    return dateStr ? luxon_1.DateTime.fromISO(dateStr).toUTC().toISO() : null;
}
class FinAccountsController {
    async index({ auth, request, response }) {
        const user = await auth.use('api').authenticate();
        const querySchema = Validator_1.schema.create({
            fin_emp_id: Validator_1.schema.number.optional(),
            fin_class_id: Validator_1.schema.number.optional(),
            fin_paymentmethod_id: Validator_1.schema.number.optional(),
            entity_id: Validator_1.schema.number.optional(),
            cost: Validator_1.schema.string.optional(),
            payment_method: Validator_1.schema.string.optional(),
            debit_credit: Validator_1.schema.string.optional(),
            description: Validator_1.schema.string.optional(),
            replicate: Validator_1.schema.boolean.optional(),
            ir: Validator_1.schema.boolean.optional(),
            analyze: Validator_1.schema.boolean.optional(),
            future: Validator_1.schema.boolean.optional(),
            reserve: Validator_1.schema.boolean.optional(),
            overplus: Validator_1.schema.boolean.optional(),
            isReconciled: Validator_1.schema.enum.optional(['C', 'N']),
            date_start: Validator_1.schema.string.optional(),
            date_end: Validator_1.schema.string.optional(),
            typeDate: Validator_1.schema.enum.optional(['DATE', 'DATE_DUE', 'DATE_CONCILIATION']),
        });
        const body = await request.validate({
            schema: querySchema,
            data: request.qs()
        });
        try {
            const query = FinAccount_1.default.query()
                .where('companies_id', user.companies_id)
                .where('excluded', false)
                .preload('finclass', q => q.select('description', 'allocation', 'cost', 'debit_credit', 'limit_amount'))
                .preload('finemp', q => q.select('name'))
                .preload('finPaymentMethod', q => q.select('description'));
            query.if(body.description, q => q.where('description', 'like', `%${body.description}%`));
            query.if(body.fin_emp_id, q => q.where('fin_emp_id', body.fin_emp_id));
            query.if(body.fin_class_id, q => q.where('fin_class_id', body.fin_class_id));
            query.if(body.cost, q => q.where('cost', body.cost));
            query.if(body.payment_method, q => q.where('payment_method', body.payment_method));
            query.if(body.ir === true, q => q.where('ir', true));
            query.if(body.debit_credit, q => q.where('debit_credit', body.debit_credit));
            query.if(body.replicate, q => q.where('replicate', body.replicate));
            query.if(body.fin_paymentmethod_id, q => q.where('fin_paymentmethod_id', body.fin_paymentmethod_id));
            query.if(body.entity_id, q => q.where('entity_id', body.entity_id));
            query.if(body.analyze, q => q.where('analyze', body.analyze));
            query.if(body.future, q => q.where('future', body.future));
            query.if(body.reserve, q => q.where('reserve', body.reserve));
            query.if(body.overplus, q => q.where('overplus', body.overplus));
            if (body.date_start && body.date_end && body.typeDate) {
                const start = luxon_1.DateTime.fromISO(body.date_start).toUTC().toISO();
                const end = luxon_1.DateTime.fromISO(body.date_end).toUTC().endOf('day').toISO();
                const dateColumnMap = {
                    DATE: 'DATE',
                    DATE_DUE: 'DATE_DUE',
                    DATE_CONCILIATION: 'DATE_CONCILIATION',
                };
                const dateColumn = dateColumnMap[body.typeDate];
                if (dateColumn) {
                    query.where(dateColumn, '>=', start).where(dateColumn, '<=', end);
                }
            }
            query.if(body.isReconciled === 'C', q => {
                q.whereNotNull('date_conciliation');
            });
            query.if(body.isReconciled === 'N', q => {
                q.whereNull('date_conciliation');
            });
            const data = await query;
            if (data.length > 0) {
                for (const entity of data) {
                    if (entity.entity_id) {
                        await entity.load('entity', (query) => {
                            query.select('fin_entities.description');
                        });
                    }
                }
            }
            return response.ok(data);
        }
        catch (error) {
            throw new BadRequestException_1.default('Erro ao buscar lançamentos', 401, error);
        }
    }
    async show({ auth, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        try {
            const data = await FinAccount_1.default.query()
                .where('id', params.id)
                .andWhere('companies_id', authenticate.companies_id);
            return response.status(200).send(data);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401, error);
        }
    }
    async store({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const body = await request.validate(FinAccountStoreValidator_1.default);
        body.companies_id = authenticate.companies_id;
        if (body.date) {
            body.date = luxon_1.DateTime.fromISO(body.date, { zone: 'utc' }).startOf('day');
        }
        if (body.date_due) {
            body.date_due = luxon_1.DateTime.fromISO(body.date_due, { zone: 'utc' }).startOf('day');
        }
        if (body.date_conciliation) {
            body.date_conciliation = luxon_1.DateTime.fromISO(body.date_conciliation, { zone: 'utc' }).startOf('day');
        }
        if (body.data_billing) {
            body.data_billing = luxon_1.DateTime.fromISO(body.data_billing, { zone: 'utc' }).startOf('day');
        }
        const { conciliation, ...body1 } = body;
        if (conciliation == true) {
            body1.date_conciliation = body.date_due;
        }
        try {
            const data = await FinAccount_1.default.create(body1);
            await (0, finImages_1.uploadFinImage)(authenticate.companies_id, data.id, request);
            await data.load('finPaymentMethod');
            await data.load('finclass');
            await data.load('finemp');
            return response.status(201).send(data);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401, error);
        }
    }
    async update({ auth, params, request, response }) {
        console.log("passei no update....");
        const authenticate = await auth.use('api').authenticate();
        const body = await request.validate(FinAccountUpdateValidator_1.default);
        body.date = body.date ? luxon_1.DateTime.fromISO(body.date, { zone: 'utc' }).startOf('day').toFormat("yyyy-MM-dd HH:mm") : null;
        body.date_due = body.date_due ? luxon_1.DateTime.fromISO(body.date_due).startOf('day').toFormat("yyyy-MM-dd HH:mm") : null;
        body.data_billing = body.data_billing ? luxon_1.DateTime.fromISO(body.data_billing, { zone: 'utc' }).startOf('day').toFormat("yyyy-MM-dd HH:mm") : null;
        body.date_conciliation = body.date_conciliation ? luxon_1.DateTime.fromISO(body.date_conciliation, { zone: 'utc' }).startOf('day').toFormat("yyyy-MM-dd HH:mm") : null;
        body.amount = await (0, util_1.currencyConverter)(body.amount);
        body.limit_amount = await (0, util_1.currencyConverter)(body.limit_amount);
        const { conciliation, ...body1 } = body;
        try {
            await FinAccount_1.default.query()
                .where('companies_id', authenticate.companies_id)
                .andWhere('id', params.id)
                .update(body1);
            await (0, finImages_1.uploadFinImage)(authenticate.companies_id, params.id, request);
            const data = await FinAccount_1.default.findOrFail(params.id);
            await data.load('finPaymentMethod');
            await data.load('finclass');
            await data.load('finemp');
            return response.status(201).send(data);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401, error);
        }
    }
    async createMany({ auth, request, response }) {
        await auth.use('api').authenticate();
        const { id, installment, date_due_installment } = request.only([
            'id',
            'installment',
            'date_due_installment'
        ]);
        try {
            const data = await FinAccount_1.default.query().where('id', id).firstOrFail();
            const { id: _id, date_conciliation: _date_conciliation, amount_paid: _amount_paid, ...basePayload } = data.$original;
            const parcelas = [];
            for (let i = 1; i <= installment; i++) {
                const dueDate = luxon_1.DateTime.fromISO(data.date_due)
                    .plus({ months: i })
                    .set({ day: date_due_installment });
                parcelas.push({
                    ...basePayload,
                    date_due: dueDate.toISODate(),
                    id_replication: _id,
                    replicate: true
                });
            }
            await FinAccount_1.default.createMany(parcelas);
            return response.status(201).send({ message: 'Parcelas criadas com sucesso' });
        }
        catch (error) {
            throw new BadRequestException_1.default('Erro ao criar parcelas', 400, error);
        }
    }
    async replicate({ auth, request, response }) {
        await auth.use('api').authenticate();
        const { idList } = request.only(['idList']);
        if (!Array.isArray(idList) || idList.length === 0) {
            throw new BadRequestException_1.default('Lista de IDs inválida ou vazia', 400);
        }
        try {
            const originalAccounts = await FinAccount_1.default.query()
                .whereIn('id', idList)
                .exec();
            const today = luxon_1.DateTime.now().toISODate();
            const accountList = originalAccounts.map((account) => {
                const payload = { ...account.$original };
                const id_replication = account.id;
                delete payload.id;
                const dueDate = luxon_1.DateTime.fromISO(account.date_due.toISO()).plus({ months: 1 }).toISODate();
                return {
                    ...payload,
                    date: today,
                    date_due: dueDate,
                    id_replication: id_replication
                };
            });
            await FinAccount_1.default.createMany(accountList);
            return response.status(201).send({ message: 'Parcelas replicadas com sucesso' });
        }
        catch (error) {
            console.error('Erro ao replicar contas:', error);
            throw new BadRequestException_1.default('Erro ao replicar contas', 400, error);
        }
    }
    async destroy({}) { }
}
exports.default = FinAccountsController;
//# sourceMappingURL=FinAccountsController.js.map