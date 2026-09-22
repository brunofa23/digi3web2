"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Person_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Person"));
const PersonValidator_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Validators/PersonValidator"));
class PeopleController {
    async index({ request, auth }) {
        await auth.use('api').authenticate();
        const user = auth.user;
        const companiesId = user.companiesId ?? user.companies_id;
        const page = Number(request.input('page', 1));
        const perPage = Math.min(Number(request.input('perPage', 10)), 100);
        const q = request.input('q');
        const cpf = request.input('cpf');
        const email = request.input('email');
        const inactive = request.input('inactive');
        const query = Person_1.default.query()
            .where('companies_id', companiesId)
            .orderBy('id', 'desc');
        if (q) {
            query.where((qb) => {
                qb.where('name', 'like', `%${q}%`)
                    .orWhere('cpf', 'like', `%${q}%`)
                    .orWhere('email', 'like', `%${q}%`);
            });
        }
        if (cpf) {
            query.where('cpf', cpf);
        }
        if (email) {
            query.where('email', 'like', `%${email}%`);
        }
        if (typeof inactive !== 'undefined') {
            const inactiveBool = typeof inactive === 'string' ? inactive === 'true' : Boolean(inactive);
            query.where('inactive', inactiveBool);
        }
        if (cpf) {
            return query.first();
        }
        return await query.paginate(page, perPage);
    }
    async show({ params, auth, response }) {
        await auth.use('api').authenticate();
        const user = auth.user;
        const companiesId = user.companiesId ?? user.companies_id;
        const person = await Person_1.default.query()
            .where('companies_id', companiesId)
            .where('id', params.id)
            .first();
        if (!person)
            return response.notFound({ message: 'Pessoa não encontrada' });
        return person;
    }
    async store({ request, auth, response }) {
        await auth.use('api').authenticate();
        const user = auth.user;
        const companiesId = user.companiesId ?? user.companies_id;
        const payload = await request.validate(PersonValidator_1.default);
        const person = await Person_1.default.create({
            ...payload,
            companiesId,
        });
        return response.created(person);
    }
    async update({ params, request, auth, response }) {
        await auth.use('api').authenticate();
        const user = auth.user;
        const companiesId = user.companiesId ?? user.companies_id;
        const person = await Person_1.default.query()
            .where('companies_id', companiesId)
            .where('id', params.id)
            .first();
        if (!person)
            return response.notFound({ message: 'Pessoa não encontrada' });
        const payload = await request.validate(PersonValidator_1.default);
        person.merge(payload);
        await person.save();
        return person;
    }
    async destroy({ params, auth, response }) {
        await auth.use('api').authenticate();
        const user = auth.user;
        const companiesId = user.companiesId ?? user.companies_id;
        const person = await Person_1.default.query()
            .where('companies_id', companiesId)
            .where('id', params.id)
            .first();
        if (!person)
            return response.notFound({ message: 'Pessoa não encontrada' });
        await person.delete();
        return response.ok({ message: 'Pessoa removida com sucesso' });
    }
}
exports.default = PeopleController;
//# sourceMappingURL=PeopleController.js.map