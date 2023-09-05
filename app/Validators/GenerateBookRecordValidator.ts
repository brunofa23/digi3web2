import { schema, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { runFailedTests } from '@japa/preset-adonis'

export default class GenerateBookRecordValidator {
  constructor(protected ctx: HttpContextContract) { }

  public schema = schema.create({
    generateBooks_id: schema.number(),
    generateBook: schema.number(),
    generateBookdestination: schema.number.optional(),
    generateStartCode: schema.number(),
    generateEndCode: schema.number(),
    generateStartSheetInCodReference: schema.number.optional(),
    generateEndSheetInCodReference: schema.number.optional(),
    generateSheetIncrement: schema.number.optional(),
    generateSideStart: schema.string.optional(),
    generateAlternateOfSides: schema.string.optional(),
    generateApproximate_term: schema.number.optional(),
    generateApproximate_termIncrement: schema.number.optional(),
    generateIndex: schema.number(),
    generateIndexIncrement: schema.number.optional(),
    generateYear: schema.string.optional()
  })
  //public messages: CustomMessages = {}
}
