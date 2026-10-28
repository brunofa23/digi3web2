import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import Application from '@ioc:Adonis/Core/Application'
import Database from '@ioc:Adonis/Lucid/Database'
import IndeximageSideModel from 'App/Models/IndeximageSideModel'

export type BookSideVisualModel = {
  model_id?: number
  active?: boolean
  validation_label_ids?: number[]
  validation_hashes?: Record<string, string>
  version: string
  company_id: number
  typebook_id: number
  book: number
  extractor: string
  extractor_sha256: string
  weights: number[]
  bias: number
  training_samples: { bookrecords_id: number; seq: number; sheet: number; label: string; sha256: string }[]
  development: { correct: number; wrong: number; total: number; folds: any[] }
}

let extractorPromise: Promise<any> | null = null

export async function loadBookSideVisualModel(companyId: number, typebookId: number, book: number, options: { candidate?: boolean; modelId?: number | null } = {}) {
  try {
    const query = IndeximageSideModel.query()
      .where('companies_id', companyId).andWhere('typebooks_id', typebookId).andWhere('book', book)
      .andWhere('status', 'ready')
    if (options.modelId) query.andWhere('id', options.modelId)
    else if (!options.candidate) query.andWhere('active_slot', 1)
    const stored = await query.orderBy('id', 'desc').first()
    if (stored?.model_data) return { ...stored.model_data, model_id: stored.id, active: stored.active_slot === 1, validation_label_ids: stored.validation_label_ids || [] }
    if (options.modelId) return null
  } catch (error) {
    if (error.code !== 'ER_NO_SUCH_TABLE' && error.errno !== 1146) throw error
  }
  const file = Application.resourcesPath(`side-models/${companyId}-${typebookId}-${book}.json`)
  try {
    const model: BookSideVisualModel = JSON.parse(await fs.readFile(file, 'utf8'))
    if (model.company_id !== companyId || model.typebook_id !== typebookId || model.book !== book) {
      throw new Error('Escopo do modelo visual inválido')
    }
    if (model.extractor !== 'Xenova/dinov2-small' || model.weights.length !== 1920) {
      throw new Error('Formato do modelo visual não suportado')
    }
    return model
  } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
}

export async function extractBookSideVisualFeatures(buffer: Buffer, expectedHash?: string) {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      const { pipeline, env } = require('@huggingface/transformers')
      env.cacheDir = Application.tmpPath('side-vision-models')
      // Somente pesos públicos são baixados. As imagens são processadas neste servidor.
      const extractor = await pipeline('image-feature-extraction', 'Xenova/dinov2-small', { dtype: 'q8', device: 'cpu' })
      extractor.processor.image_processor.do_center_crop = false
      extractor.processor.image_processor.size = { width: 224, height: 224 }
      return extractor
    })().catch((error) => {
      extractorPromise = null
      throw error
    })
  }
  const extractor = await extractorPromise
  const encoderFile = path.join(Application.tmpPath('side-vision-models'), 'Xenova/dinov2-small/onnx/model_quantized.onnx')
  const encoderHash = crypto.createHash('sha256').update(await fs.readFile(encoderFile)).digest('hex')
  if (expectedHash && encoderHash !== expectedHash) throw new Error('Pesos do extrator visual diferentes dos usados no treinamento')

  const { RawImage } = require('@huggingface/transformers')
  const { Blob } = require('buffer')
  const image = await RawImage.fromBlob(new Blob([new Uint8Array(buffer)]))
  const features = await extractor(image)
  const [, tokens, dimensions] = features.dims
  if (tokens !== 257 || dimensions !== 384) throw new Error('Dimensões inesperadas no extrator visual')
  const normalize = (values: number[]) => {
    const norm = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0)) || 1
    return values.map((value) => value / norm)
  }
  const result = normalize(Array.from(features.data.slice(0, dimensions)))
  // Pirâmide espacial 2x2: preserva a posição das estruturas da página.
  for (let qy = 0; qy < 2; qy++) {
    for (let qx = 0; qx < 2; qx++) {
      const mean = new Array(dimensions).fill(0)
      for (let y = qy * 8; y < (qy + 1) * 8; y++) {
        for (let x = qx * 8; x < (qx + 1) * 8; x++) {
          const offset = (1 + y * 16 + x) * dimensions
          for (let d = 0; d < dimensions; d++) mean[d] += features.data[offset + d] / 64
        }
      }
      result.push(...normalize(mean))
    }
  }
  return { features: normalize(result), encoderHash }
}

export function predictBookSideVisual(model: BookSideVisualModel, features: number[]) {
  if (features.length !== model.weights.length) throw new Error('Características incompatíveis com o modelo visual')
  const score = features.reduce((sum, value, index) => sum + value * model.weights[index], model.bias)
  if (!Number.isFinite(score)) throw new Error('O modelo visual não produziu um resultado válido')
  return { side: score >= 0 ? 'F' : 'V', score }
}

export async function bookSideVisualReadiness(model: BookSideVisualModel) {
  const training = await Database.from('indeximage_side_labels as labels')
    .join('bookrecords as records', (join) => join.on('records.id', 'labels.bookrecords_id').andOn('records.companies_id', 'labels.companies_id').andOn('records.typebooks_id', 'labels.typebooks_id'))
    .join('indeximages as images', (join) => join.on('images.bookrecords_id', 'labels.bookrecords_id').andOn('images.companies_id', 'labels.companies_id').andOn('images.typebooks_id', 'labels.typebooks_id').andOn('images.seq', 'labels.seq').andOn('images.drive_file_id', 'labels.drive_file_id'))
    .where('labels.companies_id', model.company_id).andWhere('labels.typebooks_id', model.typebook_id).andWhere('records.book', model.book)
    .whereIn('labels.bookrecords_id', model.training_samples.map((sample) => sample.bookrecords_id))
    .select('labels.bookrecords_id', 'labels.seq', 'labels.label', 'records.sheet')
  // A renumeração cadastral não muda a imagem nem o lado revisado.
  const trainingUnchanged = model.training_samples.every((sample) => training.some((row) => Number(row.bookrecords_id) === sample.bookrecords_id && Number(row.seq) === sample.seq && row.label === sample.label))
  const validationQuery = Database.from('indeximage_side_labels as labels')
    .join('bookrecords as records', (join) => join.on('records.id', 'labels.bookrecords_id').andOn('records.companies_id', 'labels.companies_id').andOn('records.typebooks_id', 'labels.typebooks_id'))
    .join('indeximages as images', (join) => join.on('images.bookrecords_id', 'labels.bookrecords_id').andOn('images.companies_id', 'labels.companies_id').andOn('images.typebooks_id', 'labels.typebooks_id').andOn('images.seq', 'labels.seq').andOn('images.drive_file_id', 'labels.drive_file_id'))
    .leftJoin('indeximage_ocr_checks as checks', (join) => join.on('checks.bookrecords_id', 'labels.bookrecords_id').andOn('checks.companies_id', 'labels.companies_id').andOn('checks.typebooks_id', 'labels.typebooks_id').andOn('checks.seq', 'labels.seq').andOnVal('checks.layout_profile', model.version))
    .where('labels.companies_id', model.company_id).andWhere('labels.typebooks_id', model.typebook_id).andWhere('records.book', model.book)
    .whereNotIn('labels.bookrecords_id', model.training_samples.map((sample) => sample.bookrecords_id))
    .whereNotIn('records.sheet', training.map((row) => row.sheet))
    .whereNotIn('records.sheet', model.training_samples.map((sample) => sample.sheet))
    .whereIn('labels.label', ['F', 'V'])
    .select('labels.id', 'labels.label', 'checks.detected_side', 'checks.side_processed_at')
  if (model.validation_label_ids) validationQuery.whereIn('labels.id', model.validation_label_ids)
  const validation = await validationQuery
  const seen = new Set<string>()
  const correct = validation.filter((row) => {
    if (model.validation_hashes) {
      const hash = model.validation_hashes[String(row.id)]
      if (!hash || seen.has(hash)) return false
      seen.add(hash)
    }
    return row.side_processed_at && row.detected_side === row.label
  }).length
  const sides = { F: validation.filter((row) => row.label === 'F').length, V: validation.filter((row) => row.label === 'V').length }
  const complete = validation.length >= 40 && correct === validation.length && sides.F >= 5 && sides.V >= 5
  return { ready: trainingUnchanged && complete, trainingUnchanged, total: validation.length, correct, sides }
}

export async function bookSideModelRegistry(companyId: number, typebookId: number, book: number) {
  try {
    const records = await IndeximageSideModel.query().where('companies_id', companyId)
      .andWhere('typebooks_id', typebookId).andWhere('book', book).orderBy('id', 'desc')
      .select('id', 'companies_id', 'typebooks_id', 'book', 'version', 'status', 'phase', 'processed', 'total', 'training_samples', 'validation_label_ids', 'requested_by', 'active_slot', 'error_message', 'started_at', 'finished_at', 'created_at', 'updated_at')
    return { available: true, records }
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE' || error.errno === 1146) return { available: false, records: [] as IndeximageSideModel[] }
    throw error
  }
}

export function sideModelSummary(model: IndeximageSideModel) {
  return { id: model.id, version: model.version, status: model.status, phase: model.phase,
    processed: model.processed, total: model.total, active: model.active_slot === 1,
    error_message: model.error_message, created_at: model.createdAt, finished_at: model.finished_at }
}
