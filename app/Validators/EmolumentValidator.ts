// app/Validators/EmolumentValidator.ts
import { schema, rules } from '@ioc:Adonis/Core/Validator'

export default class EmolumentValidator {
  public schema = schema.create({
    // companiesId: schema.number([
    //   rules.unsigned(),
    //   rules.exists({ table: 'companies', column: 'id' }),
    // ]),

    name: schema.string({ trim: true }, [rules.maxLength(50)]),
    description: schema.string.optional({ trim: true }),

    // decimal(10,2)
    price: schema.number.optional([
      rules.range(0, 99999999.99),
    ]),

    inactive:schema.boolean.optional(),

    code: schema.string.optional({ trim: true }, [rules.maxLength(10)]),
    type: schema.string({ trim: true }, [rules.maxLength(50)]),
  })

  public messages = {
    'companiesId.required': 'Empresa é obrigatória',
    'companiesId.unsigned': 'Empresa inválida',
    'companiesId.exists': 'Empresa não encontrada',

    'name.required': 'Nome é obrigatório',
    'name.maxLength': 'Nome deve ter no máximo 50 caracteres',

    'price.number': 'Preço inválido',
    'price.range': 'Preço fora do intervalo permitido',

    'code.maxLength': 'Código deve ter no máximo 10 caracteres',

    'type.required': 'Tipo é obrigatório',
    'type.maxLength': 'Tipo deve ter no máximo 50 caracteres',
  }
}
