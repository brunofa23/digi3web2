"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const standalone_1 = require("@adonisjs/core/build/standalone");
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const Indeximage_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Indeximage"));
const indexImageOcrConference_1 = global[Symbol.for('ioc.use')]("App/Services/ocr/indexImageOcrConference");
const LEGACY_BACKFILL_SOURCE = 'legacy_indeximage_backfill';
class BackfillIndeximageOcrEntities extends standalone_1.BaseCommand {
    constructor() {
        super(...arguments);
        this.limit = 200;
        this.dryRun = false;
        this.force = false;
        this.includeProcessed = false;
    }
    async run() {
        const companiesId = Number(this.company);
        const limit = Number(this.limit || 200);
        if (!Number.isInteger(companiesId) || companiesId <= 0) {
            this.logger.error('Informe uma empresa válida. Exemplo: --company=10 --limit=200');
            return;
        }
        if (!Number.isInteger(limit) || limit <= 0 || limit > 2000) {
            this.logger.error('Informe um limite entre 1 e 2000. Exemplo: --limit=200');
            return;
        }
        if (this.includeProcessed) {
            this.logger.warning('include-processed ativo: imagens com OCR novo também poderão receber entidades legadas.');
        }
        const images = await this.getCandidateImages(companiesId, limit);
        if (!images.length) {
            this.logger.info('Nenhuma imagem legada pendente encontrada para migração.');
            return;
        }
        const summary = {
            selected: images.length,
            processed: 0,
            created: 0,
            skipped: 0,
            errors: 0,
        };
        for (const image of images) {
            const entities = this.buildEntities(image);
            if (!entities.length) {
                summary.skipped++;
                continue;
            }
            if (this.dryRun) {
                summary.processed++;
                summary.created += entities.length;
                this.logger.info(`DRY-RUN imagem bookrecord=${image.bookrecords_id}, seq=${image.seq}: ${entities.length} entidade(s).`);
                continue;
            }
            try {
                await this.persistEntities(image, entities);
                summary.processed++;
                summary.created += entities.length;
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                summary.errors++;
                this.logger.error(`Erro ao migrar imagem bookrecord=${image.bookrecords_id}, seq=${image.seq}: ${message}`);
            }
        }
        this.logger.info(`Resumo: selecionadas=${summary.selected}, processadas=${summary.processed}, entidades=${summary.created}, ignoradas=${summary.skipped}, erros=${summary.errors}`);
    }
    async getCandidateImages(companiesId, limit) {
        const query = Indeximage_1.default
            .query()
            .where('companies_id', companiesId)
            .andWhere((legacyQuery) => {
            legacyQuery.where((fieldQuery) => this.whereFilled(fieldQuery, 'name'));
            legacyQuery.orWhere((fieldQuery) => this.whereFilled(fieldQuery, 'cpf'));
            legacyQuery.orWhere((fieldQuery) => this.whereFilled(fieldQuery, 'index_text'));
        })
            .orderBy('typebooks_id', 'asc')
            .orderBy('bookrecords_id', 'asc')
            .orderBy('seq', 'asc')
            .limit(limit);
        if (!this.includeProcessed) {
            query.whereNotExists((entityQuery) => {
                this.applyEntityImageScope(entityQuery);
                entityQuery.andWhere((sourceQuery) => {
                    sourceQuery.whereNull('entities.source');
                    sourceQuery.orWhere('entities.source', '<>', LEGACY_BACKFILL_SOURCE);
                });
            });
        }
        if (!this.force) {
            query.whereNotExists((entityQuery) => {
                this.applyEntityImageScope(entityQuery);
                entityQuery.andWhere('entities.source', LEGACY_BACKFILL_SOURCE);
            });
        }
        return query;
    }
    whereFilled(query, column) {
        query.whereNotNull(column);
        query.where(column, '<>', '');
    }
    applyEntityImageScope(query) {
        query
            .select('*')
            .from('indeximage_ocr_entities as entities')
            .whereRaw('entities.companies_id = indeximages.companies_id')
            .whereRaw('entities.typebooks_id = indeximages.typebooks_id')
            .whereRaw('entities.bookrecords_id = indeximages.bookrecords_id')
            .whereRaw('entities.seq = indeximages.seq');
    }
    buildEntities(image) {
        const entities = [];
        const explicitName = this.cleanName(image.name);
        const hasIndexText = String(image.index_text || '').trim() !== '';
        if (explicitName && explicitName.split(' ').length >= 2) {
            entities.push({
                entity_type: 'name',
                value: explicitName,
                normalized_value: (0, indexImageOcrConference_1.normalizeOcrSearchValue)(explicitName),
                confidence: 0.93,
                evidence_text: null,
            });
        }
        for (const document of this.extractLegacyDocuments(image.cpf)) {
            entities.push({
                entity_type: 'document',
                value: document,
                normalized_value: document,
                confidence: 0.9,
                evidence_text: null,
            });
        }
        entities.push(...(0, indexImageOcrConference_1.extractOcrEntitiesFromText)(String(image.index_text || ''), {
            detectedSheet: hasIndexText ? Number(image.sheet || 0) || null : null,
            detectedTerm: hasIndexText ? Number(image.register || 0) || null : null,
            sheetConfidence: 0.88,
            termConfidence: 0.88,
        }).map((entity) => ({
            ...entity,
            evidence_text: null,
        })));
        return this.uniqueEntities(entities);
    }
    cleanName(value) {
        return String(value || '')
            .replace(/[^A-Za-zÀ-ÖØ-öø-ÿ' ]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 255);
    }
    extractLegacyDocuments(value) {
        const text = String(value || '');
        const matches = text.match(/\d[\d.\-/ ]{3,}\d/g) || [];
        const documents = [...matches, text]
            .map((item) => item.replace(/\D/g, ''))
            .filter((item) => item.length >= 5 && item.length <= 20)
            .filter((item) => !/^(\d)\1+$/.test(item));
        return Array.from(new Set(documents));
    }
    uniqueEntities(entities) {
        const found = new Map();
        for (const entity of entities) {
            const normalizedValue = String(entity.normalized_value || '').slice(0, 255);
            if (!normalizedValue)
                continue;
            const normalizedEntity = {
                ...entity,
                value: String(entity.value || '').trim().slice(0, 255),
                normalized_value: normalizedValue,
                evidence_text: null,
            };
            const key = `${normalizedEntity.entity_type}:${normalizedEntity.normalized_value}`;
            const current = found.get(key);
            if (!current || normalizedEntity.confidence > current.confidence) {
                found.set(key, normalizedEntity);
            }
        }
        return Array.from(found.values());
    }
    async persistEntities(image, entities) {
        await Database_1.default.transaction(async (trx) => {
            await Database_1.default
                .from('indeximage_ocr_entities')
                .useTransaction(trx)
                .where('companies_id', image.companies_id)
                .andWhere('typebooks_id', image.typebooks_id)
                .andWhere('bookrecords_id', image.bookrecords_id)
                .andWhere('seq', image.seq)
                .andWhere('source', LEGACY_BACKFILL_SOURCE)
                .delete();
            const now = new Date();
            await Database_1.default
                .table('indeximage_ocr_entities')
                .useTransaction(trx)
                .insert(entities.map((entity) => ({
                companies_id: image.companies_id,
                typebooks_id: image.typebooks_id,
                bookrecords_id: image.bookrecords_id,
                seq: image.seq,
                entity_type: entity.entity_type,
                value: entity.value,
                normalized_value: entity.normalized_value,
                normalized_hash: (0, indexImageOcrConference_1.hashOcrSearchValue)(entity.normalized_value),
                confidence: entity.confidence,
                source: LEGACY_BACKFILL_SOURCE,
                evidence_text: null,
                position_json: null,
                review_status: 'pending',
                created_at: now,
                updated_at: now,
            })));
        });
    }
}
BackfillIndeximageOcrEntities.commandName = 'ocr:backfill-entities';
BackfillIndeximageOcrEntities.description = 'Migra dados OCR legados de indeximages para indeximage_ocr_entities';
BackfillIndeximageOcrEntities.settings = {
    loadApp: true,
};
__decorate([
    standalone_1.flags.number({ description: 'ID da empresa que será processada' }),
    __metadata("design:type", Number)
], BackfillIndeximageOcrEntities.prototype, "company", void 0);
__decorate([
    standalone_1.flags.number({ description: 'Quantidade máxima de imagens para processar no lote' }),
    __metadata("design:type", Number)
], BackfillIndeximageOcrEntities.prototype, "limit", void 0);
__decorate([
    standalone_1.flags.boolean({ description: 'Apenas simula a migração, sem gravar no banco' }),
    __metadata("design:type", Boolean)
], BackfillIndeximageOcrEntities.prototype, "dryRun", void 0);
__decorate([
    standalone_1.flags.boolean({ description: 'Recria entidades legadas já migradas anteriormente' }),
    __metadata("design:type", Boolean)
], BackfillIndeximageOcrEntities.prototype, "force", void 0);
__decorate([
    standalone_1.flags.boolean({ description: 'Inclui imagens que já possuem entidades OCR novas' }),
    __metadata("design:type", Boolean)
], BackfillIndeximageOcrEntities.prototype, "includeProcessed", void 0);
exports.default = BackfillIndeximageOcrEntities;
//# sourceMappingURL=BackfillIndeximageOcrEntities.js.map