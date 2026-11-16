import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'
import BadRequestException from 'App/Exceptions/BadRequestException'
import Typebook from 'App/Models/Typebook'
import { verifyPermission } from 'App/Services/util'
import { sendDownloadFileBuffer, sendSearchFile } from 'App/Services/googleDrive/googledrive'
import { extractBookSheetCornerNumber } from 'App/Services/ocr/indexImageOcrConference'

export default class BookSheetConferencesController {
  private async context(ctx: HttpContextContract) {
    const user = await ctx.auth.use('api').authenticate()
    const permissions = ctx.auth.use('api').token?.meta.payload.permissions || []
    if (![44, 54].some((permission) => verifyPermission(Boolean(user.superuser), permissions, permission))) {
      throw new BadRequestException('Acesso à conferência de folhas não permitido', 403)
    }
    const typebooksId = Number(ctx.params.typebooks_id)
    const book = Number(ctx.request.input('book') ?? ctx.request.qs().book)
    if (!Number.isInteger(typebooksId) || typebooksId <= 0 || !Number.isInteger(book) || book <= 0) {
      throw new BadRequestException('Informe um livro válido para conferir folhas', 422)
    }
    const typebook = await Typebook.query().preload('company')
      .where('id', typebooksId).andWhere('companies_id', user.companies_id).first()
    if (!typebook) throw new BadRequestException('Tipo de livro não encontrado', 404)
    return { companyId: user.companies_id, typebooksId, book, typebook }
  }

  private scope(companyId: number, typebooksId: number, book: number) {
    return { companies_id: companyId, typebooks_id: typebooksId, book }
  }

  private async records(companyId: number, typebooksId: number, book: number) {
    const rows = await Database.from('bookrecords as records')
      .leftJoin('indeximages as images', (join) => join.on('images.bookrecords_id', 'records.id')
        .andOn('images.companies_id', 'records.companies_id')
        .andOn('images.typebooks_id', 'records.typebooks_id'))
      .where('records.companies_id', companyId).andWhere('records.typebooks_id', typebooksId)
      .andWhere('records.book', book).andWhere('records.side', 'F')
      .select('records.id as record_id', 'records.cod', 'records.book', 'records.sheet',
        'images.seq', 'images.file_name', 'images.drive_file_id', 'images.drive_folder_id',
        'images.drive_md5_checksum', 'images.original_sha256', 'images.updated_at as image_updated_at')
      .orderBy('records.cod', 'asc').orderBy('records.id', 'asc').orderBy('images.seq', 'asc')
    const unique = new Map<number, any>()
    for (const row of rows) if (!unique.has(Number(row.record_id))) unique.set(Number(row.record_id), row)
    return [...unique.values()]
  }

  private fingerprint(record: any) {
    return [record.drive_file_id || '', record.drive_md5_checksum || record.original_sha256 || '',
      record.image_updated_at || '', record.file_name || '', record.seq ?? ''].join(':').slice(0, 255)
  }

  private async readRecord(scope: { companies_id: number, typebooks_id: number, book: number }, record: any, cloud: number, folderPath: string) {
    const identity = { ...scope, bookrecords_id: Number(record.record_id) }
    const fingerprint = this.fingerprint(record)
    const existing = await Database.from('book_sheet_conference_items').where(identity).first()
    if (existing && existing.file_fingerprint === fingerprint && existing.status !== 'ignored') {
      const status = existing.detected_sheet === null
        ? (record.file_name ? 'not_found' : 'missing_image')
        : Number(existing.detected_sheet) === Number(record.sheet) ? 'match' : 'divergent'
      if (status !== existing.status) await Database.from('book_sheet_conference_items').where(identity)
        .update({ status, updated_at: DateTime.local().toSQL() })
      return { ...existing, ...record, status, cached: true }
    }

    let detectedSheet: number | null = null
    let confidence = 0
    let evidence = record.file_name ? 'Número não encontrado' : 'Imagem não encontrada para esta frente'
    let source: string | null = null
    if (record.file_name) {
      let driveId = record.drive_file_id
      if (!driveId) {
        const folderId = record.drive_folder_id || (await sendSearchFile(folderPath, cloud))?.[0]?.id
        if (!folderId) throw new BadRequestException(`Imagem ${record.file_name} sem pasta no Drive`, 422)
        const found = await sendSearchFile(record.file_name, cloud, folderId)
        driveId = Array.isArray(found) ? found.find((file) => file.name === record.file_name)?.id : null
      }
      if (!driveId) throw new BadRequestException(`Imagem ${record.file_name} não encontrada no Drive`, 422)
      const image = await sendDownloadFileBuffer(driveId, cloud)
      const extracted = await extractBookSheetCornerNumber(image, record.file_name)
      detectedSheet = extracted.detectedSheet
      confidence = extracted.confidence
      evidence = extracted.evidence
      source = extracted.source
    }
    const status = !record.file_name ? 'missing_image'
      : detectedSheet === null ? 'not_found'
        : detectedSheet === Number(record.sheet) ? 'match' : 'divergent'
    const payload = { ...identity, seq: record.seq, file_name: record.file_name, file_fingerprint: fingerprint,
      detected_sheet: detectedSheet, confidence, status, evidence, source,
      processed_at: DateTime.local().toSQL(), updated_at: DateTime.local().toSQL() }
    if (existing) await Database.from('book_sheet_conference_items').where(identity).update(payload)
    else await Database.table('book_sheet_conference_items').insert({ ...payload, created_at: DateTime.local().toSQL() })
    return { ...record, ...payload, cached: false }
  }

  private async state(scope: { companies_id: number, typebooks_id: number, book: number }) {
    return Database.from('book_sheet_conferences').where(scope).first()
  }

  public async index(ctx: HttpContextContract) {
    const { companyId, typebooksId, book } = await this.context(ctx)
    const scope = this.scope(companyId, typebooksId, book)
    const status = String(ctx.request.input('status') || '').trim()
    if (status && !['match', 'divergent', 'not_found', 'missing_image', 'ignored'].includes(status)) {
      throw new BadRequestException('Status inválido', 422)
    }
    const currentStatus = `CASE WHEN items.status = 'ignored' THEN 'ignored'
      WHEN items.file_name IS NULL THEN 'missing_image'
      WHEN items.detected_sheet IS NULL THEN 'not_found'
      WHEN items.detected_sheet = records.sheet THEN 'match' ELSE 'divergent' END`
    const query = Database.from('book_sheet_conference_items as items')
      .join('bookrecords as records', (join) => join.on('records.id', 'items.bookrecords_id')
        .andOn('records.companies_id', 'items.companies_id').andOn('records.typebooks_id', 'items.typebooks_id'))
      .where('items.companies_id', companyId).andWhere('items.typebooks_id', typebooksId).andWhere('items.book', book)
      .select('items.*', 'records.cod', 'records.sheet', 'records.side', Database.raw(`${currentStatus} as current_status`))
      .orderBy('records.cod', 'asc').orderBy('records.id', 'asc')
    if (status) query.whereRaw(`${currentStatus} = ?`, [status])
    const state = await this.state(scope)
    const pending = state?.pending_record_id ? await Database.from('book_sheet_conference_items as items')
      .join('bookrecords as records', 'records.id', 'items.bookrecords_id')
      .where('items.companies_id', companyId).andWhere('items.typebooks_id', typebooksId)
      .andWhere('items.book', book).andWhere('items.bookrecords_id', state.pending_record_id)
      .select('items.*', 'records.cod', 'records.sheet', 'records.side', Database.raw(`${currentStatus} as current_status`)).first() : null
    return ctx.response.ok({ state, pending, items: await query.limit(1000) })
  }

  public async advance(ctx: HttpContextContract) {
    const { companyId, typebooksId, book, typebook } = await this.context(ctx)
    if (!typebook.company?.cloud) throw new BadRequestException('Empresa sem configuração de cloud', 422)
    const scope = this.scope(companyId, typebooksId, book)
    const records = await this.records(companyId, typebooksId, book)
    if (!records.length) throw new BadRequestException('Nenhuma frente cadastrada com lado F neste livro', 422)
    let state = await this.state(scope)
    if (!state) {
      await Database.table('book_sheet_conferences').insert({ ...scope, status: 'active', checked_count: 0,
        created_at: DateTime.local().toSQL(), updated_at: DateTime.local().toSQL() })
      state = await this.state(scope)
    }
    const position = (id: number | null) => records.findIndex((record) => Number(record.record_id) === Number(id))
    let lastIndex = state.last_record_id ? position(state.last_record_id) : -1
    if (state.last_record_id && lastIndex < 0) throw new BadRequestException('A ordem das frentes mudou. Revise este livro antes de continuar', 409)
    if (state.pending_record_id) {
      const pendingIndex = position(state.pending_record_id)
      if (pendingIndex < 0) throw new BadRequestException('A frente pendente mudou. Revise este livro antes de continuar', 409)
      const pending = await this.readRecord(scope, records[pendingIndex], typebook.company.cloud, typebook.path)
      if (pending.status !== 'match') return ctx.response.ok({ state, pending, total: records.length })
      lastIndex = pendingIndex
      await Database.from('book_sheet_conferences').where(scope).update({ last_record_id: pending.record_id,
        pending_record_id: null,
        target_record_id: Number(state.target_record_id) === Number(pending.record_id) ? null : state.target_record_id,
        status: 'active', updated_at: DateTime.local().toSQL() })
      state = await this.state(scope)
    }
    if (lastIndex >= records.length - 1) {
      await Database.from('book_sheet_conferences').where(scope).update({ status: 'completed', updated_at: DateTime.local().toSQL() })
      return ctx.response.ok({ state: await this.state(scope), pending: null, total: records.length })
    }

    const targetIndex = state.target_record_id ? position(state.target_record_id) : -1
    if (state.target_record_id && targetIndex < 0) throw new BadRequestException('O ponto de retomada mudou. Revise este livro antes de continuar', 409)
    const checkpoint = targetIndex > lastIndex ? targetIndex
      : lastIndex < 0 ? 0 : Math.min(lastIndex === 0 ? 9 : lastIndex + 10, records.length - 1)
    const selected = await this.readRecord(scope, records[checkpoint], typebook.company.cloud, typebook.path)
    let pending: any = selected.status === 'match' ? null : selected
    let checked = selected.cached ? 0 : 1
    if (pending && checkpoint > lastIndex + 1) {
      const sampled = [checkpoint - 5, checkpoint - 3, checkpoint - 1]
        .filter((index) => index > lastIndex && index < checkpoint)
      let previousMatch = lastIndex
      for (const index of [...sampled, checkpoint]) {
        const result = index === checkpoint ? selected : await this.readRecord(scope, records[index], typebook.company.cloud, typebook.path)
        if (index !== checkpoint && !result.cached) checked++
        if (result.status === 'match') { previousMatch = index; continue }
        pending = result
        for (let adjacent = previousMatch + 1; adjacent < index; adjacent++) {
          const earlier = await this.readRecord(scope, records[adjacent], typebook.company.cloud, typebook.path)
          if (!earlier.cached) checked++
          if (earlier.status !== 'match') { pending = earlier; break }
        }
        break
      }
    }
    await Database.from('book_sheet_conferences').where(scope).update({
      last_record_id: pending ? state.last_record_id : selected.record_id,
      pending_record_id: pending?.record_id || null,
      target_record_id: pending && Number(pending.record_id) !== Number(selected.record_id)
        ? selected.record_id : null,
      status: pending ? 'pending' : checkpoint === records.length - 1 ? 'completed' : 'active',
      checked_count: Number(state.checked_count || 0) + checked,
      updated_at: DateTime.local().toSQL(),
    })
    return ctx.response.ok({ state: await this.state(scope), pending, total: records.length,
      checked, checkpoint: checkpoint + 1 })
  }

  public async ignore(ctx: HttpContextContract) {
    const { companyId, typebooksId, book } = await this.context(ctx)
    const scope = this.scope(companyId, typebooksId, book)
    const state = await this.state(scope)
    if (!state?.pending_record_id) throw new BadRequestException('Não há pendência para confirmar', 422)
    const record = await Database.from('bookrecords').where('id', state.pending_record_id)
      .andWhere('companies_id', companyId).andWhere('typebooks_id', typebooksId).andWhere('book', book).first()
    if (!record) throw new BadRequestException('Registro pendente não encontrado', 404)
    await Database.transaction(async (trx) => {
      await Database.from('book_sheet_conference_items').useTransaction(trx).where({ ...scope, bookrecords_id: record.id })
        .update({ status: 'ignored', updated_at: DateTime.local().toSQL() })
      await Database.from('book_sheet_conferences').useTransaction(trx).where(scope)
        .update({ last_record_id: record.id, pending_record_id: null,
          target_record_id: Number(state.target_record_id) === Number(record.id) ? null : state.target_record_id,
          status: 'active', updated_at: DateTime.local().toSQL() })
    })
    return ctx.response.ok({ state: await this.state(scope) })
  }
}
