import { schema, rules } from '@ioc:Adonis/Core/Validator'

export default class SalesOpportunityValidator {
  public schema = schema.create({
    company_id: schema.number.nullableAndOptional([rules.exists({ table: 'companies', column: 'id' })]),
    sales_stage_id: schema.number([rules.exists({ table: 'sales_stages', column: 'id' })]),
    name: schema.string({ trim: true }, [rules.maxLength(255)]),
    city: schema.string.optional({ trim: true }, [rules.maxLength(100)]),
    state: schema.string.nullableAndOptional({ trim: true }, [rules.maxLength(2)]),
    contact_name: schema.string.optional({ trim: true }, [rules.maxLength(120)]),
    phone: schema.string.optional({ trim: true }, [rules.maxLength(30)]),
    email: schema.string.nullableAndOptional({ trim: true }, [rules.email(), rules.maxLength(255)]),
    whatsapp: schema.string.nullableAndOptional({ trim: true }, [rules.maxLength(30)]),
    source: schema.string.nullableAndOptional({ trim: true }, [rules.maxLength(80)]),
    interest: schema.string.optional({ trim: true }, [rules.maxLength(255)]),
    notes: schema.string.optional(),
    last_contact_date: schema.date.nullableAndOptional(),
    next_contact_date: schema.date.nullableAndOptional(),
    next_action: schema.string.nullableAndOptional({ trim: true }),
    assigned_user_id: schema.number.nullableAndOptional([rules.exists({ table: 'users', column: 'id' })]),
    proposal_value: schema.number.nullableAndOptional(),
  })
}
