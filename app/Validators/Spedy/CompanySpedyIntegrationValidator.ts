import { schema, CustomMessages, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class CompanySpedyIntegrationValidator {
  constructor(protected ctx: HttpContextContract) { }

  public schema = schema.create({
    environment: schema.enum.optional(['sandbox', 'production'] as const),
    spedyCompanyId: schema.string.nullableAndOptional({ trim: true }, [rules.maxLength(80)]),
    spedyApiKey: schema.string.nullableAndOptional({ trim: true }),
    isOwner: schema.boolean.optional(),
    active: schema.boolean.optional(),
    fetchCompany: schema.boolean.optional(),
  })

  public messages: CustomMessages = {
    required: 'O campo {{ field }} é obrigatório',
  }
}
