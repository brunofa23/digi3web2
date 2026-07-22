import { schema, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class SpedyCompanySettingsValidator {
  constructor(protected ctx: HttpContextContract) { }

  public schema = schema.create({
    general: schema.object.optional().anyMembers(),
    productInvoice: schema.object.optional().anyMembers(),
    consumerInvoice: schema.object.optional().anyMembers(),
    serviceInvoice: schema.object.optional().anyMembers(),
  })

  public messages: CustomMessages = {
    required: 'O campo {{ field }} é obrigatório',
  }
}
