import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'
import Typebook from 'App/Models/Typebook'
import IndeximageSideLabel from 'App/Models/IndeximageSideLabel'
import { verifyPermission } from 'App/Services/util'
import BadRequestException from 'App/Exceptions/BadRequestException'

export default class SideTrainingController {
  private async access(ctx: HttpContextContract) {
    const user = await ctx.auth.use('api').authenticate()
    const permissions = ctx.auth.use('api').token?.meta.payload.permissions || []

    if (!verifyPermission(Boolean(user.superuser), permissions, 44)) {
      throw new BadRequestException('Acesso a conferência OCR não permitido', 403, 'ocr_conference_permission_required')
    }

    const typebooksId = Number(ctx.params.typebooks_id)
    if (!Number.isInteger(typebooksId) || typebooksId <= 0) {
      throw new BadRequestException('typebooks_id inválido', 400)
    }

    const typebook = await Typebook.query()
      .where('id', typebooksId)
      .andWhere('companies_id', user.companies_id)
      .first()

    if (!typebook) throw new BadRequestException('Livro não encontrado', 404)

    return { user, typebooksId }
  }

  public async index(ctx: HttpContextContract) {
    const { user, typebooksId } = await this.access(ctx)
    const rows = await IndeximageSideLabel.query()
      .where('companies_id', user.companies_id)
      .andWhere('typebooks_id', typebooksId)
      .orderBy('position', 'asc')

    const records = await Database.from('bookrecords')
      .where('companies_id', user.companies_id)
      .andWhere('typebooks_id', typebooksId)
      .whereIn('id', rows.map((row) => row.bookrecords_id))
      .select('id', 'cod', 'book', 'sheet')
    const recordById = new Map(records.map((record) => [Number(record.id), record]))

    return ctx.response.ok({
      total: rows.length,
      reviewed: rows.filter((row) => row.label !== null).length,
      items: rows.map((row) => ({
        id: row.id,
        position: row.position,
        bookrecords_id: row.bookrecords_id,
        seq: row.seq,
        file_name: row.file_name,
        label: row.label,
        cod: recordById.get(row.bookrecords_id)?.cod ?? null,
        book: recordById.get(row.bookrecords_id)?.book ?? null,
        sheet: recordById.get(row.bookrecords_id)?.sheet ?? null,
      })),
    })
  }

  public async createSample(ctx: HttpContextContract) {
    const { user, typebooksId } = await this.access(ctx)

    await Database.transaction(async (trx) => {
      await Typebook.query({ client: trx })
        .where('id', typebooksId)
        .andWhere('companies_id', user.companies_id)
        .forUpdate()
        .firstOrFail()

      const existing = await IndeximageSideLabel.query({ client: trx })
        .where('companies_id', user.companies_id)
        .andWhere('typebooks_id', typebooksId)
        .first()

      if (existing) return

      const selected: any[] = []

      for (const side of ['F', 'V']) {
        const rows = await Database.from('bookrecords as bookrecords')
          .useTransaction(trx)
          .join('indeximages as indeximages', (join) => {
            join.on('indeximages.bookrecords_id', 'bookrecords.id')
              .andOn('indeximages.typebooks_id', 'bookrecords.typebooks_id')
              .andOn('indeximages.companies_id', 'bookrecords.companies_id')
              .andOnVal('indeximages.seq', 0)
          })
          .where('bookrecords.companies_id', user.companies_id)
          .andWhere('bookrecords.typebooks_id', typebooksId)
          .andWhere('bookrecords.side', side)
          .whereNotNull('indeximages.drive_file_id')
          .whereIn('indeximages.ext', ['.jpg', '.jpeg', '.png', '.webp'])
          .orderByRaw("CRC32(CONCAT(bookrecords.id, ':side-training-v1'))")
          .limit(20)
          .select('bookrecords.id as bookrecords_id', 'indeximages.seq', 'indeximages.drive_file_id', 'indeximages.file_name')

        selected.push(...rows)
      }

      if (!selected.length) throw new BadRequestException('Nenhuma imagem disponível para revisão', 422)

      await IndeximageSideLabel.createMany(selected.map((row, index) => ({
        companies_id: user.companies_id,
        typebooks_id: typebooksId,
        bookrecords_id: row.bookrecords_id,
        seq: row.seq,
        position: index + 1,
        drive_file_id: row.drive_file_id,
        file_name: row.file_name,
      })), { client: trx })
    })

    return this.index(ctx)
  }

  public async updateLabel(ctx: HttpContextContract) {
    const { user, typebooksId } = await this.access(ctx)
    const id = Number(ctx.params.id)
    const label = String(ctx.request.input('label') || '').trim().toUpperCase()

    if (!Number.isInteger(id) || id <= 0 || !['F', 'V', 'U'].includes(label)) {
      throw new BadRequestException('Classificação inválida', 422)
    }

    const row = await IndeximageSideLabel.query()
      .where('id', id)
      .andWhere('companies_id', user.companies_id)
      .andWhere('typebooks_id', typebooksId)
      .first()

    if (!row) throw new BadRequestException('Imagem da amostra não encontrada', 404)

    const image = await Database.from('indeximages')
      .where('companies_id', user.companies_id)
      .andWhere('typebooks_id', typebooksId)
      .andWhere('bookrecords_id', row.bookrecords_id)
      .andWhere('seq', row.seq)
      .andWhere('drive_file_id', row.drive_file_id)
      .andWhere('file_name', row.file_name)
      .first()

    if (!image) throw new BadRequestException('A imagem original da amostra foi alterada', 409)

    row.label = label
    row.reviewed_by = user.id
    row.reviewed_at = DateTime.local()
    await row.save()

    return ctx.response.ok({ id: row.id, label: row.label, reviewed_at: row.reviewed_at })
  }
}
