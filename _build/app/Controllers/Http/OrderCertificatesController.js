"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const OrderCertificate_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/OrderCertificate"));
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class OrderCertificatesController {
    async index({ auth }) {
        const authenticate = await auth.use('api').authenticate();
        return await OrderCertificate_1.default.query()
            .preload('book', query => {
            query.select('id', 'name');
        })
            .preload('marriedCertificate', query => {
            query.select('id', 'groomPersonId', 'bridePersonId');
            query.preload('groom', query => {
                query.select('name');
            });
            query.preload('bride', query => {
                query.select('name');
            });
        })
            .where('companies_id', authenticate.companies_id)
            .orderBy('id', 'asc');
    }
    async show({ auth, params, response }) {
        await auth.use('api').authenticate();
        const orderCertificate = await OrderCertificate_1.default.find(params.id);
        if (!orderCertificate) {
            return response.notFound({ message: 'Pedido de certidão não encontrado' });
        }
        return orderCertificate;
    }
    async store({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const validationSchema = Validator_1.schema.create({
            typeCertificate: Validator_1.schema.number([
                Validator_1.rules.unsigned(),
            ]),
            certificateId: Validator_1.schema.number([
                Validator_1.rules.unsigned(),
            ]),
            bookId: Validator_1.schema.number()
        });
        const payload = await request.validate({ schema: validationSchema });
        const orderCertificate = await OrderCertificate_1.default.create({
            ...payload,
            companiesId: authenticate.companies_id,
        });
        return response.created(orderCertificate);
    }
    async update({ auth, params, request, response }) {
        await auth.use('api').authenticate();
        const orderCertificate = await OrderCertificate_1.default.find(params.id);
        if (!orderCertificate) {
            return response.notFound({ message: 'Pedido de certidão não encontrado' });
        }
        const validationSchema = Validator_1.schema.create({
            typeCertificate: Validator_1.schema.number.optional([
                Validator_1.rules.unsigned(),
            ]),
            certificateId: Validator_1.schema.number.optional([
                Validator_1.rules.unsigned(),
            ]),
            bookId: Validator_1.schema.number()
        });
        const payload = await request.validate({ schema: validationSchema });
        orderCertificate.merge(payload);
        await orderCertificate.save();
        return orderCertificate;
    }
}
exports.default = OrderCertificatesController;
//# sourceMappingURL=OrderCertificatesController.js.map