import { schema, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class PersonValidator {
  constructor(protected ctx: HttpContextContract) {}

  // POST = create (required) | PUT/PATCH = update (optional)
  private get isCreate() {
    const method = this.ctx.request.method().toUpperCase()
    return method === 'POST'
  }

  public schema = schema.create({
    // Dados pessoais
    name: this.isCreate
      ? schema.string({ trim: true }, [rules.maxLength(90)])
      : schema.string.optional({ trim: true }, [rules.maxLength(90)]),

    nameMarried: schema.string.optional({ trim: true }, [rules.maxLength(90)]),

    cpf: this.isCreate
      ? schema.string({ trim: true }, [rules.regex(/^\d{11}$/)])
      : schema.string.optional({ trim: true }, [rules.regex(/^\d{11}$/)]),

    gender: schema.string.optional({ trim: true }, [rules.maxLength(1)]),
    deceased: schema.boolean.optional(),

    dateBirth: schema.date.optional({ format: 'yyyy-MM-dd' }),

    maritalStatus: schema.string.optional({ trim: true }, [rules.maxLength(15)]),
    illiterate: schema.boolean.optional(),

    // Naturalidade / Nacionalidade / Profissão
    placeBirth: schema.string.optional({ trim: true }, [rules.maxLength(100)]),
    nationality: schema.string.optional({ trim: true }, [rules.maxLength(50)]),
    occupationId: schema.number.nullableAndOptional(),

    // Endereço
    zipCode: schema.string.optional({ trim: true }, [rules.maxLength(15)]),
    address: schema.string.optional({ trim: true }, [rules.maxLength(150)]),
    streetNumber: schema.string.optional({ trim: true }, [rules.maxLength(5)]),
    streetComplement: schema.string.optional({ trim: true }, [rules.maxLength(10)]),
    district: schema.string.optional({ trim: true }, [rules.maxLength(100)]),
    city: schema.string.optional({ trim: true }, [rules.maxLength(100)]),
    state: schema.string.optional({ trim: true }, [rules.regex(/^[A-Za-z]{2}$/)]),

    // Documento
    documentType: schema.string.optional({ trim: true }, [rules.maxLength(50)]),
    documentNumber: schema.string.optional({ trim: true }, [rules.maxLength(50)]),

    // Contatos
    phone: schema.string.optional({ trim: true }, [rules.maxLength(15)]),
    cellphone: schema.string.optional({ trim: true }, [rules.maxLength(15)]),
    email: schema.string.optional({ trim: true }, [rules.email(), rules.maxLength(90)]),

    // Status
    inactive: schema.boolean.optional(),
  })

  public messages = {
    'name.required': 'Nome é obrigatório.',
    'cpf.required': 'CPF é obrigatório.',
    'cpf.regex': 'CPF deve conter exatamente 11 dígitos numéricos.',
    'email.email': 'E-mail inválido.',
    'state.regex': 'UF deve conter 2 letras.',
  }
}
