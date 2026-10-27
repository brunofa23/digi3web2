import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import Application from '@ioc:Adonis/Core/Application'

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
  return { side: score >= 0 ? 'F' : 'V', score }
}
