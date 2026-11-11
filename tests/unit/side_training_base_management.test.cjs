// Executar: node --test tests/unit/side_training_base_management.test.cjs
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

function load(file, dependencies) {
  const compiled = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../..', file), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText
  const module = { exports: {} }
  new Function('require', 'module', 'exports', compiled)((name) => {
    if (name in dependencies) return dependencies[name]
    if (['luxon', 'crypto', 'path'].includes(name)) return require(name)
    throw new Error(`Dependência não simulada: ${name}`)
  }, module, module.exports)
  return module.exports
}

class Query {
  constructor(rows, writes = []) { this.rows = rows; this.writes = writes; this.matches = () => true }
  where(field, value) {
    const previous = this.matches
    if (typeof field === 'function') {
      const nested = new Query(this.rows)
      field(nested)
      this.matches = (row) => previous(row) && nested.matches(row)
    } else this.matches = (row) => previous(row) && row[field] === value
    return this
  }
  andWhere(...args) { return this.where(...args) }
  whereNull(field) { const prev = this.matches; this.matches = (row) => prev(row) && row[field] == null; return this }
  whereIn(field, values) { const prev = this.matches; this.matches = (row) => prev(row) && values.includes(row[field]); return this }
  whereNotIn(field, values) { const prev = this.matches; this.matches = (row) => prev(row) && !values.includes(row[field]); return this }
  orWhereRaw(_sql, [book]) { const prev = this.matches; this.matches = (row) => prev(row) || row.source_books?.includes(Number(book)); return this }
  orderBy(field, order) { this.sort = (a, b) => (a[field] - b[field]) * (order === 'desc' ? -1 : 1); return this }
  orderByRaw() { return this }
  select() { return this }
  forUpdate() { return this }
  result() { const rows = this.rows.filter(this.matches); return this.sort ? rows.sort(this.sort) : rows }
  then(resolve, reject) { return Promise.resolve(this.result()).then(resolve, reject) }
  async first() { return this.result()[0] || null }
  async firstOrFail() { const result = await this.first(); assert.ok(result); return result }
  async update(values) { const rows = this.result(); rows.forEach((row) => Object.assign(row, values)); this.writes.push({ action: 'update', ids: rows.map((row) => row.id), values }); return rows.length }
  async delete() { const ids = this.result().map((row) => row.id); this.rows.splice(0, this.rows.length, ...this.rows.filter((row) => !ids.includes(row.id))); this.writes.push({ action: 'delete', ids }); return ids.length }
}

function base(id, overrides = {}) {
  return { id, companies_id: 90, typebooks_id: 8, book: 38, source_books: [38, 39, 40, 41, 42],
    version: `sv-${id}`, status: 'ready', active_slot: null, archived_at: null, source_model_id: null,
    training_samples: [{ label_id: id }], validation_label_ids: [id],
    model_data: { company_id: 90, typebook_id: 8, book: 38, training_updated: true }, ...overrides }
}

function setup(rows, legacyFiles = {}) {
  const writes = []
  const removedFiles = []
  const files = { ...legacyFiles }
  const model = { query: () => new Query(rows, writes) }
  const database = { transaction: async (callback) => callback({}) }
  const filesApi = {
    readFile: async (file) => {
      if (!(file in files)) throw Object.assign(new Error('missing'), { code: 'ENOENT' })
      return JSON.stringify(files[file])
    },
    unlink: async (file) => { removedFiles.push(file); delete files[file] },
  }
  const dependencies = {
    '@ioc:Adonis/Lucid/Database': database,
    '@ioc:Adonis/Core/Application': { resourcesPath: (file) => `/resources/${file}` },
    'App/Models/IndeximageSideModel': model,
    'App/Models/Typebook': { query: () => new Query([{ id: 8, companies_id: 90 }]) },
    // Qualquer tentativa de alterar imagens, marcações ou resultados falha nestes testes.
    'App/Models/IndeximageSideLabel': {}, 'App/Models/IndeximageOcrCheck': {},
    'App/Services/googleDrive/googledrive': {},
    'App/Services/ocr/bookSideModelTraining': {},
    'App/Services/util': { verifyPermission: (_superuser, permissions, permission) => permissions.includes(permission) },
    'App/Exceptions/BadRequestException': class extends Error { constructor(message, status) { super(message); this.status = status } },
    'fs/promises': filesApi,
  }
  const visual = load('app/Services/ocr/bookSideVisualModel.ts', dependencies)
  const Controller = load('app/Controllers/Http/SideTrainingController.ts', { ...dependencies, 'App/Services/ocr/bookSideVisualModel': visual }).default
  const controller = new Controller()
  const ctx = (id, archived, permissions = [53]) => ({
    params: { typebooks_id: 8, model_id: id },
    request: { input: (field) => field === 'archived' ? archived : undefined },
    auth: { use: () => ({ authenticate: async () => ({ companies_id: 90 }), token: { meta: { payload: { permissions } } } }) },
    response: { ok: (value) => value },
  })
  return { controller, ctx, writes, files, removedFiles, visual, database }
}

test('arquiva todas as versões do grupo sem alterar a base ampliada nem o livro que a herdou', async () => {
  const rows = [base(12), base(13, { source_model_id: 12 }), base(14, { source_books: [38, 39, 40, 41, 42, 43, 44], source_model_id: 13, active_slot: 1 }),
    base(15, { book: 50, active_slot: 1, source_model_id: 13, model_data: { source_book: 38, training_updated: true } })]
  const before = structuredClone(rows)
  const { controller, ctx, writes } = setup(rows)
  await controller.archiveBase(ctx(13, true))
  assert.ok(rows[0].archived_at && rows[1].archived_at)
  assert.deepEqual(rows.slice(2), before.slice(2))
  assert.deepEqual(rows[0].model_data, before[0].model_data)
  assert.deepEqual(rows[1].training_samples, before[1].training_samples)
  assert.deepEqual(writes.map((write) => Object.keys(write.values)), [['archived_at']])
  const list = await controller.baseModels(ctx())
  assert.equal(list.trained_bases.find((row) => row.id === 13).archived, true)
  assert.equal(list.trained_bases.find((row) => row.id === 13).can_delete, false)
  assert.ok(!list.trained_bases.some((row) => row.id === 15), 'livro herdado não é outra versão da base')
})

test('restaurar recupera o grupo sem ativá-lo ou desativar outra base', async () => {
  const rows = [base(12, { archived_at: '2026-11-11' }), base(13, { archived_at: '2026-11-11' }), base(14, { active_slot: 1 })]
  const { controller, ctx } = setup(rows)
  await controller.archiveBase(ctx(13, false))
  assert.deepEqual(rows.map((row) => row.archived_at), [null, null, null])
  assert.deepEqual(rows.map((row) => row.active_slot), [null, null, 1])
})

test('bloqueia arquivar e excluir quando qualquer versão do grupo está ativa', async () => {
  const { controller, ctx, writes } = setup([base(12, { active_slot: 1 }), base(13)])
  await assert.rejects(controller.archiveBase(ctx(13, true)), { status: 409 })
  await assert.rejects(controller.deleteBase(ctx(13)), { status: 409 })
  assert.deepEqual(writes, [])
})

test('bloqueia arquivamento enquanto existe uma versão em treinamento', async () => {
  const { controller, ctx, writes } = setup([base(13), base(14, { status: 'training', model_data: null })])
  await assert.rejects(controller.archiveBase(ctx(13, true)), { status: 409 })
  assert.deepEqual(writes, [])
})

test('exclusão exige arquivamento e respeita dependentes, inclusive arquivados', async () => {
  const rows = [base(13), base(14, { source_books: [38, 39, 40, 41, 42, 43], source_model_id: 13, archived_at: '2026-11-11' })]
  const { controller, ctx, writes } = setup(rows)
  await assert.rejects(controller.deleteBase(ctx(13)), /Arquive a base/)
  await controller.archiveBase(ctx(13, true))
  await assert.rejects(controller.deleteBase(ctx(13)), /referência de outros modelos/)
  assert.equal(rows.length, 2)
  assert.ok(writes.every((write) => write.action !== 'delete'))
})

test('exclui somente as versões arquivadas do grupo, preservando novos modelos e outros acervos', async () => {
  const rows = [base(12, { archived_at: '2026-11-11' }), base(13, { source_model_id: 12, archived_at: '2026-11-11' }),
    base(14, { active_slot: 1 }), base(15, { companies_id: 91 }), base(16, { typebooks_id: 9 })]
  const { controller, ctx, writes } = setup(rows)
  await controller.deleteBase(ctx(13))
  assert.deepEqual(rows.map((row) => row.id), [14, 15, 16])
  assert.deepEqual(writes, [{ action: 'delete', ids: [12, 13] }])
})

test('impede gerenciamento sem permissão, de outro acervo e de livro apenas herdado', async () => {
  const { controller, ctx, writes } = setup([base(12, { companies_id: 91 }), base(13, { typebooks_id: 9 }),
    base(14, { book: 50, source_model_id: 11, model_data: { source_book: 38, training_updated: true } })])
  await assert.rejects(controller.archiveBase(ctx(12, true)), { status: 404 })
  await assert.rejects(controller.deleteBase(ctx(13)), { status: 404 })
  await assert.rejects(controller.archiveBase(ctx(14, true)), { status: 404 })
  await assert.rejects(controller.archiveBase(ctx(14, true, [])), { status: 403 })
  assert.deepEqual(writes, [])
})

test('base arquivada não é escolhida como candidata nem reaparece pelo arquivo legado', async () => {
  const row = base(13, { archived_at: '2026-11-11' })
  const { visual } = setup([row], { '/resources/side-models/90-8-38.json': { ...row.model_data, version: row.version } })
  assert.equal(await visual.loadBookSideVisualModel(90, 8, 38, { candidate: true }), null)
  assert.equal(await visual.loadBookSideVisualModel(90, 8, 38, { modelId: 13 }), null)
  assert.deepEqual((await visual.bookSideModelRegistry(90, 8, 38)).records, [])
})

test('requisição iniciada antes do arquivamento não pode reativar a base', async () => {
  const row = base(13, { archived_at: '2026-11-11' })
  const { controller } = setup([row])
  await assert.rejects(controller.storeLegacyModel({ ...row.model_data, model_id: 13 }, 1, {}), { status: 409 })
  await assert.rejects(controller.storeLegacyModel({ ...row.model_data, version: row.version }, 1, {}), { status: 409 })
})

test('exclusão remove o arquivo legado correspondente e preserva arquivo de outra versão', async () => {
  for (const matching of [true, false]) {
    const file = '/resources/side-models/90-8-38.json'
    const row = base(13, { archived_at: '2026-11-11' })
    const { controller, ctx, removedFiles } = setup([row], { [file]: { ...row.model_data, version: matching ? 'sv-13' : 'sv-99' } })
    await controller.deleteBase(ctx(13))
    assert.deepEqual(removedFiles, matching ? [file] : [])
  }
})

test('a origem arquivada continua validando os modelos que herdaram seus pesos', async () => {
  const sourceData = { version: 'sv-13', company_id: 90, typebook_id: 8, book: 38, weights: [1], bias: 0, extractor_sha256: 'hash',
    training_samples: [{ bookrecords_id: 1, seq: 1, label: 'F', sheet: 1 }], validation_label_ids: [] }
  const row = base(13, { archived_at: '2026-11-11', model_data: sourceData })
  const { visual, database } = setup([row])
  const answers = [sourceData.training_samples, Array.from({ length: 40 }, (_, index) => ({ id: index + 10, book: 38, sheet: index + 10, label: index < 20 ? 'F' : 'V', detected_side: index < 20 ? 'F' : 'V', side_processed_at: '2026-11-11' }))]
  database.from = () => {
    const rows = answers.shift()
    const query = new Proxy({}, { get: (_target, property) => property === 'then' ? (resolve) => Promise.resolve(rows).then(resolve) : () => query })
    return query
  }
  const result = await visual.bookSideVisualReadiness({ ...sourceData, model_id: 14, book: 50, source_book: 38, source_model_id: 13 })
  assert.equal(result.ready, true)
  assert.equal(result.required, 0)
})
