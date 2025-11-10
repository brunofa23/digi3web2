import { schema, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class MarriedCertificateValidator {
  constructor(protected ctx: HttpContextContract) {}

  // POST = create (required) | PUT/PATCH = update (optional)
  private get isCreate() {
    return this.ctx.request.method().toUpperCase() === 'POST'
  }

  public schema = schema.create({
    // === Noivo e pais ===
    groomPersonId: this.isCreate
      ? schema.number([rules.unsigned()])
      : schema.number.optional([rules.unsigned()]),

    fatherGroomPersonId: schema.number.nullableAndOptional([rules.unsigned()]),
    motherGroomPersonId: schema.number.nullableAndOptional([rules.unsigned()]),

    // === Noiva e pais ===
    bridePersonId: this.isCreate
      ? schema.number([rules.unsigned()])
      : schema.number.optional([rules.unsigned()]),

    // atenção: migration tem "fahter_bride_person_id"
    fahterBridePersonId: schema.number.nullableAndOptional([rules.unsigned()]),
    motherBridePersonId: schema.number.nullableAndOptional([rules.unsigned()]),

    // === Testemunhas ===
    witnessPersonId: schema.number.nullableAndOptional([rules.unsigned()]),
    witness2PersonId: schema.number.nullableAndOptional([rules.unsigned()]),

    // === Status (opcional)
    statusId: schema.number.nullableAndOptional([rules.unsigned()]),

    // === Datas principais ===
    dthrSchedule: schema.date.optional({ format: 'yyyy-MM-dd HH:mm:ss' }),
    dthrMarriage: schema.date.optional({ format: 'yyyy-MM-dd HH:mm:ss' }),

    // === Tipo e observação ===
    type: schema.string.optional({ trim: true }),
    obs: schema.string.optional({ trim: true }),

    // === Igreja ===
    churchName: schema.string.optional({ trim: true }),
    churchCity: schema.string.optional({ trim: true }),

    // === Regime de bens ===
    maritalRegime: schema.string.optional({ trim: true }),

    // === Pacto antenupcial ===
    prenup: schema.boolean.optional(),
    registryOfficePrenup: schema.string.optional({ trim: true }),
    addresRegistryOfficePrenup: schema.string.optional({ trim: true }),
    bookRegistryOfficePrenup: schema.number.nullableAndOptional([rules.unsigned()]),
    sheetRegistryOfficePrenup: schema.number.nullableAndOptional([rules.unsigned()]),
    dthrPrenup: schema.date.optional({ format: 'yyyy-MM-dd' }),

    // === Local da cerimônia ===
    cerimonyLocation: schema.string.optional({ trim: true }),
    otherCerimonyLocation: schema.string.optional({ trim: true }),

    // === Ex-cônjuges ===
    nameFormerSpouse: schema.string.optional({ trim: true }),
    dthrDivorceSpouse: schema.date.optional({ format: 'yyyy-MM-dd' }),
    nameFormerSpouse2: schema.string.optional({ trim: true }),
    dthrDivorceSpouse2: schema.date.optional({ format: 'yyyy-MM-dd' }),

    // === Status do registro
    inactive: schema.boolean.optional(),
  })

  public messages = {
    'groomPersonId.required': 'O noivo é obrigatório.',
    'bridePersonId.required': 'A noiva é obrigatória.',
    'dthrSchedule.date.format': 'dthrSchedule deve estar no formato yyyy-MM-dd HH:mm:ss.',
    'dthrMarriage.date.format': 'dthrMarriage deve estar no formato yyyy-MM-dd HH:mm:ss.',
    'dthrPrenup.date.format': 'dthrPrenup deve estar no formato yyyy-MM-dd.',
    'dthrDivorceSpouse.date.format': 'dthrDivorceSpouse deve estar no formato yyyy-MM-dd.',
    'dthrDivorceSpouse2.date.format': 'dthrDivorceSpouse2 deve estar no formato yyyy-MM-dd.',
  }
}
