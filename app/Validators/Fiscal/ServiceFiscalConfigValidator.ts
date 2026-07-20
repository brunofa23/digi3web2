import { schema, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class ServiceFiscalConfigValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    serviceId: schema.number([
      rules.unsigned(),
      rules.exists({ table: 'services', column: 'id' }),
    ]),
    federalServiceCode: schema.string.nullableAndOptional({ trim: true }, [rules.maxLength(20)]),
    cityServiceCode: schema.string.nullableAndOptional({ trim: true }, [rules.maxLength(30)]),
    nbsCode: schema.string.nullableAndOptional({ trim: true }, [rules.maxLength(20)]),
    taxationType: schema.string.nullableAndOptional({ trim: true }, [rules.maxLength(60)]),
    issRate: schema.number.nullableAndOptional(),
    issWithheld: schema.boolean.optional(),
    descriptionTemplate: schema.string.nullableAndOptional({ trim: true }),
    enabled: schema.boolean.optional(),
  })

  public messages = {
    'serviceId.required': 'Serviço é obrigatório',
    'serviceId.exists': 'Serviço não encontrado',
  }
}
