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
const listDriveFilesMetadata = sendListAllFilesMetadata as any
const downloadDriveFileBuffer = sendDownloadFileBuffer as any

type BackupOptions = {
  companyId: number
  typebookId?: number
  upload?: boolean
  retentionDays?: number
}

type RestoreOptions = {
  companyId: number
  typebookId: number
  snapshot: string
  source?: 'local' | 'drive'
  dryRun?: boolean
  confirm?: boolean
  reason?: string
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

    let driveSnapshotFolderId: string | null = null

    if (options.upload) {
      driveSnapshotFolderId = await this.ensureDriveSnapshotFolder(company, snapshot)
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

    if (options.dryRun) {
      return {
        dryRun: true,
        applied: false,
        source: options.source || 'local',
        snapshot: options.snapshot,
        manifest: packageData.manifest,
        typebook: packageData.typebook,
        checksum,
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

    await this.executeRestoreSql(sql)
    await this.logRestore(options, packageData.typebook, preRestore)

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
    }
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

  private async getDrivePackage(company: Company, snapshot: string, typebookId: number) {
    if (!company.cloud) {
      throw new Error('Empresa sem configuração de cloud')
    }

    const companyFolderId = await sendCreateFolder(company.foldername, company.cloud)
    const backupFolderId = await sendCreateFolder('BACKUPS_ACERVO', company.cloud, companyFolderId)
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

    const result: TableBackup[] = [
      {
        table: 'typebooks',
        rows: typebookRows,
        columns: await this.getColumns('typebooks'),
      },
    ]

    for (const table of TABLES) {
      const rows = await Database.from(table)
        .where('companies_id', companyId)
        .andWhere('typebooks_id', typebookId)

      result.push({
        table,
        rows,
        columns: await this.getColumns(table),
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

  private async logRestore(options: RestoreOptions, typebook: any, preRestore: any) {
    await AuditLog.create({
      companiesId: options.companyId,
      userId: null,
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
      .replace(/\b/g, '\\b')
      .replace(/\t/g, '\\t')
      .replace(/\x1a/g, '\\Z')
      .replace(/'/g, "\\'")}'`
  }

  private async ensureDriveSnapshotFolder(company: Company, snapshot: string) {
    if (!company.cloud) {
      throw new Error('Empresa sem configuração de cloud')
    }

    const companyFolderId = await sendCreateFolder(company.foldername, company.cloud)
    const backupFolderId = await sendCreateFolder('BACKUPS_ACERVO', company.cloud, companyFolderId)
    return sendCreateFolder(snapshot, company.cloud, backupFolderId)
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

    const companyFolderId = await sendCreateFolder(company.foldername, company.cloud)
    const backupFolderId = await sendCreateFolder('BACKUPS_ACERVO', company.cloud, companyFolderId)
    const snapshots = await listDriveFilesMetadata(company.cloud, [{ id: backupFolderId }])
    const limit = DateTime.now().minus({ days: retentionDays })

    for (const snapshot of snapshots || []) {
      const snapshotDate = DateTime.fromFormat(snapshot.name, 'yyyy-MM-dd_HHmm')

      if (!snapshotDate.isValid || snapshotDate >= limit) continue

      await sendDeleteFile(snapshot.id, company.cloud)
    }
  }
}
