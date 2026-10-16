const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const { Schema } = require('@adonisjs/lucid/build/src/Schema')

function migration(name) {
  const source = fs.readFileSync(path.join(__dirname, '../../database/migrations', name + '.ts'), 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText
  const module = { exports: {} }
  new Function('require', 'module', 'exports', compiled)((id) => {
    assert.equal(id, '@ioc:Adonis/Lucid/Schema')
    return Schema
  }, module, module.exports)
  return module.exports.default
}

const IssuedOn = migration('1792200000000_spedy_nfse_issued_on')
const ExportJobs = migration('1792200000001_spedy_nfse_export_jobs')

// Usa execUp real do Lucid; o cliente simula DDL não transacional do MySQL.
function database(initial = {}) {
  const state = { column: false, index: false, jobs: false, ...initial }
  const writes = []
  const chain = new Proxy({}, { get: () => () => chain })
  const table = {
    dateTime() {
      assert.equal(state.column, false, 'Duplicate column issued_on')
      state.column = true
      writes.push('column')
      return chain
    },
    index() {
      assert.equal(state.index, false, 'Duplicate index')
      state.index = true
      writes.push('index')
    },
    dropIndex() { state.index = false; writes.push('drop-index') },
    dropColumn() {
      assert.equal(state.index, false)
      state.column = false
      writes.push('drop-column')
    },
  }
  const db = {
    get schema() {
      const operations = []
      const builder = {
        hasColumn: async () => state.column,
        hasTable: async () => state.jobs,
        alterTable(_name, callback) { operations.push(() => callback(table)); return builder },
        createTable(_name, callback) {
          operations.push(() => {
            assert.equal(state.jobs, false, 'Table already exists')
            callback(new Proxy({}, { get: () => () => chain }))
            state.jobs = true
            writes.push('jobs')
          })
          return builder
        },
        once() { return builder },
        then(resolve, reject) {
          return Promise.resolve().then(() => operations.forEach((operation) => operation())).then(resolve, reject)
        },
      }
      return builder
    },
    async rawQuery(sql) {
      if (sql.includes('information_schema.STATISTICS')) return [state.index ? [{ INDEX_NAME: 'existing' }] : [], []]
      assert.match(sql, /WHERE issued_on IS NULL/)
      assert.equal(state.column, true)
      assert.equal(state.index, true)
      writes.push('backfill')
      if (state.failBackfill) throw new Error('Backfill interrupted')
      return [[], []]
    },
  }
  return { db, state, writes }
}

test('execução inicial cria coluna e índice uma única vez antes do backfill', async () => {
  const { db, writes } = database()
  await new IssuedOn(db, 'issued_on').execUp()
  assert.deepEqual(writes, ['column', 'index', 'backfill'])
})

test('retoma após coluna criada e completa o índice ausente', async () => {
  const { db, writes } = database({ column: true })
  await new IssuedOn(db, 'issued_on').execUp()
  assert.deepEqual(writes, ['index', 'backfill'])
})

test('retoma após falha no backfill sem repetir DDL já aplicado', async () => {
  const { db, state, writes } = database({ failBackfill: true })
  await assert.rejects(new IssuedOn(db, 'issued_on').execUp(), /Backfill interrupted/)
  state.failBackfill = false
  await new IssuedOn(db, 'issued_on').execUp()
  assert.deepEqual(writes, ['column', 'index', 'backfill', 'backfill'])
})

test('tabela de tarefas é criada uma única vez e preservada na retomada', async () => {
  const { db, writes } = database()
  await new ExportJobs(db, 'exports').execUp()
  await new ExportJobs(db, 'exports').execUp()
  assert.deepEqual(writes, ['jobs'])
})

test('dry run não executa DDL nem backfill', async () => {
  const { db, writes } = database()
  await new IssuedOn(db, 'issued_on', true).execUp()
  await new ExportJobs(db, 'exports', true).execUp()
  assert.deepEqual(writes, [])
})

test('rollback remove índice e coluna e permite reaplicar a migration', async () => {
  const { db, writes } = database({ column: true, index: true })
  await new IssuedOn(db, 'issued_on').execDown()
  await new IssuedOn(db, 'issued_on').execUp()
  assert.deepEqual(writes, ['drop-index', 'drop-column', 'column', 'index', 'backfill'])
})
