import { schema, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class FinAccountStoreValidator {
  constructor(protected ctx: HttpContextContract) { }
  public schema = schema.create({
    companies_id: schema.number.optional(),
    fin_emp_id: schema.number(),
    fin_class_id: schema.number(),
    fin_paymentmethod_id: schema.number(),
    id_replication: schema.number.optional(),
    entity_id:schema.number.nullableAndOptional(),
    description: schema.string.optional(),
    amount: schema.number.nullableAndOptional(),
    //amount_paid: schema.number.nullableAndOptional(),
    date: schema.date.nullableAndOptional(),
    date_due: schema.date.nullableAndOptional(),
    replicate: schema.boolean.nullableAndOptional(),
    data_billing: schema.date.nullableAndOptional(),
    date_conciliation: schema.date.nullableAndOptional(),
    excluded: schema.boolean.nullableAndOptional(),
    debit_credit: schema.string.nullableAndOptional(),
    cost: schema.string.nullableAndOptional(),
    ir: schema.boolean.nullableAndOptional(),
    obs: schema.string.nullableAndOptional(),
    analyze: schema.boolean.nullableAndOptional(),
    future: schema.boolean.nullableAndOptional(),
    reserve: schema.boolean.nullableAndOptional(),
    overplus: schema.boolean.nullableAndOptional(),
    limit_amount: schema.number.nullableAndOptional(),


    // Campo virtual (não está na tabela)
    conciliation: schema.boolean.optional(),
  })
  public messages: CustomMessages = {}
}
