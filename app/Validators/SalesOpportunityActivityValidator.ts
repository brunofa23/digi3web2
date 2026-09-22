import { schema, rules } from '@ioc:Adonis/Core/Validator'

export default class SalesOpportunityActivityValidator {
  public schema = schema.create({
    type: schema.string({ trim: true }, [rules.maxLength(30)]),
    description: schema.string({ trim: true }),
    activity_date: schema.date(),
  })
}
