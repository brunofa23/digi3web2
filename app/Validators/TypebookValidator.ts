import { schema, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class TypebookValidator {
  constructor(protected ctx: HttpContextContract) { }

  public schema = schema.create({
    id: schema.number.optional(),
    name: schema.string({}, [rules.maxLength(255)]),
    status: schema.boolean(),
    path: schema.string(),
    books_id: schema.number(),
    companies_id: schema.number()
  })

  //  public messages: CustomMessages = {}
}
