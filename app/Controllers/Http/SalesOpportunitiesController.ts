import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { DateTime } from 'luxon'
import BadRequest from 'App/Exceptions/BadRequestException'
import SalesOpportunity from 'App/Models/SalesOpportunity'
import SalesOpportunityActivity from 'App/Models/SalesOpportunityActivity'
import SalesStage from 'App/Models/SalesStage'
import User from 'App/Models/User'
import SalesOpportunityValidator from 'App/Validators/SalesOpportunityValidator'
import SalesOpportunityActivityValidator from 'App/Validators/SalesOpportunityActivityValidator'

export default class SalesOpportunitiesController {
  private async authenticateUser(auth: any) {
    return auth.use('api').authenticate()
  }

  private async ensureActiveStage(stageId: number) {
    const stage = await SalesStage.query().where('id', stageId).first()
    if (!stage || !stage.active) throw new BadRequest('Etapa de vendas inválida ou inativa', 422, 'sales_stage_inactive')
    return stage
  }

  private validateCompanyLink(companyId: number | null | undefined, stage: SalesStage) {
    if (companyId && stage.final_result !== 'won') {
      throw new BadRequest('A empresa só pode ser vinculada quando a oportunidade estiver fechada como ganha', 422, 'sales_company_link_stage')
    }
  }

  private async validateAssignedUser(user: User, assignedUserId: number | null | undefined) {
    if (!assignedUserId) return
    const assignedUser = await User.query().where('id', assignedUserId).where('companies_id', user.companies_id).first()
    if (!assignedUser) throw new BadRequest('O responsável deve pertencer à empresa do CRM', 422, 'sales_assigned_user_company')
  }

  private validateFollowUp(body: any, stage: SalesStage) {
    if (!stage.is_final && (!body.next_action || !body.next_contact_date || !body.assigned_user_id)) {
      throw new BadRequest('Oportunidades abertas precisam de próxima ação, data e responsável', 422, 'sales_follow_up_required')
    }
  }

  public async stages({ auth, response }: HttpContextContract) {
    await this.authenticateUser(auth)
    return response.ok(await SalesStage.query().where('active', true).orderBy('position'))
  }

  public async users({ auth, response }: HttpContextContract) {
    const user = await this.authenticateUser(auth)
    const query = User.query().select(['id', 'name', 'username'])
      .where('status', true)
      .where('companies_id', user.companies_id)
    return response.ok(await query.orderBy('name'))
  }

  public async updateStage({ auth, request, response }: HttpContextContract) {
    await this.authenticateUser(auth)
    const stage = await SalesStage.findOrFail(request.param('id'))
    stage.active = request.input('active') === true || request.input('active') === 1
    await stage.save()
    return response.ok(stage)
  }

  public async index({ auth, request, response }: HttpContextContract) {
    const user = await this.authenticateUser(auth)
    const query = SalesOpportunity.query().if(!user.superuser, q => q.where('companies_id', user.companies_id)).preload('stage').preload('assignedUser', q => q.select(['id', 'name'])).preload('company', q => q.select(['id', 'name']))
    const search = request.input('search')
    if (search) query.where(q => q.whereILike('name', `%${search}%`).orWhereILike('contact_name', `%${search}%`).orWhereILike('city', `%${search}%`))
    if (request.input('sales_stage_id')) query.where('sales_stage_id', request.input('sales_stage_id'))
    return response.ok(await query.orderBy('next_contact_date', 'asc').orderBy('name', 'asc'))
  }

  public async funnel({ auth, response }: HttpContextContract) {
    const user = await this.authenticateUser(auth)
    const stages = await SalesStage.query().where('active', true).orderBy('position')
    const opportunities = await SalesOpportunity.query().if(!user.superuser, q => q.where('companies_id', user.companies_id)).preload('assignedUser', q => q.select(['id', 'name'])).preload('company', q => q.select(['id', 'name'])).orderBy('name')
    return response.ok(stages.map(stage => ({ ...stage.serialize(), opportunities: opportunities.filter(item => item.sales_stage_id === stage.id) })))
  }

  public async followUps({ auth, request, response }: HttpContextContract) {
    const user = await this.authenticateUser(auth)
    const today = request.input('date') || DateTime.local().toISODate()
    const nextWeek = DateTime.fromISO(today).plus({ days: 7 }).toISODate()
    const data = await SalesOpportunity.query().if(!user.superuser, q => q.where('companies_id', user.companies_id)).preload('stage').preload('assignedUser', q => q.select(['id', 'name'])).preload('company', q => q.select(['id', 'name']))
      .where(q => q.whereNull('next_action').orWhereNull('next_contact_date').orWhereBetween('next_contact_date', [today, nextWeek]).orWhere('next_contact_date', '<', today))
      .whereHas('stage', q => q.where('is_final', false)).orderBy('next_contact_date', 'asc')
    return response.ok(data)
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const user = await this.authenticateUser(auth)
    return response.ok(await SalesOpportunity.query().where('id', params.id).if(!user.superuser, q => q.where('companies_id', user.companies_id)).preload('stage').preload('assignedUser', q => q.select(['id', 'name'])).preload('company').preload('activities', query => query.preload('user', userQuery => userQuery.select(['id', 'name'])).orderBy('activity_date', 'desc')).firstOrFail())
  }

  public async activities({ auth, params, response }: HttpContextContract) {
    const user = await this.authenticateUser(auth)
    await SalesOpportunity.query().where('id', params.id).if(!user.superuser, q => q.where('companies_id', user.companies_id)).firstOrFail()
    return response.ok(await SalesOpportunityActivity.query().where('sales_opportunity_id', params.id).preload('user', query => query.select(['id', 'name'])).orderBy('activity_date', 'desc'))
  }

  public async storeActivity({ auth, request, params, response }: HttpContextContract) {
    const user = await this.authenticateUser(auth)
    const opportunity = await SalesOpportunity.query().where('id', params.id).if(!user.superuser, q => q.where('companies_id', user.companies_id)).firstOrFail()
    const body = await request.validate(SalesOpportunityActivityValidator)
    const stage = await opportunity.related('stage').query().firstOrFail()
    const assignedUserId = body.assigned_user_id ?? opportunity.assigned_user_id
    await this.validateAssignedUser(user, assignedUserId)
    this.validateFollowUp({ ...opportunity.serialize(), ...body, assigned_user_id: assignedUserId }, stage)
    const { next_action, next_contact_date, assigned_user_id, ...activityBody } = body
    const activity = await SalesOpportunityActivity.create({ ...activityBody, sales_opportunity_id: opportunity.id, user_id: user.id })
    opportunity.last_contact_date = body.activity_date
    if (assigned_user_id !== undefined) opportunity.assigned_user_id = assigned_user_id
    if (next_action !== undefined) opportunity.next_action = next_action
    if (next_contact_date !== undefined) opportunity.next_contact_date = next_contact_date
    await opportunity.save()
    return response.created(await SalesOpportunityActivity.query().where('id', activity.id).preload('user', query => query.select(['id', 'name'])).firstOrFail())
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const user = await this.authenticateUser(auth)
    const body = await request.validate(SalesOpportunityValidator)
    const stage = await this.ensureActiveStage(body.sales_stage_id)
    this.validateCompanyLink(body.company_id, stage)
    await this.validateAssignedUser(user, body.assigned_user_id)
    this.validateFollowUp(body, stage)
    return response.created(await SalesOpportunity.create({ ...body, companies_id: user.companies_id } as any))
  }

  public async update({ auth, request, response }: HttpContextContract) {
    const user = await this.authenticateUser(auth)
    const body = await request.validate(SalesOpportunityValidator)
    const stage = await this.ensureActiveStage(body.sales_stage_id)
    this.validateCompanyLink(body.company_id, stage)
    await this.validateAssignedUser(user, body.assigned_user_id)
    this.validateFollowUp(body, stage)
    const opportunity = await SalesOpportunity.query().where('id', request.param('id')).if(!user.superuser, q => q.where('companies_id', user.companies_id)).firstOrFail()
    opportunity.merge(body as any)
    await opportunity.save()
    return response.ok(opportunity)
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    const user = await this.authenticateUser(auth)
    await (await SalesOpportunity.query().where('id', params.id).if(!user.superuser, q => q.where('companies_id', user.companies_id)).firstOrFail()).delete()
    return response.noContent()
  }
}
