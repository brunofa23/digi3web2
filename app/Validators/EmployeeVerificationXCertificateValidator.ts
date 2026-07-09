import { schema, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class EmployeeVerificationXCertificateValidator {
  constructor (protected ctx: HttpContextContract) {}

  public static createSchema = schema.create({
    marriedCertificateId: schema.number([
      rules.unsigned(),
      rules.exists({ table: 'married_certificates', column: 'id' }),
    ]),
    employeeVerificationId: schema.number([
      rules.unsigned(),
      rules.exists({ table: 'employee_verifications', column: 'id' }),
    ]),
    status: schema.string({ trim: true }, [
      rules.maxLength(80),
    ]),
    date: schema.date({
      format: 'yyyy-MM-dd HH:mm:ss',
    }),
  })

  public static updateSchema = schema.create({
    marriedCertificateId: schema.number.optional([
      rules.unsigned(),
      rules.exists({ table: 'married_certificates', column: 'id' }),
    ]),
    employeeVerificationId: schema.number.optional([
      rules.unsigned(),
      rules.exists({ table: 'employee_verifications', column: 'id' }),
    ]),
    status: schema.string.optional({ trim: true }, [
      rules.maxLength(80),
    ]),
    date: schema.date.optional({
      format: 'yyyy-MM-dd HH:mm:ss',
    }),
  })

  public static messages = {
    'marriedCertificateId.required': 'O campo marriedCertificateId é obrigatório',
    'employeeVerificationId.required': 'O campo employeeVerificationId é obrigatório',
    'status.required': 'O campo status é obrigatório',
    'date.required': 'O campo date é obrigatório',

    'marriedCertificateId.exists': 'O certificado de casamento informado não foi encontrado',
    'employeeVerificationId.exists': 'A conferência de funcionário informada não foi encontrada',
    'status.maxLength': 'Status deve ter no máximo 80 caracteres',
  }
}
