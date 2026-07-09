import { schema, rules } from '@ioc:Adonis/Core/Validator'

export default class EmployeeVerificationValidator {
  public schema = schema.create({
    id: schema.number.optional([rules.unsigned()]),
    description: schema.string({ trim: true }, [
      rules.maxLength(80),
    ]),
    local: schema.enum(['receipt', 'certificate'] as const),
    inactive: schema.boolean.optional(),
  })

  public messages = {
    'description.required': 'Descrição é obrigatória',
    'description.maxLength': 'Descrição deve ter no máximo 80 caracteres',
    'local.required': 'Local é obrigatório',
    'local.enum': 'Local deve ser receipt ou certificate',
    'inactive.boolean': 'Inactive deve ser booleano',
  }
}
