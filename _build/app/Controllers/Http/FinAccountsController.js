"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const FinAccount_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/FinAccount"));
const util_1 = global[Symbol.for('ioc.use')]("App/Services/util");
const finImages_1 = global[Symbol.for('ioc.use')]("App/Services/uploadFinImage/finImages");
const luxon_1 = require("luxon");
class FinAccountsController {
    async index({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const body = request.qs();
        try {
            const query = FinAccount_1.default.query()
                .where('companies_id', authenticate.companies_id)
                .where('excluded', false)
                .preload('finclass', query => {
                query.select('description');
            })
                .preload('finemp', query => {
                query.select('name');
            })
                .preload('finPaymentMethod', query => {
                query.select('description');
            });
            if (body.description)
                query.where('description', 'like', `${body.description}`);
            if (body.fin_emp_id)
                query.where('fin_emp_id', body.fin_emp_id);
            if (body.fin_class_id)
                query.where('fin_class_id', body.fin_class_id);
            if (body.date_start)
                query.where('created_at', '>=', body.date_start);
            if (body.date_end)
                query.where('created_at', '<=', body.date_end);
            if (body.cost)
                query.where('cost', body.cost);
            if (body.payment_method)
                query.where('payment_method', body.payment_method);
            if (body.ir === 'true')
                query.where('ir', true);
            if (body.debit_credit)
                query.where('debit_credit', body.debit_credit);
            if (body.fin_paymentmethod_id)
                query.where('fin_paymentmethod_id', body.fin_paymentmethod_id);
            const data = await query;
            return response.status(200).send(data);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401, error);
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
        const body = request.only(FinAccount_1.default.fillable);
        const body2 = {
            ...body,
            companies_id: authenticate.companies_id,
            ir: body.ir === 'false' ? 0 : 1,
            replicate: body.replicate === 'false' ? 0 : 1
        };
        try {
            const data = await FinAccount_1.default.create(body2);
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
        const body = request.only(FinAccount_1.default.fillable);
        const body2 = {
            ...body,
            amount: body.amount ? await (0, util_1.currencyConverter)(body.amount) : null,
            amount_paid: body.amount_paid ? await (0, util_1.currencyConverter)(body.amount_paid) : null,
            excluded: body.excluded == 'false' ? false : true,
            ir: body.ir === 'false' ? 0 : 1,
            replicate: body.replicate === 'false' ? 0 : 1
        };
        try {
            const data = await FinAccount_1.default.query()
                .where('companies_id', authenticate.companies_id)
                .andWhere('id', params.id)
                .update(body2);
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
            const { id: _id, ...basePayload } = data.$original;
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