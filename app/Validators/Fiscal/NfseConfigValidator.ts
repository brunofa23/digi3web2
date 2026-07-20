import { schema, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class NfseConfigValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    environment: schema.enum(['sandbox', 'production'] as const),
    spedyCompanyId: schema.string.nullableAndOptional({ trim: true }, [rules.maxLength(60)]),
    spedyApiKey: schema.string.nullableAndOptional({ trim: true }),
    enabled: schema.boolean.optional(),
    taxRegime: schema.string.nullableAndOptional({ trim: true }, [rules.maxLength(60)]),
    stateTaxNumber: schema.string.nullableAndOptional({ trim: true }, [rules.maxLength(30)]),
    cityTaxNumber: schema.string.nullableAndOptional({ trim: true }, [rules.maxLength(30)]),
    economicActivityCode: schema.string.nullableAndOptional({ trim: true }, [rules.maxLength(20)]),
    cityIbgeCode: schema.string.nullableAndOptional({ trim: true }, [
      rules.maxLength(7),
      rules.regex(/^\d{7}$/),
    ]),
    defaultFederalServiceCode: schema.string.nullableAndOptional({ trim: true }, [rules.maxLength(20)]),
    defaultCityServiceCode: schema.string.nullableAndOptional({ trim: true }, [rules.maxLength(30)]),
    defaultNbsCode: schema.string.nullableAndOptional({ trim: true }, [rules.maxLength(20)]),
    defaultIssRate: schema.number.nullableAndOptional(),
    defaultTaxationType: schema.string.nullableAndOptional({ trim: true }, [rules.maxLength(60)]),
  })

  public messages = {
    'environment.required': 'Ambiente é obrigatório',
    'environment.enum': 'Ambiente inválido',
    'cityIbgeCode.regex': 'Código IBGE deve conter 7 dígitos',
  }
}
