// app/Validators/ReceiptItemValidator.ts
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class ReceiptItemValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    // companies_id vem do token (não receber do front)
    receiptId: schema.number([
      rules.exists({ table: 'receipts', column: 'id' }),
    ]),

    serviceId: schema.number([
      rules.exists({ table: 'services', column: 'id' }),
    ]),

    emolumentId: schema.number([
      rules.exists({ table: 'emoluments', column: 'id' }),
    ]),

    qtde: schema.number.optional([
      rules.unsigned(),
    ]),

    amount: schema.string.optional(),
  })

  public messages = {
    'receiptId.required': 'Informe o receiptId',
    'serviceId.required': 'Informe o serviceId',
    'emolumentId.required': 'Informe o emolumentId',
    'qtde.unsigned': 'qtde não pode ser negativo',
    'amount.range': 'amount fora do limite permitido',
    'receiptId.exists': 'receiptId inválido',
    'serviceId.exists': 'serviceId inválido',
    'emolumentId.exists': 'emolumentId inválido',
  }
}
