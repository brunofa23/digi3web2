import { schema, CustomMessages, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class SpedyServiceInvoiceValidator {
  constructor(protected ctx: HttpContextContract) { }

  public schema = schema.create({
    integrationId: schema.string.optional({ trim: true }, [rules.maxLength(36)]),
    effectiveDate: schema.date.optional(),
    description: schema.string({ trim: true }),
    amount: schema.number(),
    sendEmailToCustomer: schema.boolean.optional(),
    cnaeCode: schema.string.nullableAndOptional({ trim: true }),
    federalServiceCode: schema.string.nullableAndOptional({ trim: true }),
    cityServiceCode: schema.string.nullableAndOptional({ trim: true }),
    nbsCode: schema.string.nullableAndOptional({ trim: true }),
    taxationType: schema.string.nullableAndOptional({ trim: true }),
    taxLocation: schema.string.nullableAndOptional({ trim: true }),
    issRate: schema.number.nullableAndOptional(),
    receiver: schema.object.optional().members({
      name: schema.string.nullableAndOptional({ trim: true }),
      federalTaxNumber: schema.string.nullableAndOptional({ trim: true }),
      cityTaxNumber: schema.string.nullableAndOptional({ trim: true }),
      email: schema.string.nullableAndOptional({ trim: true }, [rules.email()]),
      phoneNumber: schema.string.nullableAndOptional({ trim: true }),
      address: schema.object.optional().members({
        street: schema.string.nullableAndOptional({ trim: true }),
        number: schema.string.nullableAndOptional({ trim: true }),
        district: schema.string.nullableAndOptional({ trim: true }),
        postalCode: schema.string.nullableAndOptional({ trim: true }),
        additionalInformation: schema.string.nullableAndOptional({ trim: true }),
        city: schema.object.optional().members({
          code: schema.number.nullableAndOptional(),
          name: schema.string.nullableAndOptional({ trim: true }),
          state: schema.string.nullableAndOptional({ trim: true }, [rules.maxLength(2)]),
        }),
      }),
    }),
    location: schema.object.optional().members({
      code: schema.number.nullableAndOptional(),
      name: schema.string.nullableAndOptional({ trim: true }),
      state: schema.string.nullableAndOptional({ trim: true }, [rules.maxLength(2)]),
    }),
  })

  public messages: CustomMessages = {
    required: 'O campo {{ field }} é obrigatório',
  }
}
