// app/Validators/StampValidator.ts
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'

export default class StampValidator {
  constructor(protected ctx: HttpContextContract) {}

  /**
   * Se for POST (store) => campos obrigatórios
   * Se for PUT/PATCH (update) => tudo opcional
   */
  public schema = this.ctx.request.method() === 'POST'
    ? schema.create({
        // companies_id: schema.number([
        //   rules.unsigned(),
        //   rules.exists({ table: 'companies', column: 'id' }),
        // ]),

        serial: schema.string({ trim: true }, [
          rules.maxLength(5),
        ]),

        start: schema.number([
          rules.unsigned(),
        ]),

        end: schema.number.optional([
          rules.unsigned(),
        ]),

        current: schema.number.optional([
          rules.unsigned(),
        ]),

        finished: schema.boolean.optional(),
        inactive: schema.boolean.optional(),
      })
    : schema.create({
        companies_id: schema.number.optional([
          rules.unsigned(),
          rules.exists({ table: 'companies', column: 'id' }),
        ]),

        serial: schema.string.optional({ trim: true }, [
          rules.maxLength(5),
        ]),

        start: schema.number.optional([
          rules.unsigned(),
        ]),

        end: schema.number.optional([
          rules.unsigned(),
        ]),

        current: schema.number.optional([
          rules.unsigned(),
        ]),

        finished: schema.boolean.optional(),
        inactive: schema.boolean.optional(),
      })

  public messages = {
    'companies_id.required': 'Empresa é obrigatória',
    'companies_id.exists': 'Empresa informada é inválida',
    'serial.required': 'O campo serial é obrigatório',
    'serial.maxLength': 'O serial deve ter no máximo {{ options.maxLength }} caracteres',
    'start.required': 'O campo início (start) é obrigatório',
  }
}
