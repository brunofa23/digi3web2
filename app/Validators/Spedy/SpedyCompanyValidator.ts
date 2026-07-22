import { schema, CustomMessages, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class SpedyCompanyValidator {
  constructor(protected ctx: HttpContextContract) { }

  public schema = schema.create({
    name: schema.string({ trim: true }, [rules.maxLength(120)]),
    legalName: schema.string.optional({ trim: true }, [rules.maxLength(120)]),
    federalTaxNumber: schema.string({ trim: true }, [rules.maxLength(14)]),
    stateTaxNumber: schema.string.nullableAndOptional({ trim: true }, [rules.maxLength(30)]),
    cityTaxNumber: schema.string.nullableAndOptional({ trim: true }, [rules.maxLength(30)]),
    email: schema.string.nullableAndOptional({ trim: true }, [rules.email()]),
    phone: schema.string.nullableAndOptional({ trim: true }, [rules.maxLength(20)]),
    address: schema.object.optional().members({
      street: schema.string.optional({ trim: true }),
      number: schema.string.optional({ trim: true }),
      district: schema.string.optional({ trim: true }),
      postalCode: schema.string.optional({ trim: true }),
      additionalInformation: schema.string.nullableAndOptional({ trim: true }),
      city: schema.object.optional().members({
        code: schema.string.nullableAndOptional({ trim: true }),
        name: schema.string.nullableAndOptional({ trim: true }),
        state: schema.string.nullableAndOptional({ trim: true }, [rules.maxLength(2)]),
      }),
    }),
    taxRegime: schema.enum.optional([
      'simplesNacional',
      'simplesNacionalExcessoSublimite',
      'simplesNacionalMEI',
      'regimeNormal',
    ] as const),
    economicActivities: schema.array.optional().members(
      schema.object().members({
        code: schema.string({ trim: true }),
        isMain: schema.boolean.optional(),
      })
    ),
  })

  public messages: CustomMessages = {
    required: 'O campo {{ field }} é obrigatório',
  }
}
