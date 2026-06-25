"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SecondcopyCertificate_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/SecondcopyCertificate"));
const SecondcopyCertificateValidator_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Validators/SecondcopyCertificateValidator"));
class SecondcopyCertificatesController {
    async index({ auth, request }) {
        await auth.use('api').authenticate();
        const user = auth.user;
        const companiesId = user.companiesId ?? user.companies_id;
        const page = request.input('page', 1);
        const perPage = request.input('perPage', 20);
        return SecondcopyCertificate_1.default.query()
            .where('companies_id', companiesId)
            .preload('documenttype')
            .preload('applicantPerson')
            .preload('registered1Person')
            .preload('registered2Person')
            .orderBy('id', 'desc')
            .paginate(page, perPage);
    }
    async show({ auth, params, response }) {
        await auth.use('api').authenticate();
        const user = auth.user;
        const companiesId = user.companiesId ?? user.companies_id;
        const item = await SecondcopyCertificate_1.default.query()
            .where('id', params.id)
            .where('companies_id', companiesId)
            .preload('documenttype')
            .preload('applicantPerson')
            .preload('registered1Person')
            .preload('registered2Person')
            .first();
        if (!item) {
            return response.notFound({ message: 'Registro não encontrado' });
        }
        return item;
    }
    async store({ auth, request, response }) {
        await auth.use('api').authenticate();
        const user = auth.user;
        const companiesId = user.companiesId ?? user.companies_id;
        const payload = await request.validate(SecondcopyCertificateValidator_1.default);
        const item = await SecondcopyCertificate_1.default.create({
            companiesId,
            ...payload,
        });
        return response.created(item);
    }
    async update({ auth, params, request, response }) {
        await auth.use('api').authenticate();
        const user = auth.user;
        const companiesId = user.companiesId ?? user.companies_id;
        const item = await SecondcopyCertificate_1.default.query()
            .where('id', params.id)
            .where('companies_id', companiesId)
            .first();
        if (!item) {
            return response.notFound({ message: 'Registro não encontrado' });
        }
        const payload = await request.validate(SecondcopyCertificateValidator_1.default);
        item.merge(payload);
        await item.save();
        return item;
    }
    async destroy({ auth, params, response }) {
        await auth.use('api').authenticate();
        const user = auth.user;
        const companiesId = user.companiesId ?? user.companies_id;
        const item = await SecondcopyCertificate_1.default.query()
            .where('id', params.id)
            .where('companies_id', companiesId)
            .first();
        if (!item) {
            return response.notFound({ message: 'Registro não encontrado' });
        }
        await item.delete();
        return response.ok({ message: 'Excluído com sucesso' });
    }
}
exports.default = SecondcopyCertificatesController;
//# sourceMappingURL=SecondcopyCertificatesController.js.map