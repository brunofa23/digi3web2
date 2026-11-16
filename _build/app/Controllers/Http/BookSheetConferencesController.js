"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const luxon_1 = require("luxon");
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const Typebook_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Typebook"));
const util_1 = global[Symbol.for('ioc.use')]("App/Services/util");
const googledrive_1 = global[Symbol.for('ioc.use')]("App/Services/googleDrive/googledrive");
const indexImageOcrConference_1 = global[Symbol.for('ioc.use')]("App/Services/ocr/indexImageOcrConference");
class BookSheetConferencesController {
    async context(ctx) {
        const user = await ctx.auth.use('api').authenticate();
        const permissions = ctx.auth.use('api').token?.meta.payload.permissions || [];
        if (![44, 54].some((permission) => (0, util_1.verifyPermission)(Boolean(user.superuser), permissions, permission))) {
            throw new BadRequestException_1.default('Acesso à conferência de folhas não permitido', 403);
        }
        const typebooksId = Number(ctx.params.typebooks_id);
        const book = Number(ctx.request.input('book') ?? ctx.request.qs().book);
        if (!Number.isInteger(typebooksId) || typebooksId <= 0 || !Number.isInteger(book) || book <= 0) {
            throw new BadRequestException_1.default('Informe um livro válido para conferir folhas', 422);
        }
        const typebook = await Typebook_1.default.query().preload('company')
            .where('id', typebooksId).andWhere('companies_id', user.companies_id).first();
        if (!typebook)
            throw new BadRequestException_1.default('Tipo de livro não encontrado', 404);
        return { companyId: user.companies_id, typebooksId, book, typebook };
    }
    scope(companyId, typebooksId, book) {
        return { companies_id: companyId, typebooks_id: typebooksId, book };
    }
    async records(companyId, typebooksId, book) {
        const rows = await Database_1.default.from('bookrecords as records')
            .leftJoin('indeximages as images', (join) => join.on('images.bookrecords_id', 'records.id')
            .andOn('images.companies_id', 'records.companies_id')
            .andOn('images.typebooks_id', 'records.typebooks_id'))
            .where('records.companies_id', companyId).andWhere('records.typebooks_id', typebooksId)
            .andWhere('records.book', book).andWhere('records.side', 'F')
            .select('records.id as record_id', 'records.cod', 'records.book', 'records.sheet', 'images.seq', 'images.file_name', 'images.drive_file_id', 'images.drive_folder_id', 'images.drive_md5_checksum', 'images.original_sha256', 'images.updated_at as image_updated_at')
            .orderBy('records.cod', 'asc').orderBy('records.id', 'asc').orderBy('images.seq', 'asc');
        const unique = new Map();
        for (const row of rows)
            if (!unique.has(Number(row.record_id)))
                unique.set(Number(row.record_id), row);
        return [...unique.values()];
    }
    fingerprint(record) {
        return [record.drive_file_id || '', record.drive_md5_checksum || record.original_sha256 || '',
            record.image_updated_at || '', record.file_name || '', record.seq ?? ''].join(':').slice(0, 255);
    }
    async readRecord(scope, record, cloud, folderPath) {
        const identity = { ...scope, bookrecords_id: Number(record.record_id) };
        const fingerprint = this.fingerprint(record);
        const existing = await Database_1.default.from('book_sheet_conference_items').where(identity).first();
        if (existing && existing.file_fingerprint === fingerprint && existing.status !== 'ignored') {
            const status = existing.detected_sheet === null
                ? (record.file_name ? 'not_found' : 'missing_image')
                : Number(existing.detected_sheet) === Number(record.sheet) ? 'match' : 'divergent';
            if (status !== existing.status)
                await Database_1.default.from('book_sheet_conference_items').where(identity)
                    .update({ status, updated_at: luxon_1.DateTime.local().toSQL() });
            return { ...existing, ...record, status, cached: true };
        }
        let detectedSheet = null;
        let confidence = 0;
        let evidence = record.file_name ? 'Número não encontrado' : 'Imagem não encontrada para esta frente';
        let source = null;
        if (record.file_name) {
            let driveId = record.drive_file_id;
            if (!driveId) {
                const folderId = record.drive_folder_id || (await (0, googledrive_1.sendSearchFile)(folderPath, cloud))?.[0]?.id;
                if (!folderId)
                    throw new BadRequestException_1.default(`Imagem ${record.file_name} sem pasta no Drive`, 422);
                const found = await (0, googledrive_1.sendSearchFile)(record.file_name, cloud, folderId);
                driveId = Array.isArray(found) ? found.find((file) => file.name === record.file_name)?.id : null;
            }
            if (!driveId)
                throw new BadRequestException_1.default(`Imagem ${record.file_name} não encontrada no Drive`, 422);
            const image = await (0, googledrive_1.sendDownloadFileBuffer)(driveId, cloud);
            const extracted = await (0, indexImageOcrConference_1.extractBookSheetCornerNumber)(image, record.file_name);
            detectedSheet = extracted.detectedSheet;
            confidence = extracted.confidence;
            evidence = extracted.evidence;
            source = extracted.source;
        }
        const status = !record.file_name ? 'missing_image'
            : detectedSheet === null ? 'not_found'
                : detectedSheet === Number(record.sheet) ? 'match' : 'divergent';
        const payload = { ...identity, seq: record.seq, file_name: record.file_name, file_fingerprint: fingerprint,
            detected_sheet: detectedSheet, confidence, status, evidence, source,
            processed_at: luxon_1.DateTime.local().toSQL(), updated_at: luxon_1.DateTime.local().toSQL() };
        if (existing)
            await Database_1.default.from('book_sheet_conference_items').where(identity).update(payload);
        else
            await Database_1.default.table('book_sheet_conference_items').insert({ ...payload, created_at: luxon_1.DateTime.local().toSQL() });
        return { ...record, ...payload, cached: false };
    }
    async state(scope) {
        return Database_1.default.from('book_sheet_conferences').where(scope).first();
    }
    async index(ctx) {
        const { companyId, typebooksId, book } = await this.context(ctx);
        const scope = this.scope(companyId, typebooksId, book);
        const status = String(ctx.request.input('status') || '').trim();
        if (status && !['match', 'divergent', 'not_found', 'missing_image', 'ignored'].includes(status)) {
            throw new BadRequestException_1.default('Status inválido', 422);
        }
        const currentStatus = `CASE WHEN items.status = 'ignored' THEN 'ignored'
      WHEN items.file_name IS NULL THEN 'missing_image'
      WHEN items.detected_sheet IS NULL THEN 'not_found'
      WHEN items.detected_sheet = records.sheet THEN 'match' ELSE 'divergent' END`;
        const query = Database_1.default.from('book_sheet_conference_items as items')
            .join('bookrecords as records', (join) => join.on('records.id', 'items.bookrecords_id')
            .andOn('records.companies_id', 'items.companies_id').andOn('records.typebooks_id', 'items.typebooks_id'))
            .where('items.companies_id', companyId).andWhere('items.typebooks_id', typebooksId).andWhere('items.book', book)
            .select('items.*', 'records.cod', 'records.sheet', 'records.side', Database_1.default.raw(`${currentStatus} as current_status`))
            .orderBy('records.cod', 'asc').orderBy('records.id', 'asc');
        if (status)
            query.whereRaw(`${currentStatus} = ?`, [status]);
        const state = await this.state(scope);
        const pending = state?.pending_record_id ? await Database_1.default.from('book_sheet_conference_items as items')
            .join('bookrecords as records', 'records.id', 'items.bookrecords_id')
            .where('items.companies_id', companyId).andWhere('items.typebooks_id', typebooksId)
            .andWhere('items.book', book).andWhere('items.bookrecords_id', state.pending_record_id)
            .select('items.*', 'records.cod', 'records.sheet', 'records.side', Database_1.default.raw(`${currentStatus} as current_status`)).first() : null;
        return ctx.response.ok({ state, pending, items: await query.limit(1000) });
    }
    async advance(ctx) {
        const { companyId, typebooksId, book, typebook } = await this.context(ctx);
        if (!typebook.company?.cloud)
            throw new BadRequestException_1.default('Empresa sem configuração de cloud', 422);
        const scope = this.scope(companyId, typebooksId, book);
        const records = await this.records(companyId, typebooksId, book);
        if (!records.length)
            throw new BadRequestException_1.default('Nenhuma frente cadastrada com lado F neste livro', 422);
        let state = await this.state(scope);
        if (!state) {
            await Database_1.default.table('book_sheet_conferences').insert({ ...scope, status: 'active', checked_count: 0,
                created_at: luxon_1.DateTime.local().toSQL(), updated_at: luxon_1.DateTime.local().toSQL() });
            state = await this.state(scope);
        }
        const position = (id) => records.findIndex((record) => Number(record.record_id) === Number(id));
        let lastIndex = state.last_record_id ? position(state.last_record_id) : -1;
        if (state.last_record_id && lastIndex < 0)
            throw new BadRequestException_1.default('A ordem das frentes mudou. Revise este livro antes de continuar', 409);
        if (state.pending_record_id) {
            const pendingIndex = position(state.pending_record_id);
            if (pendingIndex < 0)
                throw new BadRequestException_1.default('A frente pendente mudou. Revise este livro antes de continuar', 409);
            const pending = await this.readRecord(scope, records[pendingIndex], typebook.company.cloud, typebook.path);
            if (pending.status !== 'match')
                return ctx.response.ok({ state, pending, total: records.length });
            lastIndex = pendingIndex;
            await Database_1.default.from('book_sheet_conferences').where(scope).update({ last_record_id: pending.record_id,
                pending_record_id: null,
                target_record_id: Number(state.target_record_id) === Number(pending.record_id) ? null : state.target_record_id,
                status: 'active', updated_at: luxon_1.DateTime.local().toSQL() });
            state = await this.state(scope);
        }
        if (lastIndex >= records.length - 1) {
            await Database_1.default.from('book_sheet_conferences').where(scope).update({ status: 'completed', updated_at: luxon_1.DateTime.local().toSQL() });
            return ctx.response.ok({ state: await this.state(scope), pending: null, total: records.length });
        }
        const targetIndex = state.target_record_id ? position(state.target_record_id) : -1;
        if (state.target_record_id && targetIndex < 0)
            throw new BadRequestException_1.default('O ponto de retomada mudou. Revise este livro antes de continuar', 409);
        const checkpoint = targetIndex > lastIndex ? targetIndex
            : lastIndex < 0 ? 0 : Math.min(lastIndex === 0 ? 9 : lastIndex + 10, records.length - 1);
        const selected = await this.readRecord(scope, records[checkpoint], typebook.company.cloud, typebook.path);
        let pending = selected.status === 'match' ? null : selected;
        let checked = selected.cached ? 0 : 1;
        if (pending && checkpoint > lastIndex + 1) {
            const sampled = [checkpoint - 5, checkpoint - 3, checkpoint - 1]
                .filter((index) => index > lastIndex && index < checkpoint);
            let previousMatch = lastIndex;
            for (const index of [...sampled, checkpoint]) {
                const result = index === checkpoint ? selected : await this.readRecord(scope, records[index], typebook.company.cloud, typebook.path);
                if (index !== checkpoint && !result.cached)
                    checked++;
                if (result.status === 'match') {
                    previousMatch = index;
                    continue;
                }
                pending = result;
                for (let adjacent = previousMatch + 1; adjacent < index; adjacent++) {
                    const earlier = await this.readRecord(scope, records[adjacent], typebook.company.cloud, typebook.path);
                    if (!earlier.cached)
                        checked++;
                    if (earlier.status !== 'match') {
                        pending = earlier;
                        break;
                    }
                }
                break;
            }
        }
        await Database_1.default.from('book_sheet_conferences').where(scope).update({
            last_record_id: pending ? state.last_record_id : selected.record_id,
            pending_record_id: pending?.record_id || null,
            target_record_id: pending && Number(pending.record_id) !== Number(selected.record_id)
                ? selected.record_id : null,
            status: pending ? 'pending' : checkpoint === records.length - 1 ? 'completed' : 'active',
            checked_count: Number(state.checked_count || 0) + checked,
            updated_at: luxon_1.DateTime.local().toSQL(),
        });
        return ctx.response.ok({ state: await this.state(scope), pending, total: records.length,
            checked, checkpoint: checkpoint + 1 });
    }
    async ignore(ctx) {
        const { companyId, typebooksId, book } = await this.context(ctx);
        const scope = this.scope(companyId, typebooksId, book);
        const state = await this.state(scope);
        if (!state?.pending_record_id)
            throw new BadRequestException_1.default('Não há pendência para confirmar', 422);
        const record = await Database_1.default.from('bookrecords').where('id', state.pending_record_id)
            .andWhere('companies_id', companyId).andWhere('typebooks_id', typebooksId).andWhere('book', book).first();
        if (!record)
            throw new BadRequestException_1.default('Registro pendente não encontrado', 404);
        await Database_1.default.transaction(async (trx) => {
            await Database_1.default.from('book_sheet_conference_items').useTransaction(trx).where({ ...scope, bookrecords_id: record.id })
                .update({ status: 'ignored', updated_at: luxon_1.DateTime.local().toSQL() });
            await Database_1.default.from('book_sheet_conferences').useTransaction(trx).where(scope)
                .update({ last_record_id: record.id, pending_record_id: null,
                target_record_id: Number(state.target_record_id) === Number(record.id) ? null : state.target_record_id,
                status: 'active', updated_at: luxon_1.DateTime.local().toSQL() });
        });
        return ctx.response.ok({ state: await this.state(scope) });
    }
}
exports.default = BookSheetConferencesController;
//# sourceMappingURL=BookSheetConferencesController.js.map