import { schema, rules } from '@ioc:Adonis/Core/Validator'

export default class SalesOpportunityEmailValidator {
  public schema = schema.create({
    subject: schema.string({ trim: true }, [rules.maxLength(255)]),
    description: schema.string({ trim: true }),
    activity_date: schema.date(),
    assigned_user_id: schema.number.nullableAndOptional(),
    next_action: schema.string.nullableAndOptional({ trim: true }),
    next_contact_date: schema.date.nullableAndOptional(),
  })
}
