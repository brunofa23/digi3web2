// app/Validators/ServiceValidator.ts
import { schema, rules } from '@ioc:Adonis/Core/Validator'

export default class ServiceValidator {
  public schema = schema.create({
    // companies_id NÃO vem do front (normalmente vem do auth)
    // se você quiser aceitar no payload, descomente:
    // companiesId: schema.number([rules.unsigned()]),

    name: schema.string({ trim: true }, [
      rules.maxLength(50),
    ]),

    description: schema.string.optional({ trim: true }, [
      rules.maxLength(255),
    ]),

    free: schema.boolean.optional(),

    inactive: schema.boolean.optional(),
  })

  public messages = {
    'name.required': 'Nome é obrigatório',
    'name.maxLength': 'Nome deve ter no máximo 50 caracteres',

    'description.maxLength': 'Descrição deve ter no máximo 255 caracteres',

    'inactive.boolean': 'Inactive deve ser booleano',
  }
}
