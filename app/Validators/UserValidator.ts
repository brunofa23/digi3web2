import { schema, CustomMessages, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'


export default class UserValidator {
  constructor(protected ctx: HttpContextContract) { }

  public schema = schema.create({
    id: schema.number.optional(),
    companies_id: schema.number(),
    usergroup_id: schema.number(),
    name: schema.string({}, [rules.maxLength(45)]),
    username: schema.string({}, [rules.maxLength(45)]),
    email: schema.string.optional({}, [rules.email(), rules.maxLength(255), rules.unique({ table: 'users', column: 'email' })]),
    password: schema.string.nullableAndOptional(),
    remember_me_token: schema.string.optional(),
    permission_level: schema.number(),
    superuser: schema.boolean(),
    status: schema.boolean(),
    access_images_permanent:schema.boolean.nullableAndOptional()
  })

  // public messages: CustomMessages = {
  //   'password.regex': "Minimum 8 with uppercase, lowercase, numbers and special characters."
  // }
}
