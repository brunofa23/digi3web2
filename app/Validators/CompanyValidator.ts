import { schema, CustomMessages, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class CompanyValidator {
  constructor(protected ctx: HttpContextContract) { }

  public schema = schema.create({
    name: schema.string({}, [rules.maxLength(50), rules.minLength(5),]),
    shortname: schema.string({}, [rules.maxLength(45)]),
    address: schema.string.optional({}, [rules.maxLength(70)]),
    number: schema.string.optional(),
    complement: schema.string.optional(),
    postalcode: schema.string.optional(),
    district: schema.string.optional(),
    city: schema.string.optional(),
    state: schema.string.optional({}, [rules.maxLength(2)]),
    cnpj: schema.string.optional({}, [rules.maxLength(14), rules.minLength(14),]),
    responsablename: schema.string.optional(),
    phoneresponsable: schema.string.optional(),
    email: schema.string.optional({}, [rules.email(),]),
    status: schema.boolean(),
    cloud:schema.number(),
    use_device_control: schema.boolean.optional(),
    use_device_cookie_control: schema.boolean.optional(),
    module_books: schema.boolean.optional(),
    module_financial: schema.boolean.optional(),
    module_lgpd: schema.boolean.optional(),
    obs: schema.string.nullableAndOptional({}, [rules.maxLength(255)]),
    situation_ids: schema.array.optional().members(
      schema.number([
        rules.exists({ table: 'situation', column: 'id' }),
      ])
    )
  })



  public messages: CustomMessages = {

    required: 'The {{field}} is required to create a new company',
    'shortname.unique': 'Username not available',
    'email.email': "email inválido"
  }


}
