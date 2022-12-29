import { schema, CustomMessages, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class CreateCompanyValidator {
  constructor(protected ctx: HttpContextContract) { }

  public schema = schema.create({

    name: schema.string({}, [
      rules.maxLength(50),
      rules.minLength(10),
    ]),

    shortname: schema.string({},
      [rules.maxLength(45)]),

    address: schema.string({}, [
      rules.maxLength(70)
    ]),

    number: schema.string.optional(),

    complement: schema.string.optional(),

    cep: schema.string.optional({}, [
      rules.maxLength(8),

    ]),

    district: schema.string.optional(),
    city: schema.string.optional(),
    state: schema.string.optional({}, [
      rules.maxLength(2)
    ]),

    cnpj: schema.string.optional({},[
      rules.maxLength(14),
      rules.minLength(14),
    ]),
    responsablename: schema.string.optional(),
    phoneresponsable: schema.string.optional(),

    email: schema.string.optional({}, [
      rules.email(),
    ]),
    status: schema.boolean()

  })

  /**
   * Custom messages for validation failures. You can make use of dot notation `(.)`
   * for targeting nested fields and array expressions `(*)` for targeting all
   * children of an array. For example:
   *
   * {
   *   'profile.username.required': 'Username is required',
   *   'scores.*.number': 'Define scores as valid numbers'
   * }
   *
   */
  public messages: CustomMessages = {
    required: 'The {{field}} is required to create a new company',
    'shortname.unique': 'Username not available',
    'email.email':"email inválido"


  }
}
