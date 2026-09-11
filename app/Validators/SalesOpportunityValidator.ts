import { schema, rules } from '@ioc:Adonis/Core/Validator'

export default class SalesOpportunityValidator {
  public schema = schema.create({
    company_id: schema.number.nullableAndOptional([rules.exists({ table: 'companies', column: 'id' })]),
    sales_stage_id: schema.number([rules.exists({ table: 'sales_stages', column: 'id' })]),
    name: schema.string({ trim: true }, [rules.maxLength(120)]),
    city: schema.string.optional({ trim: true }, [rules.maxLength(100)]),
    contact_name: schema.string.optional({ trim: true }, [rules.maxLength(120)]),
    phone: schema.string.optional({ trim: true }, [rules.maxLength(30)]),
    interest: schema.string.optional({ trim: true }, [rules.maxLength(255)]),
    notes: schema.string.optional(),
    last_contact_date: schema.date.nullableAndOptional(),
    next_contact_date: schema.date.nullableAndOptional(),
    proposal_value: schema.number.nullableAndOptional(),
  })
}
