import { schema, CustomMessages, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class FinAccountUpdateValidator {
  constructor(protected ctx: HttpContextContract) { }

  public schema = schema.create({
    companies_id: schema.number.optional(),
    fin_emp_id: schema.number.optional(),
    fin_class_id: schema.number.optional(),
    fin_paymentmethod_id: schema.number.optional(),
    id_replication: schema.number.optional(),
    entity_id:schema.number.nullableAndOptional(),
    description: schema.string.optional(),
    amount: schema.string.optional(),
    //amount_paid: schema.string.optional(),
    date: schema.date.optional(),
    date_due: schema.date.optional(),
    replicate: schema.boolean.optional(),
    data_billing: schema.date.optional(),
    date_conciliation: schema.date.optional(),
    excluded: schema.boolean.optional(),
    debit_credit: schema.string.optional(),
    cost: schema.string.optional(),
    ir: schema.boolean.optional(),
    obs: schema.string.optional(),
    analyze: schema.boolean.nullableAndOptional(),
    future: schema.boolean.nullableAndOptional(),
    reserve: schema.boolean.nullableAndOptional(),
    overplus: schema.boolean.nullableAndOptional(),
    limit_amount: schema.string.nullableAndOptional(),

    // Campo virtual
    conciliation: schema.boolean.optional(),
  })

  public messages: CustomMessages = {}
}
