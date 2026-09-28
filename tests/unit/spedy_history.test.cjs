// Executar: node --test tests/unit/spedy_history.test.cjs
// Testa as regras reais sem acessar banco, credenciais ou a API fiscal.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const { DateTime } = require('luxon')

function loadTypeScript(file, dependencies) {
  const source = fs.readFileSync(path.join(__dirname, '../..', file), 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, experimentalDecorators: true, esModuleInterop: true },
  }).outputText
  const module = { exports: {} }
  new Function('require', 'module', 'exports', compiled)((name) => {
    if (name in dependencies) return dependencies[name]
    if (['luxon', 'util'].includes(name)) return require(name)
    throw new Error(`Dependência não simulada: ${name}`)
  }, module, module.exports)
  return module.exports.default
}

const decorator = () => () => {}
const Invoice = loadTypeScript('app/Models/SpedyServiceInvoice.ts', {
  '@ioc:Adonis/Lucid/Database': {},
  '@ioc:Adonis/Lucid/Orm': {
    BaseModel: class { merge(values) { Object.assign(this, values); return this } },
    column: Object.assign(decorator, { dateTime: decorator }),
    belongsTo: decorator,
  },
  './Company': class {},
  './Receipt': class {},
})

function oldInvoice() {
  const invoice = new Invoice()
  invoice.$isPersisted = true
  invoice.updatedAt = DateTime.fromISO('2026-09-28T08:58:00-03:00')
  invoice.status = 'rejected'
  invoice.processingDetail = { on: '2026-09-28T08:58:00', code: 'SPD999', message: 'Erro de comunicação' }
  return invoice
}

test('preserva rejeição legada quando a consulta retorna autorização', () => {
  const invoice = oldInvoice()
  invoice.applyWithHistory({ status: 'authorized', number: '686', processingDetail: { message: 'Autorizada', on: '2026-09-28T09:01:00' } }, 'sync')
  assert.deepEqual(invoice.processingHistory.map((entry) => entry.status), ['rejected', 'authorized'])
  assert.equal(invoice.processingHistory[0].source, 'previous')
  assert.equal(invoice.processingHistory[0].processingDetail.code, 'SPD999')
  assert.equal(invoice.number, '686')
})

test('sincronização idêntica não duplica histórico mesmo com JSON reordenado', () => {
  const invoice = oldInvoice()
  invoice.applyWithHistory({ processingDetail: { message: 'Erro de comunicação', code: 'SPD999', on: '2026-09-28T08:58:00' } }, 'sync')
  invoice.applyWithHistory({ status: 'rejected' }, 'sync')
  assert.equal(invoice.processingHistory.length, 1)
})

test('novo detalhe no mesmo status e ações explícitas são preservados', () => {
  const invoice = oldInvoice()
  invoice.applyWithHistory({ processingDetail: { code: 'E1', message: 'Outra rejeição' } }, 'sync')
  invoice.applyWithHistory({}, 'reissue')
  assert.equal(invoice.processingHistory.length, 3)
  assert.equal(invoice.processingHistory[2].source, 'reissue')
})

test('nova emissão registra só o retorno conhecido, sem inventar eventos anteriores', () => {
  const invoice = new Invoice()
  invoice.applyWithHistory({ status: 'enqueued', processingDetail: { message: 'Em fila' } }, 'emission')
  assert.equal(invoice.processingHistory.length, 1)
  assert.equal(invoice.processingHistory[0].status, 'enqueued')
})

test('histórico legado pode ser exibido sem escrita ao consultar detalhes', () => {
  const invoice = oldInvoice()
  assert.equal(invoice.getProcessingHistory()[0].status, 'rejected')
  assert.equal(invoice.processingHistory, undefined)
})

function controller() {
  const saved = []
  const Controller = loadTypeScript('app/Controllers/Http/Spedy/ServiceInvoicesController.ts', {
    'App/Models/CompanySpedyIntegration': class {},
    'App/Models/SpedyServiceInvoice': { saveWithHistory: async (...args) => { saved.push(args); return args[0] } },
    'App/Services/Spedy/SpedyCompaniesService': class {},
    'App/Exceptions/BadRequestException': Error,
    'App/Validators/Spedy/SpedyServiceInvoiceDefaultsValidator': class {},
    'App/Validators/Spedy/SpedyServiceInvoiceValidator': class {},
    'App/Services/util': { verifyPermission: () => true },
  })
  const instance = new Controller()
  instance.authenticateWithPermission = async () => ({ companies_id: 1 })
  instance.getDownloadContext = async () => ({ local: { id: 112, spedyInvoiceId: 'remote-id' }, integration: {} })
  return { instance, saved }
}

test('sincronização do lote ignora nota que já está autorizada no backend', async () => {
  const { instance, saved } = controller()
  instance.getLocalInvoice = async () => ({ status: 'authorized' })
  instance.spedy.getServiceInvoice = () => assert.fail('Não deve consultar a Spedy')
  await instance.sync({ params: { id: 112 }, request: { input: () => true } })
  assert.equal(saved.length, 0)
})

test('sincronização salva status, número, detalhe e ID local corretos', async () => {
  const { instance, saved } = controller()
  instance.getLocalInvoice = async () => ({ status: 'rejected' })
  instance.spedy.getServiceInvoice = async (_integration, id) => {
    assert.equal(id, 'remote-id')
    return { id, status: 'authorized', number: 687, processingDetail: { message: 'Autorizada' } }
  }
  await instance.sync({ params: { id: 112 }, request: { input: () => true } })
  assert.equal(saved[0][0].status, 'authorized')
  assert.equal(saved[0][0].number, '687')
  assert.deepEqual(saved[0].slice(1), ['sync', 112])
})

test('falha na API não substitui o registro nem o histórico', async () => {
  const { instance, saved } = controller()
  instance.spedy.getServiceInvoice = async () => { throw new Error('Timeout') }
  await assert.rejects(instance.sync({ params: { id: 112 }, request: { input: () => false } }), /Timeout/)
  assert.equal(saved.length, 0)
})
