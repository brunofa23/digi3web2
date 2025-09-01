import { schema, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class FinnClassStoreValidator {
  constructor(protected ctx: HttpContextContract) { }
  public schema = schema.create({

    companies_id: schema.number.optional(),
    fin_emp_id:schema.number.optional(),
    description: schema.string(),
    excluded: schema.boolean.nullableAndOptional(),
    inactive: schema.boolean.nullableAndOptional(),
    debit_credit: schema.string(),
    cost: schema.string.nullableAndOptional(),
    allocation: schema.string.nullableAndOptional(),
    limit_amount: schema.number.nullableAndOptional()
  })
  public messages: CustomMessages = {}
}
