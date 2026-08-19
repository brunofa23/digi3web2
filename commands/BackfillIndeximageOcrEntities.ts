import { BaseCommand, flags } from '@adonisjs/core/build/standalone'
import Database from '@ioc:Adonis/Lucid/Database'
import Indeximage from 'App/Models/Indeximage'
import {
  OcrEntity,
  extractOcrEntitiesFromText,
  hashOcrSearchValue,
  normalizeOcrSearchValue,
} from 'App/Services/ocr/indexImageOcrConference'

const LEGACY_BACKFILL_SOURCE = 'legacy_indeximage_backfill'

export default class BackfillIndeximageOcrEntities extends BaseCommand {
  public static commandName = 'ocr:backfill-entities'
  public static description = 'Migra dados OCR legados de indeximages para indeximage_ocr_entities'

  public static settings = {
    loadApp: true,
  }

  @flags.number({ description: 'ID da empresa que será processada' })
  public company: number

  @flags.number({ description: 'Quantidade máxima de imagens para processar no lote' })
  public limit: number = 200

  @flags.boolean({ description: 'Apenas simula a migração, sem gravar no banco' })
  public dryRun: boolean = false

  @flags.boolean({ description: 'Recria entidades legadas já migradas anteriormente' })
  public force: boolean = false

  @flags.boolean({ description: 'Inclui imagens que já possuem entidades OCR novas' })
  public includeProcessed: boolean = false

  public async run() {
    const companiesId = Number(this.company)
    const limit = Number(this.limit || 200)

    if (!Number.isInteger(companiesId) || companiesId <= 0) {
      this.logger.error('Informe uma empresa válida. Exemplo: --company=10 --limit=200')
      return
    }

    if (!Number.isInteger(limit) || limit <= 0 || limit > 2000) {
      this.logger.error('Informe um limite entre 1 e 2000. Exemplo: --limit=200')
      return
    }

    if (this.includeProcessed) {
      this.logger.warning('include-processed ativo: imagens com OCR novo também poderão receber entidades legadas.')
    }

    const images = await this.getCandidateImages(companiesId, limit)

    if (!images.length) {
      this.logger.info('Nenhuma imagem legada pendente encontrada para migração.')
      return
    }

    const summary = {
      selected: images.length,
      processed: 0,
      created: 0,
      skipped: 0,
      errors: 0,
    }

    for (const image of images) {
      const entities = this.buildEntities(image)

      if (!entities.length) {
        summary.skipped++
        continue
      }

      if (this.dryRun) {
        summary.processed++
        summary.created += entities.length
        this.logger.info(
          `DRY-RUN imagem bookrecord=${image.bookrecords_id}, seq=${image.seq}: ${entities.length} entidade(s).`
        )
        continue
      }

      try {
        await this.persistEntities(image, entities)
        summary.processed++
        summary.created += entities.length
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)

        summary.errors++
        this.logger.error(
          `Erro ao migrar imagem bookrecord=${image.bookrecords_id}, seq=${image.seq}: ${message}`
        )
      }
    }

    this.logger.info(
      `Resumo: selecionadas=${summary.selected}, processadas=${summary.processed}, entidades=${summary.created}, ignoradas=${summary.skipped}, erros=${summary.errors}`
    )
  }

  private async getCandidateImages(companiesId: number, limit: number) {
    const query = Indeximage
      .query()
      .where('companies_id', companiesId)
      .andWhere((legacyQuery) => {
        legacyQuery.where((fieldQuery) => this.whereFilled(fieldQuery, 'name'))
        legacyQuery.orWhere((fieldQuery) => this.whereFilled(fieldQuery, 'cpf'))
        legacyQuery.orWhere((fieldQuery) => this.whereFilled(fieldQuery, 'index_text'))
      })
      .orderBy('typebooks_id', 'asc')
      .orderBy('bookrecords_id', 'asc')
      .orderBy('seq', 'asc')
      .limit(limit)

    if (!this.includeProcessed) {
      query.whereNotExists((entityQuery) => {
        this.applyEntityImageScope(entityQuery)
        entityQuery.andWhere((sourceQuery) => {
          sourceQuery.whereNull('entities.source')
          sourceQuery.orWhere('entities.source', '<>', LEGACY_BACKFILL_SOURCE)
        })
      })
    }

    if (!this.force) {
      query.whereNotExists((entityQuery) => {
        this.applyEntityImageScope(entityQuery)
        entityQuery.andWhere('entities.source', LEGACY_BACKFILL_SOURCE)
      })
    }

    return query
  }

  private whereFilled(query: any, column: string) {
    query.whereNotNull(column)
    query.where(column, '<>', '')
  }

  private applyEntityImageScope(query: any) {
    query
      .select('*')
      .from('indeximage_ocr_entities as entities')
      .whereRaw('entities.companies_id = indeximages.companies_id')
      .whereRaw('entities.typebooks_id = indeximages.typebooks_id')
      .whereRaw('entities.bookrecords_id = indeximages.bookrecords_id')
      .whereRaw('entities.seq = indeximages.seq')
  }

  private buildEntities(image: Indeximage) {
    const entities: OcrEntity[] = []
    const explicitName = this.cleanName(image.name)
    const hasIndexText = String(image.index_text || '').trim() !== ''

    if (explicitName && explicitName.split(' ').length >= 2) {
      entities.push({
        entity_type: 'name',
        value: explicitName,
        normalized_value: normalizeOcrSearchValue(explicitName),
        confidence: 0.93,
        evidence_text: null,
      })
    }

    for (const document of this.extractLegacyDocuments(image.cpf)) {
      entities.push({
        entity_type: 'document',
        value: document,
        normalized_value: document,
        confidence: 0.9,
        evidence_text: null,
      })
    }

    entities.push(
      ...extractOcrEntitiesFromText(String(image.index_text || ''), {
        detectedSheet: hasIndexText ? Number(image.sheet || 0) || null : null,
        detectedTerm: hasIndexText ? Number(image.register || 0) || null : null,
        sheetConfidence: 0.88,
        termConfidence: 0.88,
      }).map((entity) => ({
        ...entity,
        evidence_text: null,
      }))
    )

    return this.uniqueEntities(entities)
  }

  private cleanName(value: string) {
    return String(value || '')
      .replace(/[^A-Za-zÀ-ÖØ-öø-ÿ' ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 255)
  }

  private extractLegacyDocuments(value: string) {
    const text = String(value || '')
    const matches = text.match(/\d[\d.\-/ ]{3,}\d/g) || []
    const documents = [...matches, text]
      .map((item) => item.replace(/\D/g, ''))
      .filter((item) => item.length >= 5 && item.length <= 20)
      .filter((item) => !/^(\d)\1+$/.test(item))

    return Array.from(new Set(documents))
  }

  private uniqueEntities(entities: OcrEntity[]) {
    const found = new Map<string, OcrEntity>()

    for (const entity of entities) {
      const normalizedValue = String(entity.normalized_value || '').slice(0, 255)

      if (!normalizedValue) continue

      const normalizedEntity = {
        ...entity,
        value: String(entity.value || '').trim().slice(0, 255),
        normalized_value: normalizedValue,
        evidence_text: null,
      }
      const key = `${normalizedEntity.entity_type}:${normalizedEntity.normalized_value}`
      const current = found.get(key)

      if (!current || normalizedEntity.confidence > current.confidence) {
        found.set(key, normalizedEntity)
      }
    }

    return Array.from(found.values())
  }

  private async persistEntities(image: Indeximage, entities: OcrEntity[]) {
    await Database.transaction(async (trx) => {
      await Database
        .from('indeximage_ocr_entities')
        .useTransaction(trx)
        .where('companies_id', image.companies_id)
        .andWhere('typebooks_id', image.typebooks_id)
        .andWhere('bookrecords_id', image.bookrecords_id)
        .andWhere('seq', image.seq)
        .andWhere('source', LEGACY_BACKFILL_SOURCE)
        .delete()

      const now = new Date()

      await Database
        .table('indeximage_ocr_entities')
        .useTransaction(trx)
        .insert(
          entities.map((entity) => ({
            companies_id: image.companies_id,
            typebooks_id: image.typebooks_id,
            bookrecords_id: image.bookrecords_id,
            seq: image.seq,
            entity_type: entity.entity_type,
            value: entity.value,
            normalized_value: entity.normalized_value,
            normalized_hash: hashOcrSearchValue(entity.normalized_value),
            confidence: entity.confidence,
            source: LEGACY_BACKFILL_SOURCE,
            evidence_text: null,
            position_json: null,
            review_status: 'pending',
            created_at: now,
            updated_at: now,
          }))
        )
    })
  }
}
