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
function toUTCISO(dateStr) {
    return dateStr ? luxon_1.DateTime.fromISO(dateStr).toUTC().toISO() : null;
}
class FinAccountsController {
    async index({ auth, request, response }) {
        const user = await auth.use('api').authenticate();
        const body = request.qs();
        try {
            const query = FinAccount_1.default.query()
                .where('companies_id', user.companies_id)
                .where('excluded', false)
                .preload('finclass', q => q.select('description'))
                .preload('finemp', q => q.select('name'))
                .preload('finPaymentMethod', q => q.select('description'));
            query.if(body.description, q => q.where('description', 'like', `%${body.description}%`));
            query.if(body.fin_emp_id, q => q.where('fin_emp_id', body.fin_emp_id));
            query.if(body.fin_class_id, q => q.where('fin_class_id', body.fin_class_id));
            query.if(body.cost, q => q.where('cost', body.cost));
            query.if(body.payment_method, q => q.where('payment_method', body.payment_method));
            query.if(body.ir === 'true', q => q.where('ir', true));
            query.if(body.debit_credit, q => q.where('debit_credit', body.debit_credit));
            query.if(body.fin_paymentmethod_id, q => q.where('fin_paymentmethod_id', body.fin_paymentmethod_id));
            if (body.date_start && body.date_end && body.typeDate) {
                const start = luxon_1.DateTime.fromISO(body.date_start).toUTC().toISO();
                const end = luxon_1.DateTime.fromISO(body.date_end).toUTC().endOf('day').toISO();
                const dateColumnMap = {
                    DATE: 'date',
                    DATE_DUE: 'date_due',
                    DATE_CONCILIATION: 'date_conciliation',
                };
                const dateColumn = dateColumnMap[body.typeDate];
                if (dateColumn) {
                    query.where(dateColumn, '>=', start).where(dateColumn, '<=', end);
                }
            }
            if (body.isReconciled === 'C') {
                query.where('amount_paid', '>', 0);
            }
            else if (body.isReconciled === 'N') {
                query.whereNull('amount_paid');
            }
            const data = await query;
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
            console.log("PPPP", body.date);
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
            body1.amount_paid = body.amount;
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
        const authenticate = await auth.use('api').authenticate();
        const body = await request.validate(FinAccountUpdateValidator_1.default);
        body.date = body.date?.toJSDate();
        body.date_due = body.date_due?.toJSDate();
        body.data_billing = body.data_billing?.toJSDate();
        body.date_conciliation = body.date_conciliation?.toJSDate();
        body.amount = body.amount ? await (0, util_1.currencyConverter)(body.amount) : null;
        body.amount_paid = !isNaN(body.amount_paid) || body.amount_paid ? await (0, util_1.currencyConverter)(body.amount_paid) : null;
        const { conciliation, ...body1 } = body;
        if (conciliation === true) {
            body1.amount_paid = body.amount;
            body1.date_conciliation = body.date_due;
        }
        try {
            await FinAccount_1.default.query()
                .where('companies_id', authenticate.companies_id)
                .andWhere('id', params.id)
                .update(body1);
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
        console.log("CREATE MANY ....");
        const authenticate = await auth.use('api').authenticate();
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
    async destroy({}) { }
}
exports.default = FinAccountsController;
//# sourceMappingURL=FinAccountsController.js.map