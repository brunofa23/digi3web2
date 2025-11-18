"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const MarriedCertificate_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/MarriedCertificate"));
const MarriedCertificateValidator_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Validators/MarriedCertificateValidator"));
class MarriedCertificatesController {
    async index({ request, auth }) {
        await auth.use('api').authenticate();
        const user = auth.user;
        const companiesId = user.companiesId ?? user.companies_id;
        const page = Number(request.input('page', 1));
        const perPage = Math.min(Number(request.input('perPage', 10)), 100);
        const statusId = request.input('statusId');
        const type = request.input('type');
        const prenup = request.input('prenup');
        const dateFrom = request.input('dateFrom');
        const dateTo = request.input('dateTo');
        const query = MarriedCertificate_1.default.query()
            .where('companies_id', companiesId)
            .orderBy('id', 'desc');
        if (statusId)
            query.where('status_id', statusId);
        if (type)
            query.where('type', 'like', `%${type}%`);
        if (typeof prenup !== 'undefined') {
            const prenupBool = typeof prenup === 'string' ? prenup === 'true' : Boolean(prenup);
            query.where('prenup', prenupBool);
        }
        if (dateFrom)
            query.whereRaw('DATE(dthr_marriage) >= ?', [dateFrom]);
        if (dateTo)
            query.whereRaw('DATE(dthr_marriage) <= ?', [dateTo]);
        return await query.paginate(page, perPage);
    }
    async show({ params, auth, response }) {
        await auth.use('api').authenticate();
        const user = auth.user;
        const companiesId = user.companiesId ?? user.companies_id;
        const item = await MarriedCertificate_1.default.query()
            .where('companies_id', companiesId)
            .where('id', params.id)
            .preload('groom')
            .preload('fatherGroom')
            .preload('motherGroom')
            .preload('bride')
            .preload('fatherBride')
            .preload('motherBride')
            .preload('witness1')
            .preload('witness2')
            .preload('status')
            .first();
        if (!item) {
            return response.notFound({ message: 'Registro não encontrado' });
        }
        return item;
    }
    async store({ request, auth, response }) {
        await auth.use('api').authenticate();
        const user = auth.user;
        const companiesId = user.companiesId ?? user.companies_id;
        const payload = await request.validate(MarriedCertificateValidator_1.default);
        const item = await MarriedCertificate_1.default.create({
            ...payload,
            companiesId,
            usrId: user.id
        });
        return response.created(item);
    }
    async update({ params, request, auth, response }) {
        await auth.use('api').authenticate();
        const user = auth.user;
        const companiesId = user.companiesId ?? user.companies_id;
        const item = await MarriedCertificate_1.default.query()
            .where('companies_id', companiesId)
            .where('id', params.id)
            .first();
        if (!item) {
            return response.notFound({ message: 'Registro não encontrado' });
        }
        const payload = await request.validate(MarriedCertificateValidator_1.default);
        item.merge({
            ...payload,
        });
        await item.save();
        return item;
    }
    async destroy({ params, auth, response }) {
        await auth.use('api').authenticate();
        const user = auth.user;
        const companiesId = user.companiesId ?? user.companies_id;
        const item = await MarriedCertificate_1.default.query()
            .where('companies_id', companiesId)
            .where('id', params.id)
            .first();
        if (!item) {
            return response.notFound({ message: 'Registro não encontrado' });
        }
        await item.delete();
        return response.ok({ message: 'Registro removido com sucesso' });
    }
}
exports.default = MarriedCertificatesController;
//# sourceMappingURL=MarriedCertificatesController.js.map