import { schema, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class BookrecordValidator {
  constructor(protected ctx: HttpContextContract) { }

  public schema = schema.create({
    typebooks_id: schema.number(),
    books_id: schema.number(),
    companies_id: schema.number.nullableAndOptional(),
    cod: schema.number(),
    book: schema.number([rules.range(1, 10000000000)]),
    sheet: schema.number.optional([rules.range(1, 10000000000)]),
    side: schema.string.optional(),
    approximate_term: schema.number(),
    indexbook: schema.number.optional([rules.range(1, 99)]),
    obs: schema.string.optional([rules.maxLength(255)]),
    letter: schema.string.optional(),
    year: schema.string.nullableAndOptional(),
    model: schema.string.optional(),

  })

  // public messages: CustomMessages = {
  //   required: 'The {{field}} is required to create a new company',

  // }
}
