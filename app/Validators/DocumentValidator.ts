import { schema, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'


export default class DocumentValidator {
  constructor(protected ctx: HttpContextContract) {
  }
  public schema = schema.create({
    bookrecords_id: schema.number.nullableAndOptional(),
    box: schema.number.nullableAndOptional(),
    prot: schema.number.nullableAndOptional(),
    month: schema.number.nullableAndOptional([rules.range(1, 12)]),
    yeardoc: schema.number.nullableAndOptional(),
    intfield1: schema.number.nullableAndOptional(),
    stringfield1: schema.string.nullableAndOptional(),
    datefield1: schema.date.nullableAndOptional(),
    intfield2: schema.number.nullableAndOptional(),
    stringfield2: schema.string.nullableAndOptional(),
    datefield2: schema.date.nullableAndOptional(),
    intfield3: schema.number.nullableAndOptional(),
    stringfield3: schema.string.nullableAndOptional(),
    datefield3: schema.date.nullableAndOptional(),
    intfield4: schema.number.nullableAndOptional(),
    stringfield4: schema.string.nullableAndOptional(),
    datefield4: schema.date.nullableAndOptional(),
    intfield5: schema.number.nullableAndOptional(),
    stringfield5: schema.string.nullableAndOptional(),
    datefield5: schema.date.nullableAndOptional(),
    intfield6: schema.number.nullableAndOptional(),
    stringfield6: schema.string.nullableAndOptional(),
    datefield6: schema.date.nullableAndOptional(),
    intfield7: schema.number.nullableAndOptional(),
    stringfield7: schema.string.nullableAndOptional(),
    datefield7: schema.date.nullableAndOptional(),
    intfield8: schema.number.nullableAndOptional(),
    stringfield8: schema.string.nullableAndOptional(),
    datefield8: schema.date.nullableAndOptional(),
    intfield9: schema.number.nullableAndOptional(),
    stringfield9: schema.string.nullableAndOptional(),
    datefield9: schema.date.nullableAndOptional(),
    intfield10: schema.number.nullableAndOptional(),
    stringfield10: schema.string.nullableAndOptional(),
    datefield10: schema.date.nullableAndOptional(),
    intfield11: schema.number.nullableAndOptional(),
    stringfield11: schema.string.nullableAndOptional(),
    datefield11: schema.date.nullableAndOptional(),
    intfield12: schema.number.nullableAndOptional(),
    stringfield12: schema.string.nullableAndOptional(),
    datefield12: schema.date.nullableAndOptional(),
    intfield13: schema.number.nullableAndOptional(),
    stringfield13: schema.string.nullableAndOptional(),
    datefield13: schema.date.nullableAndOptional(),

  })

  //public messages: CustomMessages = {}
  //public messages: CustomMessages = {}
}



// export default class DocumentValidator {
//   static createBoxProtSchema() {
//     return schema.create({
//       box: schema.number(),
//       prot: schema.number()
//     })
//   }

//   public messages: CustomMessages = {
//     required: 'The {{field}} is required to create a new company',

//   }

// }