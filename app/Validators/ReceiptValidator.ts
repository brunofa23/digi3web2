// app/Validators/ReceiptValidator.ts
import { schema, rules } from '@ioc:Adonis/Core/Validator'

export default class ReceiptValidator {
  constructor(protected ctx) {}

  public schema = schema.create({

    orderCertificateId: schema.number([
      rules.unsigned(),
      rules.exists({ table: 'order_certificates', column: 'id' }),
    ]),

    serviceId: schema.number([
      rules.unsigned(),
      rules.exists({ table: 'services', column: 'id' }),
    ]),

    // Dados opcionais
    applicant: schema.string.optional({ trim: true }, [rules.maxLength(90)]),
    cpfApplicant: schema.string.optional({ trim: true }, [
      rules.maxLength(11),
      rules.minLength(11),
      rules.regex(/^\d{11}$/),
    ]),

    registered1: schema.string.optional({ trim: true }, [rules.maxLength(90)]),
    cpfRegistered1: schema.string.optional({ trim: true }, [
      rules.maxLength(11),
      rules.minLength(11),
      rules.regex(/^\d{11}$/),
    ]),

    registered2: schema.string.optional({ trim: true }, [rules.maxLength(90)]),
    cpfRegistered2: schema.string.optional({ trim: true }, [
      rules.maxLength(11),
      rules.minLength(11),
      rules.regex(/^\d{11}$/),
    ]),

    typebookId: schema.number.optional([
      rules.unsigned(),
      rules.exists({ table: 'typebooks', column: 'id' }),
    ]),

    book: schema.number.optional([rules.unsigned()]),
    sheet: schema.number.optional([rules.unsigned()]),

    side: schema.string.optional({ trim: true }, [rules.maxLength(50)]),

    datePrevision: schema.date.optional(),
    dateStamp: schema.date.optional(),
    dateMarriage: schema.date.optional(), // se preferir datetime, troque para schema.dateTime.optional()

    securitySheet: schema.string.optional({ trim: true }, [rules.maxLength(50)]),
    habilitationProccess: schema.string.optional({ trim: true }, [rules.maxLength(50)]),

    status: schema.string.optional({ trim: true }, [rules.maxLength(15)]),

    items: schema.array.optional().members(
      schema.object().members({
        emolumentId: schema.number([rules.exists({ table: 'emoluments', column: 'id' })]),
        qtde: schema.number.optional(),
        amount: schema.number.optional(),
      })
    ),
  })

  public messages = {
    'companiesId.required': 'companiesId é obrigatório',
    'orderCertificateId.required': 'orderCertificateId é obrigatório',
    'serviceId.required': 'serviceId é obrigatório',
    'userId.required': 'userId é obrigatório',
    'cpfApplicant.regex': 'cpfApplicant deve conter apenas 11 dígitos',
    'cpfRegistered1.regex': 'cpfRegistered1 deve conter apenas 11 dígitos',
    'cpfRegistered2.regex': 'cpfRegistered2 deve conter apenas 11 dígitos',
  }
}
