import { schema, rules } from '@ioc:Adonis/Core/Validator'

export default class DocumentTypeBookValidator {
  public schema = schema.create({
    companies_id: schema.number([
      rules.required(),
    ]),

    description: schema.string({}, [
      rules.required(),
      rules.maxLength(255),
    ]),

    status: schema.boolean.optional(),
  })

  public messages = {
    'companies_id.required': 'O campo empresa é obrigatório',
    'description.required': 'O campo descrição é obrigatório',
    'description.maxLength': 'A descrição deve ter no máximo 255 caracteres',
  }
}
