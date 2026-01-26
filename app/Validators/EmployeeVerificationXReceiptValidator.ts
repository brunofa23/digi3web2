// app/Validators/EmployeeVerificationXReceiptValidator.ts
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class EmployeeVerificationXReceiptValidator {
  constructor (protected ctx: HttpContextContract) {}

  /**
   * Schema para CREATE (store)
   * → todos obrigatórios, exceto companiesId/userId que vêm do auth
   */
  public static createSchema = schema.create({
    receiptId: schema.number([
      rules.unsigned(),
      rules.exists({ table: 'receipts', column: 'id' }),
    ]),
    employeeVerificationId: schema.number([
      rules.unsigned(),
      rules.exists({ table: 'employee_verifications', column: 'id' }),
    ]),
    // formato ex: "2026-01-26 14:30:00"
    date: schema.date({
      format: 'yyyy-MM-dd HH:mm:ss',
    }),
  })

  /**
   * Schema para UPDATE
   * → tudo opcional
   */
  public static updateSchema = schema.create({
    receiptId: schema.number.optional([
      rules.unsigned(),
      rules.exists({ table: 'receipts', column: 'id' }),
    ]),
    employeeVerificationId: schema.number.optional([
      rules.unsigned(),
      rules.exists({ table: 'employee_verifications', column: 'id' }),
    ]),
    date: schema.date.optional({
      format: 'yyyy-MM-dd HH:mm:ss',
    }),
  })

  /**
   * Mensagens compartilhadas
   */
  public static messages = {
    'receiptId.required': 'O campo receiptId é obrigatório',
    'employeeVerificationId.required': 'O campo employeeVerificationId é obrigatório',
    'date.required': 'O campo date é obrigatório',

    'receiptId.exists': 'O recibo informado não foi encontrado',
    'employeeVerificationId.exists': 'A conferência de funcionário informada não foi encontrada',
  }
}
