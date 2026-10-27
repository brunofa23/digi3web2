// Piloto offline. Ex.: node scripts/train-book-side-visual.js --company=102 --typebook=6 --book=31 --version=v2 --output=/tmp/model-v2.json
const path = require('path')
const fs = require('fs/promises')
const crypto = require('crypto')
require('reflect-metadata')
require('@adonisjs/assembler/build/src/requireHook').default(process.cwd())
const { Ignitor } = require('@adonisjs/core/build/standalone')
const options = Object.fromEntries(process.argv.slice(2).map((arg) => arg.replace(/^--/, '').split('=')))

function fit(rows) {
  const weights = new Array(rows[0].features.length).fill(0)
  let bias = 0
  const count = { F: rows.filter((row) => row.label === 'F').length, V: rows.filter((row) => row.label === 'V').length }
  if (!count.F || !count.V) throw new Error('O treinamento precisa de exemplos revisados dos dois lados')
  for (let step = 0; step < 2500; step++) {
    const gradient = new Array(weights.length).fill(0)
    let biasGradient = 0
    for (const row of rows) {
      const logit = row.features.reduce((sum, value, j) => sum + value * weights[j], bias)
      const residual = (1 / (1 + Math.exp(-logit)) - (row.label === 'F' ? 1 : 0)) / (2 * count[row.label])
      biasGradient += residual
      for (let j = 0; j < weights.length; j++) gradient[j] += residual * row.features[j]
    }
    for (let j = 0; j < weights.length; j++) weights[j] -= gradient[j] + 0.01 * weights[j]
    bias -= biasGradient
  }
  return { weights, bias }
}

async function main() {
  const companyId = Number(options.company)
  const typebookId = Number(options.typebook)
  const book = Number(options.book)
  if (![companyId, typebookId, book].every((value) => Number.isInteger(value) && value > 0) || !options.version || !options.output) {
    throw new Error('Informe --company, --typebook, --book, --version e --output')
  }
  try { await fs.access(options.output); throw new Error('O arquivo de saída já existe; use uma versão e arquivo novos') } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  const kernel = new Ignitor(process.cwd()).kernel('web')
  await kernel.boot()
  await kernel.start()
  try {
    const db = kernel.application.container.use('Adonis/Lucid/Database')
    const { sendDownloadFileBuffer } = require('../app/Services/googleDrive/googledrive.ts')
    const { loadBookSideVisualModel, extractBookSideVisualFeatures, predictBookSideVisual } = require('../app/Services/ocr/bookSideVisualModel.ts')
    const previous = await loadBookSideVisualModel(companyId, typebookId, book)
    const query = db.from('indeximage_side_labels as labels')
      .join('bookrecords as records', (join) => join.on('records.id', 'labels.bookrecords_id').andOn('records.companies_id', 'labels.companies_id').andOn('records.typebooks_id', 'labels.typebooks_id'))
      .join('indeximages as images', (join) => join.on('images.bookrecords_id', 'labels.bookrecords_id').andOn('images.companies_id', 'labels.companies_id').andOn('images.typebooks_id', 'labels.typebooks_id').andOn('images.seq', 'labels.seq').andOn('images.drive_file_id', 'labels.drive_file_id').andOn('images.file_name', 'labels.file_name'))
      .where('labels.companies_id', companyId).andWhere('labels.typebooks_id', typebookId).andWhere('records.book', book)
      .whereIn('labels.label', ['F', 'V']).orderBy('records.sheet').orderBy('records.cod')
      .select('labels.bookrecords_id', 'labels.seq', 'labels.label', 'labels.drive_file_id', 'records.sheet')
    // Uma validação já coletada nunca entra silenciosamente no treinamento da versão seguinte.
    if (previous) query.whereIn('labels.bookrecords_id', previous.training_samples.map((sample) => sample.bookrecords_id))
    const labels = await query
    if (labels.length < 10) throw new Error('Poucas imagens revisadas para os cinco blocos de desenvolvimento')
    const company = await db.from('companies').where('id', companyId).select('cloud').first()
    if (!company?.cloud) throw new Error('Empresa sem configuração de cloud')
    const rows = []
    let encoderHash = ''
    for (const label of labels) {
      const buffer = await sendDownloadFileBuffer(label.drive_file_id, company.cloud)
      const extracted = await extractBookSideVisualFeatures(buffer, previous?.extractor_sha256)
      encoderHash = extracted.encoderHash
      rows.push({ ...label, features: extracted.features, sha256: crypto.createHash('sha256').update(buffer).digest('hex') })
    }
    const sheets = [...new Set(rows.map((row) => Number(row.sheet)))].sort((a, b) => a - b)
    const foldBySheet = new Map(sheets.map((sheet, i) => [sheet, Math.min(4, Math.floor(i * 5 / sheets.length))]))
    const folds = []
    for (let fold = 0; fold < 5; fold++) {
      const train = rows.filter((row) => foldBySheet.get(Number(row.sheet)) !== fold)
      const test = rows.filter((row) => foldBySheet.get(Number(row.sheet)) === fold)
      const trained = fit(train)
      const correct = test.filter((row) => predictBookSideVisual(trained, row.features).side === row.label).length
      folds.push({ fold, train: train.length, test: test.length, correct })
    }
    const correct = folds.reduce((sum, fold) => sum + fold.correct, 0)
    const model = {
      version: options.version, company_id: companyId, typebook_id: typebookId, book,
      extractor: 'Xenova/dinov2-small', extractor_sha256: encoderHash,
      feature_encoding: 'cls-and-2x2-spatial-means-normalized', runtime_version: '4.3.1',
      preprocessing: { resize: [224, 224], center_crop: false }, classifier: 'balanced-logistic-l2', lambda: 0.01,
      ...fit(rows),
      training_samples: rows.map((row) => ({ bookrecords_id: row.bookrecords_id, seq: row.seq, sheet: Number(row.sheet), label: row.label, sha256: row.sha256 })),
      development: { correct, wrong: rows.length - correct, total: rows.length, folds, purpose: 'model_selection_not_independent_validation' },
    }
    await fs.mkdir(path.dirname(options.output), { recursive: true })
    await fs.writeFile(options.output, JSON.stringify(model), { flag: 'wx' })
    console.log(JSON.stringify({ version: model.version, development: model.development, output: options.output }))
  } finally { await kernel.close() }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1 })
