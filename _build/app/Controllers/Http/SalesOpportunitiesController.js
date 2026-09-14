"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const luxon_1 = require("luxon");
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const SalesOpportunity_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/SalesOpportunity"));
const SalesStage_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/SalesStage"));
const SalesOpportunityValidator_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Validators/SalesOpportunityValidator"));
class SalesOpportunitiesController {
    async authenticateSuperuser(auth) {
        const user = await auth.use('api').authenticate();
        if (!user.superuser)
            throw new BadRequestException_1.default('Acesso permitido somente a superusuários', 403, 'sales_forbidden');
    }
    async ensureActiveStage(stageId) {
        const stage = await SalesStage_1.default.query().where('id', stageId).first();
        if (!stage || !stage.active)
            throw new BadRequestException_1.default('Etapa de vendas inválida ou inativa', 422, 'sales_stage_inactive');
        return stage;
    }
    validateCompanyLink(companyId, stage) {
        if (companyId && stage.final_result !== 'won') {
            throw new BadRequestException_1.default('A empresa só pode ser vinculada quando a oportunidade estiver fechada como ganha', 422, 'sales_company_link_stage');
        }
    }
    async stages({ auth, response }) {
        await this.authenticateSuperuser(auth);
        return response.ok(await SalesStage_1.default.query().where('active', true).orderBy('position'));
    }
    async updateStage({ auth, request, response }) {
        await this.authenticateSuperuser(auth);
        const stage = await SalesStage_1.default.findOrFail(request.param('id'));
        stage.active = request.input('active') === true || request.input('active') === 1;
        await stage.save();
        return response.ok(stage);
    }
    async index({ auth, request, response }) {
        await this.authenticateSuperuser(auth);
        const query = SalesOpportunity_1.default.query().preload('stage').preload('company', q => q.select(['id', 'name']));
        const search = request.input('search');
        if (search)
            query.where(q => q.whereILike('name', `%${search}%`).orWhereILike('contact_name', `%${search}%`).orWhereILike('city', `%${search}%`));
        if (request.input('sales_stage_id'))
            query.where('sales_stage_id', request.input('sales_stage_id'));
        return response.ok(await query.orderBy('next_contact_date', 'asc').orderBy('name', 'asc'));
    }
    async funnel({ auth, response }) {
        await this.authenticateSuperuser(auth);
        const stages = await SalesStage_1.default.query().where('active', true).orderBy('position');
        const opportunities = await SalesOpportunity_1.default.query().preload('company', q => q.select(['id', 'name'])).orderBy('name');
        return response.ok(stages.map(stage => ({ ...stage.serialize(), opportunities: opportunities.filter(item => item.sales_stage_id === stage.id) })));
    }
    async followUps({ auth, request, response }) {
        await this.authenticateSuperuser(auth);
        const today = request.input('date') || luxon_1.DateTime.local().toISODate();
        const data = await SalesOpportunity_1.default.query().preload('stage').preload('company', q => q.select(['id', 'name']))
            .whereNotNull('next_contact_date').where('next_contact_date', '<=', today)
            .whereHas('stage', q => q.where('is_final', false)).orderBy('next_contact_date', 'asc');
        return response.ok(data);
    }
    async show({ auth, params, response }) {
        await this.authenticateSuperuser(auth);
        return response.ok(await SalesOpportunity_1.default.query().where('id', params.id).preload('stage').preload('company').firstOrFail());
    }
    async store({ auth, request, response }) {
        await this.authenticateSuperuser(auth);
        const body = await request.validate(SalesOpportunityValidator_1.default);
        const stage = await this.ensureActiveStage(body.sales_stage_id);
        this.validateCompanyLink(body.company_id, stage);
        return response.created(await SalesOpportunity_1.default.create(body));
    }
    async update({ auth, request, response }) {
        await this.authenticateSuperuser(auth);
        const body = await request.validate(SalesOpportunityValidator_1.default);
        const stage = await this.ensureActiveStage(body.sales_stage_id);
        this.validateCompanyLink(body.company_id, stage);
        const opportunity = await SalesOpportunity_1.default.findOrFail(request.param('id'));
        opportunity.merge(body);
        await opportunity.save();
        return response.ok(opportunity);
    }
    async destroy({ auth, params, response }) {
        await this.authenticateSuperuser(auth);
        await (await SalesOpportunity_1.default.findOrFail(params.id)).delete();
        return response.noContent();
    }
}
exports.default = SalesOpportunitiesController;
//# sourceMappingURL=SalesOpportunitiesController.js.map