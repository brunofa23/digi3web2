"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const luxon_1 = require("luxon");
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const SalesOpportunity_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/SalesOpportunity"));
const SalesOpportunityActivity_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/SalesOpportunityActivity"));
const SalesStage_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/SalesStage"));
const User_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/User"));
const SalesOpportunityValidator_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Validators/SalesOpportunityValidator"));
const SalesOpportunityActivityValidator_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Validators/SalesOpportunityActivityValidator"));
class SalesOpportunitiesController {
    async authenticateUser(auth) {
        return auth.use('api').authenticate();
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
    async validateAssignedUser(user, assignedUserId) {
        if (!assignedUserId)
            return;
        const assignedUser = await User_1.default.query().where('id', assignedUserId).where('companies_id', user.companies_id).first();
        if (!assignedUser)
            throw new BadRequestException_1.default('O responsável deve pertencer à empresa do CRM', 422, 'sales_assigned_user_company');
    }
    validateFollowUp(body, stage) {
        if (!stage.is_final && (!body.next_action || !body.next_contact_date || !body.assigned_user_id)) {
            throw new BadRequestException_1.default('Oportunidades abertas precisam de próxima ação, data e responsável', 422, 'sales_follow_up_required');
        }
    }
    async stages({ auth, response }) {
        await this.authenticateUser(auth);
        return response.ok(await SalesStage_1.default.query().where('active', true).orderBy('position'));
    }
    async users({ auth, response }) {
        const user = await this.authenticateUser(auth);
        const query = User_1.default.query().select(['id', 'name', 'username'])
            .where('status', true)
            .where('companies_id', user.companies_id);
        return response.ok(await query.orderBy('name'));
    }
    async updateStage({ auth, request, response }) {
        await this.authenticateUser(auth);
        const stage = await SalesStage_1.default.findOrFail(request.param('id'));
        stage.active = request.input('active') === true || request.input('active') === 1;
        await stage.save();
        return response.ok(stage);
    }
    async index({ auth, request, response }) {
        const user = await this.authenticateUser(auth);
        const query = SalesOpportunity_1.default.query().if(!user.superuser, q => q.where('companies_id', user.companies_id)).preload('stage').preload('assignedUser', q => q.select(['id', 'name'])).preload('company', q => q.select(['id', 'name']));
        const search = request.input('search');
        if (search)
            query.where(q => q.whereILike('name', `%${search}%`).orWhereILike('contact_name', `%${search}%`).orWhereILike('city', `%${search}%`));
        if (request.input('sales_stage_id'))
            query.where('sales_stage_id', request.input('sales_stage_id'));
        return response.ok(await query.orderBy('next_contact_date', 'asc').orderBy('name', 'asc'));
    }
    async funnel({ auth, response }) {
        const user = await this.authenticateUser(auth);
        const stages = await SalesStage_1.default.query().where('active', true).orderBy('position');
        const opportunities = await SalesOpportunity_1.default.query().if(!user.superuser, q => q.where('companies_id', user.companies_id)).preload('assignedUser', q => q.select(['id', 'name'])).preload('company', q => q.select(['id', 'name'])).orderBy('name');
        return response.ok(stages.map(stage => ({ ...stage.serialize(), opportunities: opportunities.filter(item => item.sales_stage_id === stage.id) })));
    }
    async followUps({ auth, request, response }) {
        const user = await this.authenticateUser(auth);
        const today = request.input('date') || luxon_1.DateTime.local().toISODate();
        const nextWeek = luxon_1.DateTime.fromISO(today).plus({ days: 7 }).toISODate();
        const data = await SalesOpportunity_1.default.query().if(!user.superuser, q => q.where('companies_id', user.companies_id)).preload('stage').preload('assignedUser', q => q.select(['id', 'name'])).preload('company', q => q.select(['id', 'name']))
            .where(q => q.whereNull('next_action').orWhereNull('next_contact_date').orWhereBetween('next_contact_date', [today, nextWeek]).orWhere('next_contact_date', '<', today))
            .whereHas('stage', q => q.where('is_final', false)).orderBy('next_contact_date', 'asc');
        return response.ok(data);
    }
    async show({ auth, params, response }) {
        const user = await this.authenticateUser(auth);
        return response.ok(await SalesOpportunity_1.default.query().where('id', params.id).if(!user.superuser, q => q.where('companies_id', user.companies_id)).preload('stage').preload('assignedUser', q => q.select(['id', 'name'])).preload('company').preload('activities', query => query.preload('user', userQuery => userQuery.select(['id', 'name'])).orderBy('activity_date', 'desc')).firstOrFail());
    }
    async activities({ auth, params, response }) {
        const user = await this.authenticateUser(auth);
        await SalesOpportunity_1.default.query().where('id', params.id).if(!user.superuser, q => q.where('companies_id', user.companies_id)).firstOrFail();
        return response.ok(await SalesOpportunityActivity_1.default.query().where('sales_opportunity_id', params.id).preload('user', query => query.select(['id', 'name'])).orderBy('activity_date', 'desc'));
    }
    async storeActivity({ auth, request, params, response }) {
        const user = await this.authenticateUser(auth);
        const opportunity = await SalesOpportunity_1.default.query().where('id', params.id).if(!user.superuser, q => q.where('companies_id', user.companies_id)).firstOrFail();
        const body = await request.validate(SalesOpportunityActivityValidator_1.default);
        const stage = await opportunity.related('stage').query().firstOrFail();
        const assignedUserId = body.assigned_user_id ?? opportunity.assigned_user_id;
        await this.validateAssignedUser(user, assignedUserId);
        this.validateFollowUp({ ...opportunity.serialize(), ...body, assigned_user_id: assignedUserId }, stage);
        const { next_action, next_contact_date, assigned_user_id, ...activityBody } = body;
        const activity = await SalesOpportunityActivity_1.default.create({ ...activityBody, sales_opportunity_id: opportunity.id, user_id: user.id });
        opportunity.last_contact_date = body.activity_date;
        if (assigned_user_id !== undefined)
            opportunity.assigned_user_id = assigned_user_id;
        if (next_action !== undefined)
            opportunity.next_action = next_action;
        if (next_contact_date !== undefined)
            opportunity.next_contact_date = next_contact_date;
        await opportunity.save();
        return response.created(await SalesOpportunityActivity_1.default.query().where('id', activity.id).preload('user', query => query.select(['id', 'name'])).firstOrFail());
    }
    async store({ auth, request, response }) {
        const user = await this.authenticateUser(auth);
        const body = await request.validate(SalesOpportunityValidator_1.default);
        const stage = await this.ensureActiveStage(body.sales_stage_id);
        this.validateCompanyLink(body.company_id, stage);
        await this.validateAssignedUser(user, body.assigned_user_id);
        this.validateFollowUp(body, stage);
        return response.created(await SalesOpportunity_1.default.create({ ...body, companies_id: user.companies_id }));
    }
    async update({ auth, request, response }) {
        const user = await this.authenticateUser(auth);
        const body = await request.validate(SalesOpportunityValidator_1.default);
        const stage = await this.ensureActiveStage(body.sales_stage_id);
        this.validateCompanyLink(body.company_id, stage);
        await this.validateAssignedUser(user, body.assigned_user_id);
        this.validateFollowUp(body, stage);
        const opportunity = await SalesOpportunity_1.default.query().where('id', request.param('id')).if(!user.superuser, q => q.where('companies_id', user.companies_id)).firstOrFail();
        opportunity.merge(body);
        await opportunity.save();
        return response.ok(opportunity);
    }
    async destroy({ auth, params, response }) {
        const user = await this.authenticateUser(auth);
        await (await SalesOpportunity_1.default.query().where('id', params.id).if(!user.superuser, q => q.where('companies_id', user.companies_id)).firstOrFail()).delete();
        return response.noContent();
    }
}
exports.default = SalesOpportunitiesController;
//# sourceMappingURL=SalesOpportunitiesController.js.map