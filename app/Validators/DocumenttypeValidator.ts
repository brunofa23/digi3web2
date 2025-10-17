import { schema, rules } from '@ioc:Adonis/Core/Validator'

export default class DocumenttypeValidator {
  public schema = schema.create({
    companies_id: schema.number(),

    name: schema.string({}, [
      rules.required(),
      rules.maxLength(100),
    ]),

    description: schema.string.optional({}, [
      rules.maxLength(255),
    ]),

    status: schema.boolean.optional(),
  })

  public messages = {
    // 'companies_id.required': 'O campo empresa é obrigatório',
    'name.required': 'O campo nome é obrigatório',
    'name.maxLength': 'O nome deve ter no máximo 100 caracteres',
    'description.maxLength': 'A descrição deve ter no máximo 255 caracteres',
  }
}
