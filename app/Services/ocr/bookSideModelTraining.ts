import crypto from 'crypto'
import { Worker } from 'worker_threads'
import { DateTime } from 'luxon'
import Application from '@ioc:Adonis/Core/Application'
import Database from '@ioc:Adonis/Lucid/Database'
import IndeximageSideModel from 'App/Models/IndeximageSideModel'
import Typebook from 'App/Models/Typebook'
import { sendDownloadFileBuffer } from 'App/Services/googleDrive/googledrive'
import { extractBookSideVisualFeatures } from './bookSideVisualModel'

let timer: NodeJS.Timeout | null = null
let task: Promise<void> | null = null
let stopping = false
let mathWorker: Worker | null = null

const sqlNow = () => DateTime.utc().toSQL({ includeOffset: false })!
const leaseEnd = () => DateTime.utc().plus({ minutes: 2 }).toSQL({ includeOffset: false })!

export async function verifySideTrainingSnapshot(job: IndeximageSideModel) {
  const rows = await Database.from('indeximage_side_labels as labels')
    .join('bookrecords as records', (join) => join.on('records.id', 'labels.bookrecords_id').andOn('records.companies_id', 'labels.companies_id').andOn('records.typebooks_id', 'labels.typebooks_id'))
    .join('indeximages as images', (join) => join.on('images.bookrecords_id', 'labels.bookrecords_id').andOn('images.companies_id', 'labels.companies_id').andOn('images.typebooks_id', 'labels.typebooks_id').andOn('images.seq', 'labels.seq').andOn('images.drive_file_id', 'labels.drive_file_id').andOn('images.file_name', 'labels.file_name'))
    .where('labels.companies_id', job.companies_id).andWhere('labels.typebooks_id', job.typebooks_id).andWhere('records.book', job.book)
    .whereIn('labels.id', job.training_samples.map((sample) => sample.label_id))
    .select('labels.id', 'labels.bookrecords_id', 'labels.seq', 'labels.label', 'labels.drive_file_id', 'labels.file_name', 'records.sheet')
  const byId = new Map(rows.map((row) => [Number(row.id), row]))
  if (!job.training_samples.every((sample) => {
    const row = byId.get(sample.label_id)
    return row && Number(row.bookrecords_id) === sample.bookrecords_id && Number(row.seq) === sample.seq && Number(row.sheet) === sample.sheet && row.label === sample.label && row.drive_file_id === sample.drive_file_id && row.file_name === sample.file_name
  })) throw new Error('As imagens ou revisões mudaram durante o treinamento. Confira a amostra e tente novamente')
}

async function downloadTrainingImage(fileId: string, cloud: number) {
  for (let attempt = 0; ; attempt++) {
    let timeout: NodeJS.Timeout | undefined
    try {
      return await Promise.race([
        sendDownloadFileBuffer(fileId, cloud),
        new Promise<Buffer>((_, reject) => { timeout = setTimeout(() => reject(new Error('Tempo de leitura da imagem excedido')), 60000) }),
      ])
    } catch (error) {
      if (attempt >= 1 || [400, 401, 403, 404].includes(error.response?.status)) throw error
    } finally { if (timeout) clearTimeout(timeout) }
  }
}

function fitInWorker(rows: any[], shouldStop: () => boolean) {
  return new Promise<any>((resolve, reject) => {
    const worker = new Worker(Application.resourcesPath('side-training/train.cjs'), { workerData: { rows } })
    mathWorker = worker
    worker.on('message', (message) => {
      if (shouldStop()) { void worker.terminate(); return }
      if (message.error) reject(new Error(message.error))
      else if (message.result) resolve(message.result)
    })
    worker.once('error', reject)
    worker.once('exit', (code) => {
      if (mathWorker === worker) mathWorker = null
      if (code !== 0) reject(new Error('Treinamento interrompido'))
    })
  })
}

export async function runBookSideTrainingJob(job: IndeximageSideModel, shouldStop: () => boolean = () => stopping) {
  const token = job.lease_token
  if (!token) throw new Error('O treinamento não possui uma reserva válida')
  let lostLease = false
  const owned = () => IndeximageSideModel.query().where('id', job.id).andWhere('lease_token', token!).andWhere('status', 'training')
  const heartbeat = setInterval(() => {
    void owned().update({ lease_expires_at: leaseEnd() }).then((updated) => { if (!updated) lostLease = true }).catch(() => { lostLease = true })
  }, 15000)
  heartbeat.unref()
  try {
    await verifySideTrainingSnapshot(job)
    const typebook = await Typebook.query().where('id', job.typebooks_id).andWhere('companies_id', job.companies_id).preload('company').first()
    if (!typebook?.company?.cloud) throw new Error('O livro está sem configuração de acesso às imagens')
    const rows: any[] = []
    const hashes = new Map<string, string>()
    let encoderHash = ''
    for (let index = 0; index < job.training_samples.length; index++) {
      if (shouldStop() || lostLease) throw new Error('Treinamento interrompido')
      const sample = job.training_samples[index]
      let buffer: Buffer
      try { buffer = await downloadTrainingImage(sample.drive_file_id, typebook.company.cloud) } catch {
        throw new Error(`Não foi possível carregar a imagem do registro ${sample.bookrecords_id}. Confira o acesso à imagem e tente novamente`)
      }
      const hash = crypto.createHash('sha256').update(buffer).digest('hex')
      if (hashes.has(hash) && hashes.get(hash) !== sample.label) throw new Error(`Há respostas diferentes para uma imagem duplicada. Confira o registro ${sample.bookrecords_id}`)
      if (!hashes.has(hash)) {
        const extracted = await extractBookSideVisualFeatures(buffer, encoderHash || undefined)
        encoderHash = extracted.encoderHash
        rows.push({ ...sample, sha256: hash, features: extracted.features })
        hashes.set(hash, sample.label)
      }
      const updated = await owned().update({ processed: index + 1, lease_expires_at: leaseEnd() })
      if (!updated) throw new Error('A reserva do treinamento expirou')
    }
    if (rows.length < 40 || !['F', 'V'].every((side) => rows.filter((row) => row.label === side).length >= 5)) {
      throw new Error('Revise pelo menos 40 imagens diferentes, incluindo pelo menos cinco frentes e cinco versos. Adicione mais imagens à amostra')
    }
    await owned().update({ phase: 'fitting', lease_expires_at: leaseEnd() })
    const trained = await fitInWorker(rows, () => shouldStop() || lostLease)
    await verifySideTrainingSnapshot(job)
    if (shouldStop() || lostLease) throw new Error('Treinamento interrompido')
    const model = {
      version: job.version, company_id: job.companies_id, typebook_id: job.typebooks_id, book: job.book,
      extractor: 'Xenova/dinov2-small', extractor_sha256: encoderHash,
      feature_encoding: 'cls-and-2x2-spatial-means-normalized', runtime_version: '4.3.1',
      preprocessing: { resize: [224, 224], center_crop: false }, classifier: 'balanced-logistic-l2', lambda: 0.01,
      validation_hashes: {},
      ...trained,
      training_samples: rows.map((row) => ({ bookrecords_id: row.bookrecords_id, seq: row.seq, sheet: row.sheet, label: row.label, sha256: row.sha256 })),
    }
    await owned().update({ model_data: JSON.stringify(model), status: 'ready', phase: 'ready', finished_at: sqlNow(), lease_token: null, lease_expires_at: null, error_message: null })
  } catch (error) {
    await owned().update({ status: shouldStop() || lostLease ? 'queued' : 'failed', phase: shouldStop() || lostLease ? 'queued' : 'failed',
      error_message: shouldStop() || lostLease ? null : String(error.message || 'Falha no treinamento').slice(0, 1000), lease_token: null, lease_expires_at: null,
      finished_at: shouldStop() || lostLease ? null : sqlNow() })
  } finally { clearInterval(heartbeat) }
}

export async function claimNextBookSideTrainingJob() {
  return Database.transaction(async (trx) => {
    // Reserva curta e serializada entre processos; a IA executa após o commit.
    const anchor = await IndeximageSideModel.query({ client: trx }).select('id').orderBy('id').forUpdate().first()
    if (!anchor) return null
    const busy = await IndeximageSideModel.query({ client: trx }).select('id').where('status', 'training').where('lease_expires_at', '>', sqlNow()).first()
    if (busy) return null
    const job = await IndeximageSideModel.query({ client: trx }).where((query) => {
      query.where('status', 'queued').orWhere((expired) => expired.where('status', 'training').where((lease) => lease.whereNull('lease_expires_at').orWhere('lease_expires_at', '<=', sqlNow())))
    }).orderBy('id').forUpdate().first()
    if (!job) return null
    job.merge({ status: 'training', phase: 'extracting', processed: 0, lease_token: crypto.randomUUID(), lease_expires_at: DateTime.utc().plus({ minutes: 2 }), started_at: DateTime.utc(), error_message: null })
    await job.save()
    return job
  })
}

export function wakeBookSideTrainingWorker() {
  if (!timer || stopping || task) return
  task = (async () => {
    try {
      while (!stopping) {
        const job = await claimNextBookSideTrainingJob()
        if (!job) break
        await runBookSideTrainingJob(job)
      }
    } catch (error) {
      if (error.code !== 'ER_NO_SUCH_TABLE' && error.errno !== 1146) console.error('Fila de treinamento de lados:', error.message)
    }
  })().finally(() => { task = null })
}

export function startBookSideTrainingWorker() {
  if (timer) return
  stopping = false
  timer = setInterval(wakeBookSideTrainingWorker, 5000)
  timer.unref()
  wakeBookSideTrainingWorker()
}

export async function stopBookSideTrainingWorker() {
  stopping = true
  if (timer) clearInterval(timer)
  timer = null
  if (mathWorker) await mathWorker.terminate()
  await task
}
