import { schema, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class NfseManualInvoiceValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    effectiveDate: schema.string.optional({ trim: true }),
    sendEmailToCustomer: schema.boolean.optional(),
    description: schema.string({ trim: true }),
    federalServiceCode: schema.string.optional({ trim: true }, [rules.maxLength(20)]),
    cityServiceCode: schema.string.optional({ trim: true }, [rules.maxLength(30)]),
    nbsCode: schema.string.nullableAndOptional({ trim: true }, [rules.maxLength(20)]),
    taxationType: schema.string.optional({ trim: true }, [rules.maxLength(60)]),
    receiver: schema.object().members({
      name: schema.string({ trim: true }, [rules.maxLength(120)]),
      federalTaxNumber: schema.string({ trim: true }, [
        rules.maxLength(20),
        rules.regex(/^\d{11}$|^\d{14}$/),
      ]),
      email: schema.string.nullableAndOptional({ trim: true }, [rules.email(), rules.maxLength(120)]),
      address: schema.object().members({
        street: schema.string({ trim: true }, [rules.maxLength(120)]),
        number: schema.string.optional({ trim: true }, [rules.maxLength(20)]),
        district: schema.string({ trim: true }, [rules.maxLength(80)]),
        postalCode: schema.string({ trim: true }, [
          rules.maxLength(8),
          rules.regex(/^\d{8}$/),
        ]),
        city: schema.object().members({
          code: schema.string.optional({ trim: true }, [rules.maxLength(7)]),
          name: schema.string.optional({ trim: true }, [rules.maxLength(80)]),
          state: schema.string.optional({ trim: true }, [rules.maxLength(2)]),
        }),
      }),
    }),
    total: schema.object().members({
      invoiceAmount: schema.number(),
      issRate: schema.number.optional(),
      issAmount: schema.number.optional(),
      issWithheld: schema.boolean.optional(),
      pisRate: schema.number.optional(),
      pisAmount: schema.number.optional(),
      pisWithheld: schema.boolean.optional(),
      cofinsRate: schema.number.optional(),
      cofinsAmount: schema.number.optional(),
      cofinsWithheld: schema.boolean.optional(),
      irRate: schema.number.optional(),
      irAmount: schema.number.optional(),
      irWithheld: schema.boolean.optional(),
      csllRate: schema.number.optional(),
      csllAmount: schema.number.optional(),
      csllWithheld: schema.boolean.optional(),
      inssRate: schema.number.optional(),
      inssAmount: schema.number.optional(),
      inssWithheld: schema.boolean.optional(),
      netAmount: schema.number.optional(),
    }),
  })

  public messages = {
    'description.required': 'Descrição do serviço é obrigatória',
    'receiver.name.required': 'Tomador é obrigatório',
    'receiver.federalTaxNumber.regex': 'CPF/CNPJ do tomador deve conter 11 ou 14 dígitos',
    'receiver.address.postalCode.regex': 'CEP deve conter 8 dígitos',
    'total.invoiceAmount.required': 'Valor da nota é obrigatório',
  }
}
