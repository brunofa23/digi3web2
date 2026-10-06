const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const source = fs.readFileSync(path.join(__dirname, '../../app/Services/RcloneVerification.ts'), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const exportsObject = {}
new Function('exports', compiled)(exportsObject)
const valid = { verified: true, total_tasks: 90, verified_tasks: 90, pending_tasks: 0, verification_method: 'rclone check --one-way --download', completed_at: '2026-10-06T15:00:00-03:00' }
assert.equal(exportsObject.isVerifiedRcloneCompletion(valid), true)
for (const invalid of [null, {}, { ...valid, verified: false }, { ...valid, verified_tasks: 89 }, { ...valid, pending_tasks: 1 }, { ...valid, total_tasks: 0, verified_tasks: 0 }, { ...valid, completed_at: 'invalid' }, { ...valid, verification_method: 'size-only' }, { ...valid, total_tasks: '90' }]) {
  assert.equal(exportsObject.isVerifiedRcloneCompletion(invalid), false)
}
console.log('Rclone completion validation: 10 cases passed')
const controllerSource = fs.readFileSync(path.join(__dirname, '../../app/Controllers/Http/BackupRunsController.ts'), 'utf8')
const controllerJs = ts.transpileModule(controllerSource, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const controllerExports = {}
const resolve = (name) => {
  if (name === 'App/Services/RcloneVerification') return exportsObject
  if (name === '@ioc:Adonis/Core/Env') return { default: { get: () => 'test' } }
  if (name.startsWith('App/Models/')) return { default: {} }
  return require(name)
}
new Function('exports', 'require', controllerJs)(controllerExports, resolve)
const controller = new controllerExports.default()
let status
const ctx = {
  request: { header: (name) => name === 'authorization' ? 'Bearer test' : undefined, body: () => ({ run_id: 'test', kind: 'GDRIVE_RCLONE', event: 'RUN_SUCCESS', metadata: { verified: false } }) },
  response: { status(code) { status = code; return this }, send(body) { return body } },
}
controller.findOrCreateRun = () => { throw new Error('Invalid success must not reach database') }
controller.event(ctx).then(() => {
  assert.equal(status, 422)
  console.log('Endpoint rejects unverified success before database writes: passed')
}).catch((err) => { console.error(err); process.exitCode = 1 })
