import { schema, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class NfseCancelValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    justification: schema.string({ trim: true }, [
      rules.minLength(15),
      rules.maxLength(255),
    ]),
  })

  public messages = {
    'justification.required': 'Justificativa é obrigatória',
    'justification.minLength': 'Justificativa deve ter pelo menos 15 caracteres',
  }
}
