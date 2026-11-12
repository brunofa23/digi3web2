// Executar: node tests/unit/side_training_missing_images.test.cjs
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

class Query {
  constructor(rows) { this.rows = rows; this.filters = []; this.max = Infinity }
  useTransaction() { return this }
  join() { return this }
  whereNotExists() { return this }
  whereNotNull() { return this }
  whereNot() { return this }
  orderByRaw() { return this }
  where(field, value) { this.filters.push((row) => row[field.split('.').pop()] === value); return this }
  andWhere(field, value) { return this.where(field, value) }
  whereIn(field, values) { this.filters.push((row) => values.includes(row[field.split('.').pop()])); return this }
  whereNotIn(field, values) { this.filters.push((row) => !values.includes(row[field.split('.').pop()])); return this }
  limit(count) { this.max = count; return this }
  select() { return this }
  forUpdate() { return this }
  result() { return this.rows.filter((row) => this.filters.every((filter) => filter(row))).slice(0, this.max) }
  then(resolve, reject) { return Promise.resolve(this.result()).then(resolve, reject) }
  async first() { return this.result()[0] || null }
  async firstOrFail() { return this.first() }
}

function controllerFor(labels, records) {
  const fakeModels = { query: () => new Query([]) }
  const fakeLabels = { query: () => new Query(labels), createMany: async (rows) => {
    const added = rows.map((row, index) => ({ ...row, id: labels.length + index + 1, label: null }))
    labels.push(...added)
    return added
  } }
  const database = { transaction: async (callback) => callback({}), from: (name) => {
    if (name === 'bookrecords') return new Query(records)
    if (name === 'bookrecords as bookrecords') return new Query(records.map((row) => ({ ...row, bookrecords_id: row.id, seq: 1, drive_file_id: `file-${row.id}`, file_name: `${row.id}.jpg`, ext: '.jpg' })))
    throw new Error(`Consulta inesperada: ${name}`)
  } }
  const dependencies = {
    '@ioc:Adonis/Lucid/Database': database,
    'App/Models/Typebook': { query: () => new Query([{ id: 8, companies_id: 90 }]) },
    'App/Models/IndeximageSideLabel': fakeLabels,
    'App/Models/IndeximageSideModel': fakeModels,
    'App/Models/IndeximageOcrCheck': {},
    'App/Services/googleDrive/googledrive': {},
    'App/Services/ocr/bookSideVisualModel': { bookSideModelRegistry: async () => ({ available: true, records: [] }) },
    'App/Services/ocr/bookSideModelTraining': {},
    'App/Services/util': {},
    'App/Exceptions/BadRequestException': class extends Error { constructor(message, status) { super(message); this.status = status } },
    '@ioc:Adonis/Core/Application': {},
    'fs/promises': {},
    crypto: require('crypto'), luxon: require('luxon'),
  }
  const source = fs.readFileSync(path.join(__dirname, '../../app/Controllers/Http/SideTrainingController.ts'), 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText
  const module = { exports: {} }
  new Function('require', 'module', 'exports', compiled)((name) => {
    if (!(name in dependencies)) throw new Error(`Dependência não simulada: ${name}`)
    return dependencies[name]
  }, module, module.exports)
  const controller = new module.exports.default()
  controller.access = async () => ({ user: { companies_id: 90, id: 1 }, typebooksId: 8 })
  controller.modelContext = async () => ({ registry: { available: true, records: [] }, model: null })
  controller.index = async () => ({ items: labels })
  return controller
}

test('referência sem imagem, marcada como inconclusiva, pode ser substituída sem reiniciar o grupo', async () => {
  const labels = []
  const records = []
  for (const book of [34, 35]) for (let number = 1; number <= 12; number++) {
    const id = book * 100 + number
    records.push({ id, book, companies_id: 90, typebooks_id: 8 })
    if (number <= 10) labels.push({ id: labels.length + 1, companies_id: 90, typebooks_id: 8, bookrecords_id: id, label: book === 34 && number === 10 ? 'U' : number % 2 ? 'F' : 'V', position: labels.length + 1 })
  }
  const controller = controllerFor(labels, records)
  const ctx = { request: { input: (name) => ({ book: 34, stage: 'development', sampleSize: 20, sourceBooks: [34, 35] })[name], qs: () => ({}) } }
  await controller.createSample(ctx)
  const added = labels.filter((row) => row.bookrecords_id === 3411)
  assert.equal(added.length, 1)
  assert.equal(added[0].label, null)
  assert.equal(labels.find((row) => row.bookrecords_id === 3410).label, 'U')
  assert.equal(labels.filter((row) => row.bookrecords_id > 3500).length, 10)
  added[0].label = 'F'
  await controller.createSample(ctx)
  assert.equal(labels.length, 21, 'após classificar a substituta, não cria outras referências')
})
