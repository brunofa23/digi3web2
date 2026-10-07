import Database from '@ioc:Adonis/Lucid/Database'
import { randomUUID } from 'crypto'
import { DateTime } from 'luxon'
import Company from 'App/Models/Company'
import DriveDuplicateFolderScan from 'App/Models/DriveDuplicateFolderScan'
import { sendCountDriveFiles, sendListDriveFolders } from 'App/Services/googleDrive/googledrive'

type FolderLink = { id: string; url: string }

export default class DriveDuplicateFolderScanService {
  public async getSnapshot() {
    const scan = await DriveDuplicateFolderScan.findOrFail(1)
    if (scan.status === 'IDLE' || (scan.status === 'RUNNING' &&
      (!scan.heartbeatAt || scan.heartbeatAt < DateTime.now().minus({ minutes: 15 })))) {
      await this.start()
    }
    return this.snapshot()
  }

  public async start() {
    const token = randomUUID()
    const now = new Date()
    const claimed = await Database.from('drive_duplicate_folder_scans')
      .where('id', 1)
      .where((query) => query.whereNot('status', 'RUNNING')
        .orWhere('heartbeat_at', '<', DateTime.now().minus({ minutes: 15 }).toJSDate())
        .orWhereNull('heartbeat_at'))
      .update({ status: 'RUNNING', run_token: token, started_at: now,
        heartbeat_at: now, error_message: null, updated_at: now })

    if (claimed) void this.run(token)
    return this.snapshot()
  }

  private async snapshot() {
    const scan = await DriveDuplicateFolderScan.findOrFail(1)
    const runningResult = Array.isArray(scan.result) ? null : scan.result
    return {
      status: scan.status,
      companies: runningResult?.previous || scan.result || [],
      progress: runningResult?.progress || null,
      error_message: scan.errorMessage,
      started_at: scan.startedAt?.toISO() || null,
      finished_at: scan.finishedAt?.toISO() || null,
    }
  }

  private async run(token: string) {
    try {
      const previousScan = await DriveDuplicateFolderScan.findOrFail(1)
      const previous = Array.isArray(previousScan.result)
        ? previousScan.result : previousScan.result?.previous || []
      const companies = await Company.query().select('id', 'name', 'foldername', 'cloud').orderBy('id')
      const result = companies.map((company) => ({
        company_id: company.id,
        company_name: company.name,
        folder_found: false,
        file_count: 0,
        size_bytes: '0',
        duplicates: [] as Array<{ name: string; folders: FolderLink[] }>,
      }))
      const resultById = new Map(result.map((company) => [company.company_id, company]))
      const companyStatus = new Map(companies.map((company) => [company.id, 'PENDING']))
      const progress = { stage: 'FOLDERS', cloud: null as number | null, folder_pages: 0, file_pages: 0 }
      const publish = async () => {
        const updated = await Database.from('drive_duplicate_folder_scans')
          .where('id', 1).where('run_token', token)
          .update({
            result: JSON.stringify({ previous, progress: {
              ...progress,
              companies: result.map((company) => ({
                ...company, scan_status: companyStatus.get(company.company_id),
              })),
            } }),
            heartbeat_at: new Date(), updated_at: new Date(),
          })
        if (!updated) throw new Error('Pesquisa substituída por outra execução.')
      }

      await publish()

      for (const cloud of new Set(companies.map((company) => company.cloud))) {
        const cloudCompanies = companies.filter((company) => company.cloud === cloud)
        progress.cloud = cloud
        progress.stage = 'FOLDERS'
        await publish()
        const folders = await sendListDriveFolders(cloud, async () => {
          progress.folder_pages += 1
          await publish()
        })
        const byId = new Map(folders.map((folder) => [folder.id, folder]))
        const roots = new Map<string, number>()

        for (const folder of folders) {
          if (folder.parents?.some((parent) => byId.has(parent))) continue
          const company = cloudCompanies.find((item) => item.foldername === folder.name)
          if (company) roots.set(folder.id, company.id)
        }
        const companiesWithRoot = new Set(roots.values())
        for (const company of result) {
          if (companiesWithRoot.has(company.company_id)) company.folder_found = true
        }

        const companyByFolder = new Map<string, number | null>()
        function getCompanyId(folderId: string, visited = new Set<string>()): number | null {
          if (companyByFolder.has(folderId)) return companyByFolder.get(folderId) || null
          if (visited.has(folderId)) return null
          visited.add(folderId)
          const folder = byId.get(folderId)
          const companyId = roots.get(folderId) ||
            folder?.parents?.map((parent) => getCompanyId(parent, visited)).find(Boolean) || null
          companyByFolder.set(folderId, companyId)
          return companyId
        }

        const namesByCompany = new Map<number, Map<string, FolderLink[]>>()
        for (const folder of folders) {
          const companyId = getCompanyId(folder.id)
          if (!companyId) continue
          if (!namesByCompany.has(companyId)) namesByCompany.set(companyId, new Map())
          const names = namesByCompany.get(companyId)!
          if (!names.has(folder.name)) names.set(folder.name, [])
          names.get(folder.name)!.push({ id: folder.id, url: `https://drive.google.com/drive/folders/${folder.id}` })
        }

        for (const company of result) {
          const names = namesByCompany.get(company.company_id)
          if (!names) continue
          company.duplicates = [...names.entries()]
            .filter(([, sameName]) => sameName.length > 1)
            .map(([name, sameName]) => ({ name, folders: sameName }))
            .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
        }

        for (const company of cloudCompanies) {
          companyStatus.set(company.id, companiesWithRoot.has(company.id) ? 'COUNTING' : 'COMPLETED')
        }
        progress.stage = 'FILES'
        await publish()

        const totals = new Map<number, { count: number; bytes: bigint }>()
        await sendCountDriveFiles(cloud, async (files) => {
          const changedCompanies = new Set<number>()
          for (const file of files) {
            const companyId = file.parents?.map((parent) => getCompanyId(parent)).find(Boolean)
            if (!companyId) continue
            const total = totals.get(companyId) || { count: 0, bytes: 0n }
            total.count += 1
            total.bytes += BigInt(file.size || 0)
            totals.set(companyId, total)
            changedCompanies.add(companyId)
          }
          for (const companyId of changedCompanies) {
            const company = resultById.get(companyId)!
            const total = totals.get(companyId)!
            company.file_count = total.count
            company.size_bytes = total.bytes.toString()
          }
          progress.file_pages += 1
          await publish()
        })

        for (const company of cloudCompanies) companyStatus.set(company.id, 'COMPLETED')
        await publish()
      }

      const now = new Date()
      await Database.from('drive_duplicate_folder_scans').where('id', 1).where('run_token', token)
        .update({ status: 'COMPLETED', result: JSON.stringify(result), finished_at: now,
          heartbeat_at: now, updated_at: now })
    } catch (error) {
      console.error('Erro ao pesquisar pastas duplicadas do Google Drive:', error)
      const now = new Date()
      await Database.from('drive_duplicate_folder_scans').where('id', 1).where('run_token', token)
        .update({ status: 'FAILED', error_message: 'Não foi possível consultar todas as nuvens do Google Drive.',
          updated_at: now })
    }
  }
}
