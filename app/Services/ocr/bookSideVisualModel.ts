import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import Application from '@ioc:Adonis/Core/Application'
import Database from '@ioc:Adonis/Lucid/Database'

export type BookSideVisualModel = {
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

export async function loadBookSideVisualModel(companyId: number, typebookId: number, book: number) {
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
  const training = await Database.from('indeximage_side_labels')
    .where('companies_id', model.company_id).andWhere('typebooks_id', model.typebook_id)
    .whereIn('bookrecords_id', model.training_samples.map((sample) => sample.bookrecords_id))
    .select('bookrecords_id', 'seq', 'label')
  const trainingUnchanged = model.training_samples.every((sample) => training.some((row) => Number(row.bookrecords_id) === sample.bookrecords_id && Number(row.seq) === sample.seq && row.label === sample.label))
  const validation = await Database.from('indeximage_side_labels as labels')
    .join('bookrecords as records', (join) => join.on('records.id', 'labels.bookrecords_id').andOn('records.companies_id', 'labels.companies_id').andOn('records.typebooks_id', 'labels.typebooks_id'))
    .join('indeximages as images', (join) => join.on('images.bookrecords_id', 'labels.bookrecords_id').andOn('images.companies_id', 'labels.companies_id').andOn('images.typebooks_id', 'labels.typebooks_id').andOn('images.seq', 'labels.seq').andOn('images.file_name', 'labels.file_name').andOn('images.drive_file_id', 'labels.drive_file_id'))
    .leftJoin('indeximage_ocr_checks as checks', (join) => join.on('checks.bookrecords_id', 'labels.bookrecords_id').andOn('checks.companies_id', 'labels.companies_id').andOn('checks.typebooks_id', 'labels.typebooks_id').andOn('checks.seq', 'labels.seq').andOnVal('checks.layout_profile', model.version))
    .where('labels.companies_id', model.company_id).andWhere('labels.typebooks_id', model.typebook_id).andWhere('records.book', model.book)
    .whereNotIn('labels.bookrecords_id', model.training_samples.map((sample) => sample.bookrecords_id))
    .whereNotIn('records.sheet', model.training_samples.map((sample) => sample.sheet))
    .whereIn('labels.label', ['F', 'V'])
    .select('labels.label', 'checks.detected_side', 'checks.side_processed_at')
  const correct = validation.filter((row) => row.side_processed_at && row.detected_side === row.label).length
  const complete = validation.length >= 40 && correct === validation.length
  return { ready: trainingUnchanged && complete, trainingUnchanged, total: validation.length, correct }
}
