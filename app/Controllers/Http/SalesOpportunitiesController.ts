import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { DateTime } from 'luxon'
import BadRequest from 'App/Exceptions/BadRequestException'
import SalesOpportunity from 'App/Models/SalesOpportunity'
import SalesStage from 'App/Models/SalesStage'
import SalesOpportunityValidator from 'App/Validators/SalesOpportunityValidator'

export default class SalesOpportunitiesController {
  private async authenticateSuperuser(auth: any) {
    const user = await auth.use('api').authenticate()
    if (!user.superuser) throw new BadRequest('Acesso permitido somente a superusuários', 403, 'sales_forbidden')
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

  public async stages({ auth, response }: HttpContextContract) {
    await this.authenticateSuperuser(auth)
    return response.ok(await SalesStage.query().where('active', true).orderBy('position'))
  }

  public async updateStage({ auth, request, response }: HttpContextContract) {
    await this.authenticateSuperuser(auth)
    const stage = await SalesStage.findOrFail(request.param('id'))
    stage.active = request.input('active') === true || request.input('active') === 1
    await stage.save()
    return response.ok(stage)
  }

  public async index({ auth, request, response }: HttpContextContract) {
    await this.authenticateSuperuser(auth)
    const query = SalesOpportunity.query().preload('stage').preload('company', q => q.select(['id', 'name']))
    const search = request.input('search')
    if (search) query.where(q => q.whereILike('name', `%${search}%`).orWhereILike('contact_name', `%${search}%`).orWhereILike('city', `%${search}%`))
    if (request.input('sales_stage_id')) query.where('sales_stage_id', request.input('sales_stage_id'))
    return response.ok(await query.orderBy('next_contact_date', 'asc').orderBy('name', 'asc'))
  }

  public async funnel({ auth, response }: HttpContextContract) {
    await this.authenticateSuperuser(auth)
    const stages = await SalesStage.query().where('active', true).orderBy('position')
    const opportunities = await SalesOpportunity.query().preload('company', q => q.select(['id', 'name'])).orderBy('name')
    return response.ok(stages.map(stage => ({ ...stage.serialize(), opportunities: opportunities.filter(item => item.sales_stage_id === stage.id) })))
  }

  public async followUps({ auth, request, response }: HttpContextContract) {
    await this.authenticateSuperuser(auth)
    const today = request.input('date') || DateTime.local().toISODate()
    const data = await SalesOpportunity.query().preload('stage').preload('company', q => q.select(['id', 'name']))
      .whereNotNull('next_contact_date').where('next_contact_date', '<=', today)
      .whereHas('stage', q => q.where('is_final', false)).orderBy('next_contact_date', 'asc')
    return response.ok(data)
  }

  public async show({ auth, params, response }: HttpContextContract) {
    await this.authenticateSuperuser(auth)
    return response.ok(await SalesOpportunity.query().where('id', params.id).preload('stage').preload('company').firstOrFail())
  }

  public async store({ auth, request, response }: HttpContextContract) {
    await this.authenticateSuperuser(auth)
    const body = await request.validate(SalesOpportunityValidator)
    const stage = await this.ensureActiveStage(body.sales_stage_id)
    this.validateCompanyLink(body.company_id, stage)
    return response.created(await SalesOpportunity.create(body as any))
  }

  public async update({ auth, request, response }: HttpContextContract) {
    await this.authenticateSuperuser(auth)
    const body = await request.validate(SalesOpportunityValidator)
    const stage = await this.ensureActiveStage(body.sales_stage_id)
    this.validateCompanyLink(body.company_id, stage)
    const opportunity = await SalesOpportunity.findOrFail(request.param('id'))
    opportunity.merge(body as any)
    await opportunity.save()
    return response.ok(opportunity)
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    await this.authenticateSuperuser(auth)
    await (await SalesOpportunity.findOrFail(params.id)).delete()
    return response.noContent()
  }
}
