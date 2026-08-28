import Application from '@ioc:Adonis/Core/Application'
import Database from '@ioc:Adonis/Lucid/Database'
import Env from '@ioc:Adonis/Core/Env'
import { DateTime } from 'luxon'
import { createHash } from 'crypto'
import { promises as fs } from 'fs'
import { gzip, gunzip } from 'zlib'
import { promisify } from 'util'
import mysql from 'mysql2/promise'
import AuditLog from 'App/Models/AuditLog'
import Company from 'App/Models/Company'
import Typebook from 'App/Models/Typebook'
import {
  sendCreateFolder,
  sendDeleteFile,
  sendDownloadFileBuffer,
  sendListAllFilesMetadata,
  sendUploadFiles,
} from 'App/Services/googleDrive/googledrive'

const gzipAsync = promisify(gzip)
const gunzipAsync = promisify(gunzip)
const uploadDriveFile = sendUploadFiles as any
const createDriveFolder = sendCreateFolder as any
const listDriveFilesMetadata = sendListAllFilesMetadata as any
const downloadDriveFileBuffer = sendDownloadFileBuffer as any

type BackupOptions = {
  companyId: number
  typebookId?: number
  upload?: boolean
  retentionDays?: number
  userId?: number | null
  ip?: string | null
}

type RestoreOptions = {
  companyId: number
  typebookId: number
  snapshot: string
  source?: 'local' | 'drive'
  dryRun?: boolean
  confirm?: boolean
  reason?: string
  userId?: number | null
  ip?: string | null
}

type ListSnapshotsOptions = {
  companyId: number
  typebookId?: number
  source?: 'local' | 'drive'
}

type TableBackup = {
  table: string
  rows: any[]
  columns: string[]
}

const TABLES = [
  'bookrecords',
  'indeximages',
  'documents',
  'document_configs',
  'indeximage_ocr_checks',
  'indeximage_ocr_entities',
]
const INDEX_FILE = 'index.json'

export default class AcervoBackupService {
  public async backup(options: BackupOptions) {
    const company = await Company.findOrFail(options.companyId)
    const typebooks = await this.getTypebooks(company.id, options.typebookId)
    const snapshot = DateTime.now().toFormat('yyyy-MM-dd_HHmm')
    const basePath = Application.tmpPath(`acervoBackups/company_${company.id}/${snapshot}`)

    if (typebooks.length === 0) {
      throw new Error(
        options.typebookId
          ? `Typebook ${options.typebookId} não encontrado para a empresa ${company.id}`
          : `Nenhum typebook encontrado para a empresa ${company.id}`
      )
    }

    await fs.mkdir(basePath, { recursive: true })

    const manifest: any = {
      version: 1,
      scope: 'acervo',
      generated_at: DateTime.now().toISO(),
      snapshot,
      company: {
        id: company.id,
        name: company.name,
        foldername: company.foldername,
        cloud: company.cloud,
      },
      retention_days: options.retentionDays || 30,
      tables_included: ['typebooks', ...TABLES],
      typebooks: [],
    }

    let driveBackupFolderId: string | null = null
    let driveSnapshotFolderId: string | null = null

    if (options.upload) {
      driveBackupFolderId = await this.ensureDriveBackupFolder(company)
      driveSnapshotFolderId = await createDriveFolder(snapshot, company.cloud, driveBackupFolderId)
    }

    for (const typebook of typebooks) {
      const result = await this.backupTypebook(company, typebook, basePath)

      if (options.upload && driveSnapshotFolderId) {
        const uploadResult = await uploadDriveFile(
          driveSnapshotFolderId,
          basePath,
          result.file,
          company.cloud,
          'application/gzip'
        )

        result.drive_file_id = uploadResult?.data?.id || null
      }

      manifest.typebooks.push(result)
    }

    const manifestFile = 'manifest.json'
    const manifestPath = `${basePath}/${manifestFile}`
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2))

    if (options.upload && driveSnapshotFolderId) {
      const uploadResult = await uploadDriveFile(
        driveSnapshotFolderId,
        basePath,
        manifestFile,
        company.cloud,
        'application/json'
      )

      manifest.drive_manifest_file_id = uploadResult?.data?.id || null
      await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2))
    }

    await this.cleanupLocalRetention(company.id, options.retentionDays || 30)

    if (options.upload) {
      await this.cleanupDriveRetention(company, options.retentionDays || 30)
    }

    if (options.upload && driveBackupFolderId) {
      await this.updateDriveIndexAfterBackup(
        company,
        driveBackupFolderId,
        manifest,
        options.retentionDays || 30
      )
    }

    if (options.userId) {
      await this.logBackup(options, manifest)
    }

    return {
      snapshot,
      path: basePath,
      manifest,
    }
  }

  public async restore(options: RestoreOptions) {
    this.validateSnapshot(options.snapshot)

    const company = await Company.findOrFail(options.companyId)
    const packageData = options.source === 'drive'
      ? await this.getDrivePackage(company, options.snapshot, options.typebookId)
      : await this.getLocalPackage(company.id, options.snapshot, options.typebookId)

    this.validateManifestPackage(packageData.manifest, options)

    const checksum = createHash('sha256').update(packageData.sqlGz).digest('hex')
    if (checksum !== packageData.typebook.checksum_sha256) {
      throw new Error('Checksum do arquivo SQL não confere com o manifest.json')
    }

    const sql = (await gunzipAsync(packageData.sqlGz)).toString('utf8')
    this.validateRestoreSql(sql, options.companyId, options.typebookId)
    const preparedRestore = await this.prepareRestoreSql(sql)

    if (options.dryRun) {
      await this.executeRestoreSqlAsDryRun(preparedRestore.sql)

      return {
        dryRun: true,
        applied: false,
        source: options.source || 'local',
        snapshot: options.snapshot,
        manifest: packageData.manifest,
        typebook: packageData.typebook,
        checksum,
        warnings: preparedRestore.warnings,
      }
    }

    if (!options.confirm) {
      throw new Error('Restauração exige confirmação explícita. Use --confirm após validar com --dry-run.')
    }

    const preRestore = await this.backup({
      companyId: options.companyId,
      typebookId: options.typebookId,
      upload: false,
      retentionDays: 30,
    })

    await this.executeRestoreSql(preparedRestore.sql)
    await this.logRestore(options, packageData.typebook, preRestore, preparedRestore.warnings)

    return {
      dryRun: false,
      applied: true,
      source: options.source || 'local',
      snapshot: options.snapshot,
      pre_restore_snapshot: preRestore.snapshot,
      pre_restore_path: preRestore.path,
      manifest: packageData.manifest,
      typebook: packageData.typebook,
      checksum,
      warnings: preparedRestore.warnings,
    }
  }

  public async listSnapshots(options: ListSnapshotsOptions) {
    const company = await Company.findOrFail(options.companyId)

    return options.source === 'drive'
      ? this.listDriveSnapshots(company, options.typebookId)
      : this.listLocalSnapshots(company.id, options.typebookId)
  }

  private async getTypebooks(companyId: number, typebookId?: number) {
    const query = Typebook.query()
      .where('companies_id', companyId)
      .orderBy('id', 'asc')

    if (typebookId) {
      query.andWhere('id', typebookId)
    }

    return query
  }

  private async backupTypebook(company: Company, typebook: Typebook, basePath: string) {
    const backups = await this.getTableBackups(company.id, typebook.id)
    const sql = this.buildRestoreSql(company.id, typebook, backups)
    const sqlGz = await gzipAsync(Buffer.from(sql, 'utf8'))
    const file = `acervo_company_${company.id}_typebook_${typebook.id}.sql.gz`
    const filePath = `${basePath}/${file}`

    await fs.writeFile(filePath, sqlGz)

    const checksum = createHash('sha256').update(sqlGz).digest('hex')
    const stat = await fs.stat(filePath)

    return {
      typebooks_id: typebook.id,
      typebook_name: typebook.name,
      typebook_path: typebook.path,
      file,
      file_size: stat.size,
      checksum_sha256: checksum,
      drive_file_id: null,
      tables: backups.reduce((summary, item) => {
        summary[item.table] = item.rows.length
        return summary
      }, {}),
      total_rows: backups.reduce((total, item) => total + item.rows.length, 0),
    }
  }

  private async getLocalPackage(companyId: number, snapshot: string, typebookId: number) {
    const basePath = Application.tmpPath(`acervoBackups/company_${companyId}/${snapshot}`)
    const manifestPath = `${basePath}/manifest.json`
    const manifestExists = await this.fileExists(manifestPath)

    if (!manifestExists) {
      throw new Error(`Snapshot local não encontrado: ${basePath}`)
    }

    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'))
    const typebook = this.findManifestTypebook(manifest, typebookId)
    const sqlPath = `${basePath}/${typebook.file}`
    const sqlExists = await this.fileExists(sqlPath)

    if (!sqlExists) {
      throw new Error(`Arquivo SQL do typebook ${typebookId} não encontrado no snapshot local`)
    }

    const sqlGz = await fs.readFile(sqlPath)

    return {
      manifest,
      typebook,
      sqlGz,
    }
  }

  private async listLocalSnapshots(companyId: number, typebookId?: number) {
    const companyPath = Application.tmpPath(`acervoBackups/company_${companyId}`)
    const snapshots = await fs.readdir(companyPath).catch(() => [])
    const result: any[] = []

    for (const snapshot of snapshots) {
      const manifestPath = `${companyPath}/${snapshot}/manifest.json`
      if (!await this.fileExists(manifestPath)) continue

      const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'))
      const snapshotSummary = this.buildSnapshotSummary(manifest, 'local', typebookId, snapshot)

      if (snapshotSummary.typebooks.length === 0) continue

      result.push(snapshotSummary)
    }

    return this.sortSnapshots(result)
  }

  private async listDriveSnapshots(company: Company, typebookId?: number) {
    if (!company.cloud) {
      throw new Error('Empresa sem configuração de cloud')
    }

    const backupFolderId = await this.ensureDriveBackupFolder(company)
    const backupFiles = await listDriveFilesMetadata(company.cloud, [{ id: backupFolderId }])
    const index = await this.readDriveIndex(company, backupFolderId, backupFiles)

    if (index) {
      return this.sortSnapshots(this.filterSnapshotSummaries(index.snapshots, typebookId))
    }

    const snapshots = await this.collectDriveSnapshotSummaries(company, backupFolderId, backupFiles)
    await this.writeDriveIndex(company, backupFolderId, snapshots, 30).catch((error) => {
      console.error('Erro ao atualizar index.json do acervo:', error)
    })

    return this.sortSnapshots(this.filterSnapshotSummaries(snapshots, typebookId))
  }

  private async collectDriveSnapshotSummaries(company: Company, backupFolderId: string, backupFiles?: any[]) {
    const files = backupFiles || await listDriveFilesMetadata(company.cloud, [{ id: backupFolderId }])
    const result: any[] = []

    for (const snapshot of files || []) {
      if (snapshot.mimeType !== 'application/vnd.google-apps.folder') continue

      const snapshotDate = DateTime.fromFormat(snapshot.name, 'yyyy-MM-dd_HHmm')
      if (!snapshotDate.isValid) continue

      const snapshotFiles = await listDriveFilesMetadata(company.cloud, [{ id: snapshot.id }])
      const manifestFile = snapshotFiles?.find((item) => item.name === 'manifest.json')
      if (!manifestFile?.id) continue

      const manifestBuffer = await downloadDriveFileBuffer(manifestFile.id, company.cloud)
      const manifest = JSON.parse(manifestBuffer.toString('utf8'))
      const snapshotSummary = this.buildSnapshotSummary(manifest, 'drive', undefined, snapshot.name)

      if (snapshotSummary.typebooks.length === 0) continue

      result.push(snapshotSummary)
    }

    return this.sortSnapshots(result)
  }

  private async readDriveIndex(company: Company, backupFolderId: string, backupFiles?: any[]) {
    const files = backupFiles || await listDriveFilesMetadata(company.cloud, [{ id: backupFolderId }])
    const indexFile = files?.find((item) => item.name === INDEX_FILE)

    if (!indexFile?.id) return null

    try {
      const indexBuffer = await downloadDriveFileBuffer(indexFile.id, company.cloud)
      const index = JSON.parse(indexBuffer.toString('utf8'))

      if (index?.scope !== 'acervo_index') return null
      if (Number(index?.company?.id) !== Number(company.id)) return null
      if (!Array.isArray(index?.snapshots)) return null

      return index
    } catch (error) {
      console.error('Erro ao ler index.json do acervo:', error)
      return null
    }
  }

  private async updateDriveIndexAfterBackup(
    company: Company,
    backupFolderId: string,
    manifest: any,
    retentionDays: number
  ) {
    const backupFiles = await listDriveFilesMetadata(company.cloud, [{ id: backupFolderId }])
    const index = await this.readDriveIndex(company, backupFolderId, backupFiles)
    const snapshots = index
      ? index.snapshots
      : await this.collectDriveSnapshotSummaries(company, backupFolderId, backupFiles)
    const currentSnapshot = this.mergeSnapshotSummary(snapshots, this.buildSnapshotSummary(manifest, 'drive'))
    const limit = DateTime.now().minus({ days: retentionDays })
    const updatedSnapshots = snapshots
      .filter((snapshot) => snapshot.snapshot !== currentSnapshot.snapshot)
      .concat(currentSnapshot)
      .filter((snapshot) => {
        const snapshotDate = DateTime.fromFormat(snapshot.snapshot, 'yyyy-MM-dd_HHmm')
        return snapshotDate.isValid && snapshotDate >= limit
      })

    await this.writeDriveIndex(company, backupFolderId, updatedSnapshots, retentionDays)
  }

  private mergeSnapshotSummary(snapshots: any[], currentSnapshot: any) {
    const existingSnapshot = (snapshots || []).find((snapshot) => snapshot.snapshot === currentSnapshot.snapshot)

    if (!existingSnapshot) return currentSnapshot

    const currentTypebookIds = new Set(
      currentSnapshot.typebooks.map((typebook) => Number(typebook.typebooks_id))
    )
    const typebooks = [
      ...(existingSnapshot.typebooks || []).filter((typebook) => {
        return !currentTypebookIds.has(Number(typebook.typebooks_id))
      }),
      ...currentSnapshot.typebooks,
    ]

    return this.buildSnapshotSummary(
      {
        snapshot: currentSnapshot.snapshot,
        generated_at: currentSnapshot.generated_at,
        company: currentSnapshot.company,
        typebooks,
      },
      'drive'
    )
  }

  private async writeDriveIndex(
    company: Company,
    backupFolderId: string,
    snapshots: any[],
    retentionDays: number
  ) {
    const indexPath = Application.tmpPath(`acervoBackups/company_${company.id}/_index`)
    const index = {
      version: 1,
      scope: 'acervo_index',
      generated_at: DateTime.now().toISO(),
      company: snapshots[0]?.company || {
        id: company.id,
        name: company.name,
        foldername: company.foldername,
        cloud: company.cloud,
      },
      retention_days: retentionDays,
      snapshots: this.sortSnapshots(snapshots),
    }

    await fs.mkdir(indexPath, { recursive: true })
    await fs.writeFile(`${indexPath}/${INDEX_FILE}`, JSON.stringify(index, null, 2))

    const files = await listDriveFilesMetadata(company.cloud, [{ id: backupFolderId }])
    const oldIndexes = (files || []).filter((item) => item.name === INDEX_FILE)

    for (const oldIndex of oldIndexes) {
      await sendDeleteFile(oldIndex.id, company.cloud)
    }

    await uploadDriveFile(
      backupFolderId,
      indexPath,
      INDEX_FILE,
      company.cloud,
      'application/json'
    )
  }

  private buildSnapshotSummary(manifest: any, source: 'local' | 'drive', typebookId?: number, snapshotName?: string) {
    const typebooks = this.filterManifestTypebooks(manifest, typebookId)

    return {
      snapshot: snapshotName || manifest.snapshot,
      source,
      generated_at: manifest.generated_at,
      company: manifest.company,
      typebooks,
      typebooks_count: typebooks.length,
      total_rows: typebooks.reduce((total, item) => total + (Number(item.total_rows) || 0), 0),
      file_size: typebooks.reduce((total, item) => total + (Number(item.file_size) || 0), 0),
    }
  }

  private filterSnapshotSummaries(snapshots: any[], typebookId?: number) {
    return (snapshots || [])
      .map((snapshot) => {
        return this.buildSnapshotSummary(
          {
            snapshot: snapshot.snapshot,
            generated_at: snapshot.generated_at,
            company: snapshot.company,
            typebooks: snapshot.typebooks,
          },
          snapshot.source === 'local' ? 'local' : 'drive',
          typebookId,
          snapshot.snapshot
        )
      })
      .filter((snapshot) => snapshot.typebooks.length > 0)
  }

  private filterManifestTypebooks(manifest: any, typebookId?: number) {
    const typebooks = Array.isArray(manifest?.typebooks) ? manifest.typebooks : []

    if (!typebookId) return typebooks

    return typebooks.filter((item) => Number(item.typebooks_id) === Number(typebookId))
  }

  private sortSnapshots(snapshots: any[]) {
    return snapshots.sort((a, b) => String(b.snapshot).localeCompare(String(a.snapshot)))
  }

  private async getDrivePackage(company: Company, snapshot: string, typebookId: number) {
    if (!company.cloud) {
      throw new Error('Empresa sem configuração de cloud')
    }

    const companyFolderId = await createDriveFolder(company.foldername, company.cloud)
    const backupFolderId = await createDriveFolder('BACKUPS_ACERVO', company.cloud, companyFolderId)
    const snapshotFolderId = await this.findDriveFolder(company.cloud, backupFolderId, snapshot)
    const files = await listDriveFilesMetadata(company.cloud, [{ id: snapshotFolderId }])
    const manifestFile = this.findDriveFile(files, 'manifest.json')
    const manifestBuffer = await downloadDriveFileBuffer(manifestFile.id, company.cloud)
    const manifest = JSON.parse(manifestBuffer.toString('utf8'))
    const typebook = this.findManifestTypebook(manifest, typebookId)
    const sqlFile = this.findDriveFile(files, typebook.file)
    const sqlGz = await downloadDriveFileBuffer(sqlFile.id, company.cloud)

    return {
      manifest,
      typebook,
      sqlGz,
    }
  }

  private findManifestTypebook(manifest: any, typebookId: number) {
    const typebook = manifest?.typebooks?.find((item) => Number(item.typebooks_id) === Number(typebookId))

    if (!typebook) {
      throw new Error(`Typebook ${typebookId} não encontrado no manifest.json`)
    }

    return typebook
  }

  private async findDriveFolder(cloud: number, parentId: string, folderName: string) {
    const files = await listDriveFilesMetadata(cloud, [{ id: parentId }])
    const folder = files?.find((item) => item.name === folderName && item.mimeType === 'application/vnd.google-apps.folder')

    if (!folder?.id) {
      throw new Error(`Pasta ${folderName} não encontrada no Google Drive`)
    }

    return folder.id
  }

  private findDriveFile(files: any[], fileName: string) {
    const file = files?.find((item) => item.name === fileName)

    if (!file?.id) {
      throw new Error(`Arquivo ${fileName} não encontrado no Google Drive`)
    }

    return file
  }

  private async getTableBackups(companyId: number, typebookId: number): Promise<TableBackup[]> {
    const typebookRows = await Database.from('typebooks')
      .where('companies_id', companyId)
      .andWhere('id', typebookId)
    const bookrecordRows = await Database.from('bookrecords')
      .where('companies_id', companyId)
      .andWhere('typebooks_id', typebookId)
    const bookrecordIds = bookrecordRows.map((row) => row.id)

    const result: TableBackup[] = [
      {
        table: 'typebooks',
        rows: typebookRows,
        columns: await this.getColumns('typebooks'),
      },
    ]

    for (const table of TABLES) {
      const columns = await this.getColumns(table)
      const query = Database.from(table)
        .where('companies_id', companyId)
        .andWhere('typebooks_id', typebookId)

      if (table === 'bookrecords') {
        query.whereIn('id', bookrecordIds)
      } else if (columns.includes('bookrecords_id')) {
        if (bookrecordIds.length === 0) {
          query.whereRaw('1 = 0')
        } else {
          query.whereIn('bookrecords_id', bookrecordIds)
        }
      }

      const rows = await query

      result.push({
        table,
        rows,
        columns,
      })
    }

    return result
  }

  private async getColumns(table: string) {
    const result = await Database.rawQuery(
      `
        SELECT COLUMN_NAME
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
      `,
      [table]
    )

    const rows = Array.isArray(result?.[0]) ? result[0] : result
    return rows.map((row) => row.COLUMN_NAME)
  }

  private buildRestoreSql(companyId: number, typebook: Typebook, backups: TableBackup[]) {
    const lines: string[] = [
      `-- Backup acervo company_id=${companyId} typebooks_id=${typebook.id}`,
      `-- Gerado em ${DateTime.now().toISO()}`,
      'START TRANSACTION;',
      '',
      `DELETE FROM indeximage_ocr_entities WHERE companies_id = ${companyId} AND typebooks_id = ${typebook.id};`,
      `DELETE FROM indeximage_ocr_checks WHERE companies_id = ${companyId} AND typebooks_id = ${typebook.id};`,
      `DELETE FROM document_configs WHERE companies_id = ${companyId} AND typebooks_id = ${typebook.id};`,
      `DELETE FROM documents WHERE companies_id = ${companyId} AND typebooks_id = ${typebook.id};`,
      `DELETE FROM indeximages WHERE companies_id = ${companyId} AND typebooks_id = ${typebook.id};`,
      `DELETE FROM bookrecords WHERE companies_id = ${companyId} AND typebooks_id = ${typebook.id};`,
      '',
    ]

    for (const backup of backups) {
      lines.push(...this.buildInsertSql(backup))
    }

    lines.push('COMMIT;', '')
    return lines.join('\n')
  }

  private validateManifestPackage(manifest: any, options: RestoreOptions) {
    if (manifest?.scope !== 'acervo') {
      throw new Error('Manifest inválido: escopo diferente de acervo')
    }

    if (manifest?.snapshot !== options.snapshot) {
      throw new Error('Manifest inválido: snapshot diferente do solicitado')
    }

    if (Number(manifest?.company?.id) !== Number(options.companyId)) {
      throw new Error('Manifest inválido: empresa diferente da solicitada')
    }
  }

  private validateRestoreSql(sql: string, companyId: number, typebookId: number) {
    const header = `-- Backup acervo company_id=${companyId} typebooks_id=${typebookId}`

    if (!sql.includes(header)) {
      throw new Error('SQL de restauração não pertence ao company/typebook solicitado')
    }

    if (!sql.includes('START TRANSACTION;') || !sql.includes('COMMIT;')) {
      throw new Error('SQL de restauração sem transaction completa')
    }
  }

  private validateSnapshot(snapshot: string) {
    const snapshotDate = DateTime.fromFormat(snapshot, 'yyyy-MM-dd_HHmm')

    if (!snapshotDate.isValid || snapshotDate.toFormat('yyyy-MM-dd_HHmm') !== snapshot) {
      throw new Error('Snapshot inválido. Use o formato yyyy-MM-dd_HHmm, exemplo: 2026-08-28_0600')
    }
  }

  private async executeRestoreSql(sql: string) {
    const connection = await mysql.createConnection({
      host: Env.get('MYSQL_HOST'),
      port: Env.get('MYSQL_PORT'),
      user: Env.get('MYSQL_USER'),
      password: Env.get('MYSQL_PASSWORD', ''),
      database: Env.get('MYSQL_DB_NAME'),
      multipleStatements: true,
    })

    try {
      await connection.query(sql)
    } catch (error) {
      await connection.query('ROLLBACK').catch(() => null)
      throw error
    } finally {
      await connection.end()
    }
  }

  private async executeRestoreSqlAsDryRun(sql: string) {
    const dryRunSql = sql.replace(/COMMIT;\s*$/i, 'ROLLBACK;')
    await this.executeRestoreSql(dryRunSql)
  }

  private async logRestore(options: RestoreOptions, typebook: any, preRestore: any, warnings: string[]) {
    await AuditLog.create({
      companiesId: options.companyId,
      userId: options.userId || null,
      action: 'acervo_restore',
      entityTable: 'typebooks',
      entityId: options.typebookId,
      resourceKey: `acervo:${options.companyId}:${options.typebookId}:${options.snapshot}`,
      entityKey: {
        companies_id: options.companyId,
        typebooks_id: options.typebookId,
        snapshot: options.snapshot,
      },
      description: options.reason || 'Restauração granular do acervo',
      metadata: {
        source: options.source || 'local',
        restored_snapshot: options.snapshot,
        pre_restore_snapshot: preRestore.snapshot,
        pre_restore_path: preRestore.path,
        file: typebook.file,
        checksum_sha256: typebook.checksum_sha256,
        tables: typebook.tables,
        total_rows: typebook.total_rows,
        warnings,
      },
      beforeData: {
        pre_restore_snapshot: preRestore.snapshot,
        pre_restore_path: preRestore.path,
      },
      afterData: {
        restored_snapshot: options.snapshot,
        typebook,
      },
      occurrenceCount: 1,
      firstAt: DateTime.now(),
      lastAt: DateTime.now(),
      ip: options.ip || null,
    })
  }

  private async logBackup(options: BackupOptions, manifest: any) {
    await AuditLog.create({
      companiesId: options.companyId,
      userId: options.userId || null,
      action: 'acervo_backup_manual',
      entityTable: options.typebookId ? 'typebooks' : 'companies',
      entityId: options.typebookId || options.companyId,
      resourceKey: `acervo-backup:${options.companyId}:${options.typebookId || 'all'}:${manifest.snapshot}`,
      entityKey: {
        companies_id: options.companyId,
        typebooks_id: options.typebookId || null,
        snapshot: manifest.snapshot,
      },
      description: options.typebookId
        ? `Backup manual do acervo do livro ${options.typebookId}`
        : 'Backup manual do acervo da empresa',
      metadata: {
        uploaded_to_drive: Boolean(options.upload),
        retention_days: options.retentionDays || 30,
        snapshot: manifest.snapshot,
        typebooks: manifest.typebooks?.map((typebook) => ({
          typebooks_id: typebook.typebooks_id,
          typebook_name: typebook.typebook_name,
          file: typebook.file,
          checksum_sha256: typebook.checksum_sha256,
          total_rows: typebook.total_rows,
        })) || [],
      },
      occurrenceCount: 1,
      firstAt: DateTime.now(),
      lastAt: DateTime.now(),
      ip: options.ip || null,
    })
  }

  private buildInsertSql(backup: TableBackup) {
    if (backup.rows.length === 0) return [`-- ${backup.table}: 0 registros`, '']

    const lines: string[] = []
    const columns = backup.columns
    const chunkSize = 200

    for (let index = 0; index < backup.rows.length; index += chunkSize) {
      const rows = backup.rows.slice(index, index + chunkSize)
      const values = rows.map((row) => {
        return `(${columns.map((column) => this.toSqlValue(row[column])).join(', ')})`
      })

      lines.push(`INSERT INTO ${backup.table} (${columns.map((column) => `\`${column}\``).join(', ')}) VALUES`)
      lines.push(`${values.join(',\n')}`)
      lines.push(this.getDuplicateUpdate(columns))
      lines.push('')
    }

    return lines
  }

  private getDuplicateUpdate(columns: string[]) {
    const updateColumns = columns.filter((column) => column !== 'id')

    if (updateColumns.length === 0) {
      return ';'
    }

    return `ON DUPLICATE KEY UPDATE ${updateColumns.map((column) => `\`${column}\` = VALUES(\`${column}\`)`).join(', ')};`
  }

  private toSqlValue(value: any): string {
    if (value === null || value === undefined) return 'NULL'
    if (Buffer.isBuffer(value)) return `X'${value.toString('hex')}'`
    if (value instanceof Date) return `'${DateTime.fromJSDate(value).toFormat('yyyy-LL-dd HH:mm:ss')}'`
    if (typeof value === 'number') return String(value)
    if (typeof value === 'bigint') return String(value)
    if (typeof value === 'boolean') return value ? '1' : '0'
    if (typeof value === 'object') return this.escapeSql(JSON.stringify(value))

    return this.escapeSql(String(value))
  }

  private escapeSql(value: string) {
    return `'${value
      .replace(/\\/g, '\\\\')
      .replace(/\0/g, '\\0')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\x08/g, '\\b')
      .replace(/\t/g, '\\t')
      .replace(/\x1a/g, '\\Z')
      .replace(/'/g, "\\'")}'`
  }

  private async prepareRestoreSql(sql: string) {
    const warnings: string[] = []
    let preparedSql = sql

    if (preparedSql.includes('\\b')) {
      preparedSql = preparedSql.replace(/\\b/g, '')
      warnings.push('Backup antigo continha escapes "\\b" em textos; eles foram normalizados antes da restauração.')
    }

    preparedSql = await this.removeMissingInsertColumns(preparedSql, warnings)
    preparedSql = this.removeRowsWithoutParentBookrecord(preparedSql, warnings)

    return {
      sql: preparedSql,
      warnings,
    }
  }

  private async removeMissingInsertColumns(sql: string, warnings: string[]) {
    const insertRegex = /INSERT INTO ([a-zA-Z0-9_]+) \(([\s\S]*?)\) VALUES\n([\s\S]*?)\nON DUPLICATE KEY UPDATE [\s\S]*?;/g
    const matches = Array.from(sql.matchAll(insertRegex))
    const tables = Array.from(new Set(matches.map((match) => match[1])))
    const columnCache = new Map<string, Set<string>>()

    for (const table of tables) {
      columnCache.set(table, new Set(await this.getColumns(table)))
    }

    return sql.replace(insertRegex, (statement, table, columnSql, valuesSql) => {
      return this.sanitizeInsertStatement(statement, table, columnSql, valuesSql, columnCache, warnings)
    })
  }

  private sanitizeInsertStatement(
    statement: string,
    table: string,
    columnSql: string,
    valuesSql: string,
    columnCache: Map<string, Set<string>>,
    warnings: string[]
  ) {
    const currentColumns = columnCache.get(table)

    if (!currentColumns || currentColumns.size === 0) return statement

    const columns = this.parseInsertColumns(columnSql)
    const keepIndexes = columns
      .map((column, index) => currentColumns.has(column) ? index : -1)
      .filter((index) => index >= 0)
    const ignoredColumns = columns.filter((column) => !currentColumns.has(column))

    if (ignoredColumns.length === 0) return statement

    const rows = this.parseInsertRows(valuesSql)
    const sanitizedRows = rows.map((row) => {
      const values = this.parseRowValues(row)
      return `(${keepIndexes.map((index) => values[index]).join(', ')})`
    })
    const keptColumns = keepIndexes.map((index) => columns[index])

    warnings.push(`Tabela ${table}: colunas ignoradas por não existirem no banco atual: ${ignoredColumns.join(', ')}.`)

    return [
      `INSERT INTO ${table} (${keptColumns.map((column) => `\`${column}\``).join(', ')}) VALUES`,
      sanitizedRows.join(',\n'),
      this.getDuplicateUpdate(keptColumns),
    ].join('\n')
  }

  private parseInsertColumns(columnSql: string) {
    return Array.from(columnSql.matchAll(/`([^`]+)`/g)).map((match) => match[1])
  }

  private parseInsertRows(valuesSql: string) {
    const rows: string[] = []
    let start = -1
    let depth = 0
    let inString = false
    let escaped = false

    for (let index = 0; index < valuesSql.length; index++) {
      const char = valuesSql[index]

      if (inString) {
        if (escaped) {
          escaped = false
        } else if (char === '\\') {
          escaped = true
        } else if (char === "'") {
          inString = false
        }
        continue
      }

      if (char === "'") {
        inString = true
        continue
      }

      if (char === '(') {
        if (depth === 0) start = index
        depth++
      } else if (char === ')') {
        depth--
        if (depth === 0 && start >= 0) {
          rows.push(valuesSql.slice(start, index + 1))
          start = -1
        }
      }
    }

    return rows
  }

  private parseRowValues(rowSql: string) {
    const content = rowSql.trim().replace(/^\(/, '').replace(/\)$/, '')
    const values: string[] = []
    let start = 0
    let inString = false
    let escaped = false

    for (let index = 0; index < content.length; index++) {
      const char = content[index]

      if (inString) {
        if (escaped) {
          escaped = false
        } else if (char === '\\') {
          escaped = true
        } else if (char === "'") {
          inString = false
        }
        continue
      }

      if (char === "'") {
        inString = true
        continue
      }

      if (char === ',') {
        values.push(content.slice(start, index).trim())
        start = index + 1
      }
    }

    values.push(content.slice(start).trim())
    return values
  }

  private removeRowsWithoutParentBookrecord(sql: string, warnings: string[]) {
    const insertRegex = /INSERT INTO ([a-zA-Z0-9_]+) \(([\s\S]*?)\) VALUES\n([\s\S]*?)\nON DUPLICATE KEY UPDATE [\s\S]*?;/g
    const bookrecordIds = new Set<number>()
    const dependentTables = [
      'indeximages',
      'documents',
      'indeximage_ocr_checks',
      'indeximage_ocr_entities',
    ]

    for (const match of sql.matchAll(insertRegex)) {
      const [, table, columnSql, valuesSql] = match
      if (table !== 'bookrecords') continue

      const columns = this.parseInsertColumns(columnSql)
      const idIndex = columns.indexOf('id')
      if (idIndex < 0) continue

      for (const row of this.parseInsertRows(valuesSql)) {
        const values = this.parseRowValues(row)
        const id = this.getSqlNumber(values[idIndex])
        if (id) bookrecordIds.add(id)
      }
    }

    if (bookrecordIds.size === 0) return sql

    return sql.replace(insertRegex, (statement, table, columnSql, valuesSql) => {
      if (!dependentTables.includes(table)) return statement

      const columns = this.parseInsertColumns(columnSql)
      const parentIndex = columns.indexOf('bookrecords_id')
      if (parentIndex < 0) return statement

      const rows = this.parseInsertRows(valuesSql)
      const validRows = rows.filter((row) => {
        const values = this.parseRowValues(row)
        const parentId = this.getSqlNumber(values[parentIndex])
        return parentId ? bookrecordIds.has(parentId) : true
      })
      const ignoredRows = rows.length - validRows.length

      if (ignoredRows === 0) return statement

      warnings.push(`Tabela ${table}: ${ignoredRows} registro(s) ignorado(s) porque o bookrecords_id não existe no snapshot.`)

      if (validRows.length === 0) {
        return `-- ${table}: ${ignoredRows} registro(s) ignorado(s) por bookrecords_id inexistente`
      }

      return [
        `INSERT INTO ${table} (${columns.map((column) => `\`${column}\``).join(', ')}) VALUES`,
        validRows.join(',\n'),
        this.getDuplicateUpdate(columns),
      ].join('\n')
    })
  }

  private getSqlNumber(value: string) {
    const numberValue = Number(String(value || '').trim())
    return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : null
  }

  private async ensureDriveBackupFolder(company: Company) {
    if (!company.cloud) {
      throw new Error('Empresa sem configuração de cloud')
    }

    const companyFolderId = await createDriveFolder(company.foldername, company.cloud)
    return createDriveFolder('BACKUPS_ACERVO', company.cloud, companyFolderId)
  }

  private async cleanupLocalRetention(companyId: number, retentionDays: number) {
    const companyPath = Application.tmpPath(`acervoBackups/company_${companyId}`)
    const snapshots = await fs.readdir(companyPath).catch(() => [])
    const limit = DateTime.now().minus({ days: retentionDays })

    for (const snapshot of snapshots) {
      const snapshotDate = DateTime.fromFormat(snapshot, 'yyyy-MM-dd_HHmm')

      if (!snapshotDate.isValid || snapshotDate >= limit) continue

      await fs.rm(`${companyPath}/${snapshot}`, { recursive: true, force: true })
    }
  }

  private async fileExists(path: string) {
    return fs.access(path).then(() => true).catch(() => false)
  }

  private async cleanupDriveRetention(company: Company, retentionDays: number) {
    if (!company.cloud) return

    const backupFolderId = await this.ensureDriveBackupFolder(company)
    const snapshots = await listDriveFilesMetadata(company.cloud, [{ id: backupFolderId }])
    const limit = DateTime.now().minus({ days: retentionDays })

    for (const snapshot of snapshots || []) {
      const snapshotDate = DateTime.fromFormat(snapshot.name, 'yyyy-MM-dd_HHmm')

      if (!snapshotDate.isValid || snapshotDate >= limit) continue

      await sendDeleteFile(snapshot.id, company.cloud)
    }
  }
}
