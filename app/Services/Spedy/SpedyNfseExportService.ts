import fs from 'fs/promises'
import type { FileHandle } from 'fs/promises'
import path from 'path'
import { deflateRawSync } from 'zlib'
import Application from '@ioc:Adonis/Core/Application'
import CompanySpedyIntegration from 'App/Models/CompanySpedyIntegration'
import SpedyNfseExportJob from 'App/Models/SpedyNfseExportJob'
import SpedyServiceInvoice from 'App/Models/SpedyServiceInvoice'
import SpedyCompaniesService from './SpedyCompaniesService'

const exportDirectory = Application.tmpPath('spedy-nfse-exports')
const spedy = new SpedyCompaniesService()
let queue = Promise.resolve()

async function cleanupOldArchives() {
  await fs.mkdir(exportDirectory, { recursive: true })
  const names = await fs.readdir(exportDirectory)
  for (const name of names) {
    if (!/^\d+\.zip$/.test(name)) continue
    const file = path.join(exportDirectory, name)
    const stat = await fs.stat(file)
    if (stat.mtimeMs < Date.now() - 24 * 60 * 60 * 1000) await fs.unlink(file)
  }
}

function crc32(data: Buffer) {
  let crc = 0xffffffff
  for (const byte of data) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0)
  }
  return (crc ^ 0xffffffff) >>> 0
}

class ZipWriter {
  private central: Buffer[] = []
  private offset = 0
  constructor(private file: FileHandle) {}

  public async add(name: string, data: Buffer) {
    const filename = Buffer.from(name, 'utf8')
    const compressed = deflateRawSync(data)
    const checksum = crc32(data)
    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(0x0800, 6)
    local.writeUInt16LE(8, 8)
    local.writeUInt32LE(checksum, 14)
    local.writeUInt32LE(compressed.length, 18)
    local.writeUInt32LE(data.length, 22)
    local.writeUInt16LE(filename.length, 26)
    await this.file.writeFile(local)
    await this.file.writeFile(filename)
    await this.file.writeFile(compressed)

    const entry = Buffer.alloc(46)
    entry.writeUInt32LE(0x02014b50, 0)
    entry.writeUInt16LE(20, 4)
    entry.writeUInt16LE(20, 6)
    entry.writeUInt16LE(0x0800, 8)
    entry.writeUInt16LE(8, 10)
    entry.writeUInt32LE(checksum, 16)
    entry.writeUInt32LE(compressed.length, 20)
    entry.writeUInt32LE(data.length, 24)
    entry.writeUInt16LE(filename.length, 28)
    entry.writeUInt32LE(this.offset, 42)
    this.central.push(entry, filename)
    this.offset += local.length + filename.length + compressed.length
  }

  public async finish() {
    const directory = Buffer.concat(this.central)
    const end = Buffer.alloc(22)
    end.writeUInt32LE(0x06054b50, 0)
    const count = this.central.length / 2
    end.writeUInt16LE(count, 8)
    end.writeUInt16LE(count, 10)
    end.writeUInt32LE(directory.length, 12)
    end.writeUInt32LE(this.offset, 16)
    await this.file.writeFile(directory)
    await this.file.writeFile(end)
    await this.file.close()
  }

  public async close() {
    await this.file.close()
  }
}

export function exportPath(id: number) {
  return path.join(exportDirectory, `${id}.zip`)
}

async function run(jobId: number) {
  const job = await SpedyNfseExportJob.findOrFail(jobId)
  job.status = 'processing'
  await job.save()
  const failures: { id: number, message: string }[] = []
  const ids: number[] = JSON.parse(job.invoiceIds)
  const integrations = new Map<string, CompanySpedyIntegration>()
  let lastRequest = 0
  let included = 0
  let zip: ZipWriter | null = null

  try {
    await cleanupOldArchives()
    zip = new ZipWriter(await fs.open(exportPath(job.id), 'w'))
    for (const id of ids) {
      try {
        const invoice = await SpedyServiceInvoice.query()
          .where('id', id).where('companies_id', job.companiesId)
          .where('status', 'authorized').first()
        if (!invoice?.spedyInvoiceId) throw new Error('Nota não autorizada ou indisponível')
        const key = `${invoice.companiesId}:${invoice.environment}`
        let integration = integrations.get(key)
        if (!integration) {
          integration = await CompanySpedyIntegration.query()
            .where('companies_id', invoice.companiesId).where('environment', invoice.environment)
            .where('active', true).firstOrFail()
          if (!integration.spedyApiKey) throw new Error('Integração Spedy sem chave ativa')
          integrations.set(key, integration)
        }
        const wait = 1100 - (Date.now() - lastRequest)
        if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait))
        lastRequest = Date.now()
        const fetchFile = () => job.format === 'xml'
          ? spedy.getServiceInvoiceXml(integration!, invoice.spedyInvoiceId!)
          : spedy.getServiceInvoicePdf(integration!, invoice.spedyInvoiceId!)
        let remote
        try {
          remote = await fetchFile()
        } catch (error) {
          if (error.status !== 429) throw error
          await new Promise((resolve) => setTimeout(resolve, 61000))
          lastRequest = Date.now()
          remote = await fetchFile()
        }
        const number = String(invoice.number || invoice.id).replace(/[^a-zA-Z0-9_-]/g, '_')
        await zip.add(`nfse-${number}-id-${invoice.id}.${job.format}`, remote.rawBody)
        included += 1
      } catch (error) {
        if (['ENOSPC', 'EIO', 'EBADF'].includes(error.code)) throw error
        failures.push({ id, message: String(error.message || 'Falha ao obter arquivo').slice(0, 300) })
      }
      job.processed += 1
      job.failures = JSON.stringify(failures)
      await job.save()
    }
    if (failures.length) await zip.add('falhas.txt', Buffer.from(failures.map((item) => `ID ${item.id}: ${item.message}`).join('\n')))
    if (!included) throw new Error('Nenhum arquivo pôde ser obtido da Spedy')
    await zip.finish()
    zip = null
    job.fileName = `nfse-${job.format}-${job.id}.zip`
    job.status = 'completed'
    await job.save()
  } catch (error) {
    if (zip) await zip.close()
    await fs.unlink(exportPath(job.id)).catch(() => undefined)
    job.status = 'failed'
    job.errorMessage = error.message || 'Falha ao preparar o ZIP'
    await job.save()
  }
}

export function enqueueExport(jobId: number) {
  queue = queue.then(() => run(jobId)).catch((error) => console.error('Falha no lote NFS-e', error))
}
