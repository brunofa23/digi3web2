import { schema, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class DocumentValidator {
  constructor(protected ctx: HttpContextContract) { }
  public schema = schema.create({
    box: schema.number(),
    prot: schema.number()

  })

  //public messages: CustomMessages = {}
}
