import { schema, CustomMessages, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class SpedyServiceInvoiceDefaultsValidator {
  constructor(protected ctx: HttpContextContract) { }

  public schema = schema.create({
    description: schema.string.nullableAndOptional({ trim: true }),
    sendEmailToCustomer: schema.boolean.optional(),
    cnaeCode: schema.string.nullableAndOptional({ trim: true }),
    federalServiceCode: schema.string.nullableAndOptional({ trim: true }, [rules.maxLength(20)]),
    cityServiceCode: schema.string.nullableAndOptional({ trim: true }, [rules.maxLength(40)]),
    nbsCode: schema.string.nullableAndOptional({ trim: true }, [rules.maxLength(20)]),
    taxationType: schema.string.nullableAndOptional({ trim: true }, [rules.maxLength(60)]),
    taxLocation: schema.string.nullableAndOptional({ trim: true }, [rules.maxLength(60)]),
    issRate: schema.number.nullableAndOptional(),
  })

  public messages: CustomMessages = {
    required: 'O campo {{ field }} é obrigatório',
  }
}
