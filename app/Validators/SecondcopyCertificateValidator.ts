import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class SecondcopyCertificateValidator {
  constructor(protected ctx: HttpContextContract) { }

  public schema = schema.create({
    documenttypeId: schema.number.optional([
      rules.unsigned(),
      rules.exists({ table: 'documenttypes', column: 'id' }),
    ]),

    paymentMethod: schema.string.optional({ trim: true }, [
      rules.maxLength(10),
    ]),

    applicant: schema.number.optional([
      rules.unsigned(),
      rules.exists({ table: 'people', column: 'id' }),
    ]),

    registered1: schema.number.optional([
      rules.unsigned(),
      rules.exists({ table: 'people', column: 'id' }),
    ]),

    typebookId: schema.number.optional([
      rules.unsigned(),
      rules.exists({ table: 'typebooks', column: 'id' }),
    ]),

    book1: schema.number.optional([rules.unsigned()]),
    sheet1: schema.number.optional([rules.unsigned()]),
    term1: schema.string.optional({ trim: true }, [
      rules.maxLength(10)]),
    city1: schema.string.optional({ trim: true }, [
      rules.maxLength(255),
    ]),

    registered2: schema.number.optional([
      rules.unsigned(),
      rules.exists({ table: 'people', column: 'id' }),
    ]),
    book2: schema.number.optional([rules.unsigned()]),
    sheet2: schema.number.optional([rules.unsigned()]),
    city2: schema.string.optional({ trim: true }, [
      rules.maxLength(255),
    ]),

    obs: schema.string.optional({ trim: true }, [
      rules.maxLength(255),
    ]),

    inactive: schema.boolean.optional()

  })

  public messages: CustomMessages = {
    'documenttypeId.exists': 'Tipo de documento inválido',
    'paymentMethod.maxLength': 'Forma de pagamento deve ter no máximo 10 caracteres',

    'applicant.exists': 'Solicitante inválido',
    'registered1.exists': 'Registrado 1 inválido',
    'registered2.exists': 'Registrado 2 inválido',

    'book1.unsigned': 'Livro 1 inválido',
    'sheet1.unsigned': 'Folha 1 inválida',
    'book2.unsigned': 'Livro 2 inválido',
    'sheet2.unsigned': 'Folha 2 inválida',
  }
}
