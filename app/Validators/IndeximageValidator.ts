import { schema } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class IndeximageValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    bookrecords_id: schema.number.optional(),
    typebooks_id: schema.number.optional(),
    companies_id: schema.number.optional(),
    seq: schema.number.optional(),
    ext: schema.string.optional({ trim: true }),
    file_name: schema.string.optional({ trim: true }),
    drive_file_id: schema.string.nullableAndOptional({ trim: true }),
    drive_file_size: schema.number.nullableAndOptional(),
    drive_md5_checksum: schema.string.nullableAndOptional({ trim: true }),
    drive_folder_id: schema.string.nullableAndOptional({ trim: true }),
    previous_file_name: schema.string.nullableAndOptional({ trim: true }),
    book: schema.number.nullableAndOptional(),
    sheet: schema.number.nullableAndOptional(),
    register: schema.number.nullableAndOptional(),
    ready: schema.boolean.optional(),
    date_atualization: schema.date.nullableAndOptional(),
  })
}
