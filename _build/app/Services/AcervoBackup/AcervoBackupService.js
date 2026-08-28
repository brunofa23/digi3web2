"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Application_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Application"));
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const Env_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Env"));
const luxon_1 = require("luxon");
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const zlib_1 = require("zlib");
const util_1 = require("util");
const promise_1 = __importDefault(require("mysql2/promise"));
const AuditLog_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/AuditLog"));
const Company_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Company"));
const Typebook_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Typebook"));
const googledrive_1 = global[Symbol.for('ioc.use')]("App/Services/googleDrive/googledrive");
const gzipAsync = (0, util_1.promisify)(zlib_1.gzip);
const gunzipAsync = (0, util_1.promisify)(zlib_1.gunzip);
const uploadDriveFile = googledrive_1.sendUploadFiles;
const createDriveFolder = googledrive_1.sendCreateFolder;
const listDriveFilesMetadata = googledrive_1.sendListAllFilesMetadata;
const downloadDriveFileBuffer = googledrive_1.sendDownloadFileBuffer;
const TABLES = [
    'bookrecords',
    'indeximages',
    'documents',
    'document_configs',
    'indeximage_ocr_checks',
    'indeximage_ocr_entities',
];
const INDEX_FILE = 'index.json';
class AcervoBackupService {
    async backup(options) {
        const company = await Company_1.default.findOrFail(options.companyId);
        const typebooks = await this.getTypebooks(company.id, options.typebookId);
        const snapshot = luxon_1.DateTime.now().toFormat('yyyy-MM-dd_HHmm');
        const basePath = Application_1.default.tmpPath(`acervoBackups/company_${company.id}/${snapshot}`);
        if (typebooks.length === 0) {
            throw new Error(options.typebookId
                ? `Typebook ${options.typebookId} não encontrado para a empresa ${company.id}`
                : `Nenhum typebook encontrado para a empresa ${company.id}`);
        }
        await fs_1.promises.mkdir(basePath, { recursive: true });
        const manifest = {
            version: 1,
            scope: 'acervo',
            generated_at: luxon_1.DateTime.now().toISO(),
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
        };
        let driveBackupFolderId = null;
        let driveSnapshotFolderId = null;
        if (options.upload) {
            driveBackupFolderId = await this.ensureDriveBackupFolder(company);
            driveSnapshotFolderId = await createDriveFolder(snapshot, company.cloud, driveBackupFolderId);
        }
        for (const typebook of typebooks) {
            const result = await this.backupTypebook(company, typebook, basePath);
            if (options.upload && driveSnapshotFolderId) {
                const uploadResult = await uploadDriveFile(driveSnapshotFolderId, basePath, result.file, company.cloud, 'application/gzip');
                result.drive_file_id = uploadResult?.data?.id || null;
            }
            manifest.typebooks.push(result);
        }
        const manifestFile = 'manifest.json';
        const manifestPath = `${basePath}/${manifestFile}`;
        await fs_1.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
        if (options.upload && driveSnapshotFolderId) {
            const uploadResult = await uploadDriveFile(driveSnapshotFolderId, basePath, manifestFile, company.cloud, 'application/json');
            manifest.drive_manifest_file_id = uploadResult?.data?.id || null;
            await fs_1.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
        }
        await this.cleanupLocalRetention(company.id, options.retentionDays || 30);
        if (options.upload) {
            await this.cleanupDriveRetention(company, options.retentionDays || 30);
        }
        if (options.upload && driveBackupFolderId) {
            await this.updateDriveIndexAfterBackup(company, driveBackupFolderId, manifest, options.retentionDays || 30);
        }
        if (options.userId) {
            await this.logBackup(options, manifest);
        }
        return {
            snapshot,
            path: basePath,
            manifest,
        };
    }
    async restore(options) {
        this.validateSnapshot(options.snapshot);
        const company = await Company_1.default.findOrFail(options.companyId);
        const packageData = options.source === 'drive'
            ? await this.getDrivePackage(company, options.snapshot, options.typebookId)
            : await this.getLocalPackage(company.id, options.snapshot, options.typebookId);
        this.validateManifestPackage(packageData.manifest, options);
        const checksum = (0, crypto_1.createHash)('sha256').update(packageData.sqlGz).digest('hex');
        if (checksum !== packageData.typebook.checksum_sha256) {
            throw new Error('Checksum do arquivo SQL não confere com o manifest.json');
        }
        const sql = (await gunzipAsync(packageData.sqlGz)).toString('utf8');
        this.validateRestoreSql(sql, options.companyId, options.typebookId);
        const preparedRestore = await this.prepareRestoreSql(sql);
        if (options.dryRun) {
            await this.executeRestoreSqlAsDryRun(preparedRestore.sql);
            return {
                dryRun: true,
                applied: false,
                source: options.source || 'local',
                snapshot: options.snapshot,
                manifest: packageData.manifest,
                typebook: packageData.typebook,
                checksum,
                warnings: preparedRestore.warnings,
            };
        }
        if (!options.confirm) {
            throw new Error('Restauração exige confirmação explícita. Use --confirm após validar com --dry-run.');
        }
        const preRestore = await this.backup({
            companyId: options.companyId,
            typebookId: options.typebookId,
            upload: false,
            retentionDays: 30,
        });
        await this.executeRestoreSql(preparedRestore.sql);
        await this.logRestore(options, packageData.typebook, preRestore, preparedRestore.warnings);
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
        };
    }
    async listSnapshots(options) {
        const company = await Company_1.default.findOrFail(options.companyId);
        return options.source === 'drive'
            ? this.listDriveSnapshots(company, options.typebookId)
            : this.listLocalSnapshots(company.id, options.typebookId);
    }
    async getTypebooks(companyId, typebookId) {
        const query = Typebook_1.default.query()
            .where('companies_id', companyId)
            .orderBy('id', 'asc');
        if (typebookId) {
            query.andWhere('id', typebookId);
        }
        return query;
    }
    async backupTypebook(company, typebook, basePath) {
        const backups = await this.getTableBackups(company.id, typebook.id);
        const sql = this.buildRestoreSql(company.id, typebook, backups);
        const sqlGz = await gzipAsync(Buffer.from(sql, 'utf8'));
        const file = `acervo_company_${company.id}_typebook_${typebook.id}.sql.gz`;
        const filePath = `${basePath}/${file}`;
        await fs_1.promises.writeFile(filePath, sqlGz);
        const checksum = (0, crypto_1.createHash)('sha256').update(sqlGz).digest('hex');
        const stat = await fs_1.promises.stat(filePath);
        return {
            typebooks_id: typebook.id,
            typebook_name: typebook.name,
            typebook_path: typebook.path,
            file,
            file_size: stat.size,
            checksum_sha256: checksum,
            drive_file_id: null,
            tables: backups.reduce((summary, item) => {
                summary[item.table] = item.rows.length;
                return summary;
            }, {}),
            total_rows: backups.reduce((total, item) => total + item.rows.length, 0),
        };
    }
    async getLocalPackage(companyId, snapshot, typebookId) {
        const basePath = Application_1.default.tmpPath(`acervoBackups/company_${companyId}/${snapshot}`);
        const manifestPath = `${basePath}/manifest.json`;
        const manifestExists = await this.fileExists(manifestPath);
        if (!manifestExists) {
            throw new Error(`Snapshot local não encontrado: ${basePath}`);
        }
        const manifest = JSON.parse(await fs_1.promises.readFile(manifestPath, 'utf8'));
        const typebook = this.findManifestTypebook(manifest, typebookId);
        const sqlPath = `${basePath}/${typebook.file}`;
        const sqlExists = await this.fileExists(sqlPath);
        if (!sqlExists) {
            throw new Error(`Arquivo SQL do typebook ${typebookId} não encontrado no snapshot local`);
        }
        const sqlGz = await fs_1.promises.readFile(sqlPath);
        return {
            manifest,
            typebook,
            sqlGz,
        };
    }
    async listLocalSnapshots(companyId, typebookId) {
        const companyPath = Application_1.default.tmpPath(`acervoBackups/company_${companyId}`);
        const snapshots = await fs_1.promises.readdir(companyPath).catch(() => []);
        const result = [];
        for (const snapshot of snapshots) {
            const manifestPath = `${companyPath}/${snapshot}/manifest.json`;
            if (!await this.fileExists(manifestPath))
                continue;
            const manifest = JSON.parse(await fs_1.promises.readFile(manifestPath, 'utf8'));
            const snapshotSummary = this.buildSnapshotSummary(manifest, 'local', typebookId, snapshot);
            if (snapshotSummary.typebooks.length === 0)
                continue;
            result.push(snapshotSummary);
        }
        return this.sortSnapshots(result);
    }
    async listDriveSnapshots(company, typebookId) {
        if (!company.cloud) {
            throw new Error('Empresa sem configuração de cloud');
        }
        const backupFolderId = await this.ensureDriveBackupFolder(company);
        const backupFiles = await listDriveFilesMetadata(company.cloud, [{ id: backupFolderId }]);
        const index = await this.readDriveIndex(company, backupFolderId, backupFiles);
        if (index) {
            return this.sortSnapshots(this.filterSnapshotSummaries(index.snapshots, typebookId));
        }
        const snapshots = await this.collectDriveSnapshotSummaries(company, backupFolderId, backupFiles);
        await this.writeDriveIndex(company, backupFolderId, snapshots, 30).catch((error) => {
            console.error('Erro ao atualizar index.json do acervo:', error);
        });
        return this.sortSnapshots(this.filterSnapshotSummaries(snapshots, typebookId));
    }
    async collectDriveSnapshotSummaries(company, backupFolderId, backupFiles) {
        const files = backupFiles || await listDriveFilesMetadata(company.cloud, [{ id: backupFolderId }]);
        const result = [];
        for (const snapshot of files || []) {
            if (snapshot.mimeType !== 'application/vnd.google-apps.folder')
                continue;
            const snapshotDate = luxon_1.DateTime.fromFormat(snapshot.name, 'yyyy-MM-dd_HHmm');
            if (!snapshotDate.isValid)
                continue;
            const snapshotFiles = await listDriveFilesMetadata(company.cloud, [{ id: snapshot.id }]);
            const manifestFile = snapshotFiles?.find((item) => item.name === 'manifest.json');
            if (!manifestFile?.id)
                continue;
            const manifestBuffer = await downloadDriveFileBuffer(manifestFile.id, company.cloud);
            const manifest = JSON.parse(manifestBuffer.toString('utf8'));
            const snapshotSummary = this.buildSnapshotSummary(manifest, 'drive', undefined, snapshot.name);
            if (snapshotSummary.typebooks.length === 0)
                continue;
            result.push(snapshotSummary);
        }
        return this.sortSnapshots(result);
    }
    async readDriveIndex(company, backupFolderId, backupFiles) {
        const files = backupFiles || await listDriveFilesMetadata(company.cloud, [{ id: backupFolderId }]);
        const indexFile = files?.find((item) => item.name === INDEX_FILE);
        if (!indexFile?.id)
            return null;
        try {
            const indexBuffer = await downloadDriveFileBuffer(indexFile.id, company.cloud);
            const index = JSON.parse(indexBuffer.toString('utf8'));
            if (index?.scope !== 'acervo_index')
                return null;
            if (Number(index?.company?.id) !== Number(company.id))
                return null;
            if (!Array.isArray(index?.snapshots))
                return null;
            return index;
        }
        catch (error) {
            console.error('Erro ao ler index.json do acervo:', error);
            return null;
        }
    }
    async updateDriveIndexAfterBackup(company, backupFolderId, manifest, retentionDays) {
        const backupFiles = await listDriveFilesMetadata(company.cloud, [{ id: backupFolderId }]);
        const index = await this.readDriveIndex(company, backupFolderId, backupFiles);
        const snapshots = index
            ? index.snapshots
            : await this.collectDriveSnapshotSummaries(company, backupFolderId, backupFiles);
        const currentSnapshot = this.mergeSnapshotSummary(snapshots, this.buildSnapshotSummary(manifest, 'drive'));
        const limit = luxon_1.DateTime.now().minus({ days: retentionDays });
        const updatedSnapshots = snapshots
            .filter((snapshot) => snapshot.snapshot !== currentSnapshot.snapshot)
            .concat(currentSnapshot)
            .filter((snapshot) => {
            const snapshotDate = luxon_1.DateTime.fromFormat(snapshot.snapshot, 'yyyy-MM-dd_HHmm');
            return snapshotDate.isValid && snapshotDate >= limit;
        });
        await this.writeDriveIndex(company, backupFolderId, updatedSnapshots, retentionDays);
    }
    mergeSnapshotSummary(snapshots, currentSnapshot) {
        const existingSnapshot = (snapshots || []).find((snapshot) => snapshot.snapshot === currentSnapshot.snapshot);
        if (!existingSnapshot)
            return currentSnapshot;
        const currentTypebookIds = new Set(currentSnapshot.typebooks.map((typebook) => Number(typebook.typebooks_id)));
        const typebooks = [
            ...(existingSnapshot.typebooks || []).filter((typebook) => {
                return !currentTypebookIds.has(Number(typebook.typebooks_id));
            }),
            ...currentSnapshot.typebooks,
        ];
        return this.buildSnapshotSummary({
            snapshot: currentSnapshot.snapshot,
            generated_at: currentSnapshot.generated_at,
            company: currentSnapshot.company,
            typebooks,
        }, 'drive');
    }
    async writeDriveIndex(company, backupFolderId, snapshots, retentionDays) {
        const indexPath = Application_1.default.tmpPath(`acervoBackups/company_${company.id}/_index`);
        const index = {
            version: 1,
            scope: 'acervo_index',
            generated_at: luxon_1.DateTime.now().toISO(),
            company: snapshots[0]?.company || {
                id: company.id,
                name: company.name,
                foldername: company.foldername,
                cloud: company.cloud,
            },
            retention_days: retentionDays,
            snapshots: this.sortSnapshots(snapshots),
        };
        await fs_1.promises.mkdir(indexPath, { recursive: true });
        await fs_1.promises.writeFile(`${indexPath}/${INDEX_FILE}`, JSON.stringify(index, null, 2));
        const files = await listDriveFilesMetadata(company.cloud, [{ id: backupFolderId }]);
        const oldIndexes = (files || []).filter((item) => item.name === INDEX_FILE);
        for (const oldIndex of oldIndexes) {
            await (0, googledrive_1.sendDeleteFile)(oldIndex.id, company.cloud);
        }
        await uploadDriveFile(backupFolderId, indexPath, INDEX_FILE, company.cloud, 'application/json');
    }
    buildSnapshotSummary(manifest, source, typebookId, snapshotName) {
        const typebooks = this.filterManifestTypebooks(manifest, typebookId);
        return {
            snapshot: snapshotName || manifest.snapshot,
            source,
            generated_at: manifest.generated_at,
            company: manifest.company,
            typebooks,
            typebooks_count: typebooks.length,
            total_rows: typebooks.reduce((total, item) => total + (Number(item.total_rows) || 0), 0),
            file_size: typebooks.reduce((total, item) => total + (Number(item.file_size) || 0), 0),
        };
    }
    filterSnapshotSummaries(snapshots, typebookId) {
        return (snapshots || [])
            .map((snapshot) => {
            return this.buildSnapshotSummary({
                snapshot: snapshot.snapshot,
                generated_at: snapshot.generated_at,
                company: snapshot.company,
                typebooks: snapshot.typebooks,
            }, snapshot.source === 'local' ? 'local' : 'drive', typebookId, snapshot.snapshot);
        })
            .filter((snapshot) => snapshot.typebooks.length > 0);
    }
    filterManifestTypebooks(manifest, typebookId) {
        const typebooks = Array.isArray(manifest?.typebooks) ? manifest.typebooks : [];
        if (!typebookId)
            return typebooks;
        return typebooks.filter((item) => Number(item.typebooks_id) === Number(typebookId));
    }
    sortSnapshots(snapshots) {
        return snapshots.sort((a, b) => String(b.snapshot).localeCompare(String(a.snapshot)));
    }
    async getDrivePackage(company, snapshot, typebookId) {
        if (!company.cloud) {
            throw new Error('Empresa sem configuração de cloud');
        }
        const companyFolderId = await createDriveFolder(company.foldername, company.cloud);
        const backupFolderId = await createDriveFolder('BACKUPS_ACERVO', company.cloud, companyFolderId);
        const snapshotFolderId = await this.findDriveFolder(company.cloud, backupFolderId, snapshot);
        const files = await listDriveFilesMetadata(company.cloud, [{ id: snapshotFolderId }]);
        const manifestFile = this.findDriveFile(files, 'manifest.json');
        const manifestBuffer = await downloadDriveFileBuffer(manifestFile.id, company.cloud);
        const manifest = JSON.parse(manifestBuffer.toString('utf8'));
        const typebook = this.findManifestTypebook(manifest, typebookId);
        const sqlFile = this.findDriveFile(files, typebook.file);
        const sqlGz = await downloadDriveFileBuffer(sqlFile.id, company.cloud);
        return {
            manifest,
            typebook,
            sqlGz,
        };
    }
    findManifestTypebook(manifest, typebookId) {
        const typebook = manifest?.typebooks?.find((item) => Number(item.typebooks_id) === Number(typebookId));
        if (!typebook) {
            throw new Error(`Typebook ${typebookId} não encontrado no manifest.json`);
        }
        return typebook;
    }
    async findDriveFolder(cloud, parentId, folderName) {
        const files = await listDriveFilesMetadata(cloud, [{ id: parentId }]);
        const folder = files?.find((item) => item.name === folderName && item.mimeType === 'application/vnd.google-apps.folder');
        if (!folder?.id) {
            throw new Error(`Pasta ${folderName} não encontrada no Google Drive`);
        }
        return folder.id;
    }
    findDriveFile(files, fileName) {
        const file = files?.find((item) => item.name === fileName);
        if (!file?.id) {
            throw new Error(`Arquivo ${fileName} não encontrado no Google Drive`);
        }
        return file;
    }
    async getTableBackups(companyId, typebookId) {
        const typebookRows = await Database_1.default.from('typebooks')
            .where('companies_id', companyId)
            .andWhere('id', typebookId);
        const bookrecordRows = await Database_1.default.from('bookrecords')
            .where('companies_id', companyId)
            .andWhere('typebooks_id', typebookId);
        const bookrecordIds = bookrecordRows.map((row) => row.id);
        const result = [
            {
                table: 'typebooks',
                rows: typebookRows,
                columns: await this.getColumns('typebooks'),
            },
        ];
        for (const table of TABLES) {
            const columns = await this.getColumns(table);
            const query = Database_1.default.from(table)
                .where('companies_id', companyId)
                .andWhere('typebooks_id', typebookId);
            if (table === 'bookrecords') {
                query.whereIn('id', bookrecordIds);
            }
            else if (columns.includes('bookrecords_id')) {
                if (bookrecordIds.length === 0) {
                    query.whereRaw('1 = 0');
                }
                else {
                    query.whereIn('bookrecords_id', bookrecordIds);
                }
            }
            const rows = await query;
            result.push({
                table,
                rows,
                columns,
            });
        }
        return result;
    }
    async getColumns(table) {
        const result = await Database_1.default.rawQuery(`
        SELECT COLUMN_NAME
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
      `, [table]);
        const rows = Array.isArray(result?.[0]) ? result[0] : result;
        return rows.map((row) => row.COLUMN_NAME);
    }
    buildRestoreSql(companyId, typebook, backups) {
        const lines = [
            `-- Backup acervo company_id=${companyId} typebooks_id=${typebook.id}`,
            `-- Gerado em ${luxon_1.DateTime.now().toISO()}`,
            'START TRANSACTION;',
            '',
            `DELETE FROM indeximage_ocr_entities WHERE companies_id = ${companyId} AND typebooks_id = ${typebook.id};`,
            `DELETE FROM indeximage_ocr_checks WHERE companies_id = ${companyId} AND typebooks_id = ${typebook.id};`,
            `DELETE FROM document_configs WHERE companies_id = ${companyId} AND typebooks_id = ${typebook.id};`,
            `DELETE FROM documents WHERE companies_id = ${companyId} AND typebooks_id = ${typebook.id};`,
            `DELETE FROM indeximages WHERE companies_id = ${companyId} AND typebooks_id = ${typebook.id};`,
            `DELETE FROM bookrecords WHERE companies_id = ${companyId} AND typebooks_id = ${typebook.id};`,
            '',
        ];
        for (const backup of backups) {
            lines.push(...this.buildInsertSql(backup));
        }
        lines.push('COMMIT;', '');
        return lines.join('\n');
    }
    validateManifestPackage(manifest, options) {
        if (manifest?.scope !== 'acervo') {
            throw new Error('Manifest inválido: escopo diferente de acervo');
        }
        if (manifest?.snapshot !== options.snapshot) {
            throw new Error('Manifest inválido: snapshot diferente do solicitado');
        }
        if (Number(manifest?.company?.id) !== Number(options.companyId)) {
            throw new Error('Manifest inválido: empresa diferente da solicitada');
        }
    }
    validateRestoreSql(sql, companyId, typebookId) {
        const header = `-- Backup acervo company_id=${companyId} typebooks_id=${typebookId}`;
        if (!sql.includes(header)) {
            throw new Error('SQL de restauração não pertence ao company/typebook solicitado');
        }
        if (!sql.includes('START TRANSACTION;') || !sql.includes('COMMIT;')) {
            throw new Error('SQL de restauração sem transaction completa');
        }
    }
    validateSnapshot(snapshot) {
        const snapshotDate = luxon_1.DateTime.fromFormat(snapshot, 'yyyy-MM-dd_HHmm');
        if (!snapshotDate.isValid || snapshotDate.toFormat('yyyy-MM-dd_HHmm') !== snapshot) {
            throw new Error('Snapshot inválido. Use o formato yyyy-MM-dd_HHmm, exemplo: 2026-08-28_0600');
        }
    }
    async executeRestoreSql(sql) {
        const connection = await promise_1.default.createConnection({
            host: Env_1.default.get('MYSQL_HOST'),
            port: Env_1.default.get('MYSQL_PORT'),
            user: Env_1.default.get('MYSQL_USER'),
            password: Env_1.default.get('MYSQL_PASSWORD', ''),
            database: Env_1.default.get('MYSQL_DB_NAME'),
            multipleStatements: true,
        });
        try {
            await connection.query(sql);
        }
        catch (error) {
            await connection.query('ROLLBACK').catch(() => null);
            throw error;
        }
        finally {
            await connection.end();
        }
    }
    async executeRestoreSqlAsDryRun(sql) {
        const dryRunSql = sql.replace(/COMMIT;\s*$/i, 'ROLLBACK;');
        await this.executeRestoreSql(dryRunSql);
    }
    async logRestore(options, typebook, preRestore, warnings) {
        await AuditLog_1.default.create({
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
            firstAt: luxon_1.DateTime.now(),
            lastAt: luxon_1.DateTime.now(),
            ip: options.ip || null,
        });
    }
    async logBackup(options, manifest) {
        await AuditLog_1.default.create({
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
            firstAt: luxon_1.DateTime.now(),
            lastAt: luxon_1.DateTime.now(),
            ip: options.ip || null,
        });
    }
    buildInsertSql(backup) {
        if (backup.rows.length === 0)
            return [`-- ${backup.table}: 0 registros`, ''];
        const lines = [];
        const columns = backup.columns;
        const chunkSize = 200;
        for (let index = 0; index < backup.rows.length; index += chunkSize) {
            const rows = backup.rows.slice(index, index + chunkSize);
            const values = rows.map((row) => {
                return `(${columns.map((column) => this.toSqlValue(row[column])).join(', ')})`;
            });
            lines.push(`INSERT INTO ${backup.table} (${columns.map((column) => `\`${column}\``).join(', ')}) VALUES`);
            lines.push(`${values.join(',\n')}`);
            lines.push(this.getDuplicateUpdate(columns));
            lines.push('');
        }
        return lines;
    }
    getDuplicateUpdate(columns) {
        const updateColumns = columns.filter((column) => column !== 'id');
        if (updateColumns.length === 0) {
            return ';';
        }
        return `ON DUPLICATE KEY UPDATE ${updateColumns.map((column) => `\`${column}\` = VALUES(\`${column}\`)`).join(', ')};`;
    }
    toSqlValue(value) {
        if (value === null || value === undefined)
            return 'NULL';
        if (Buffer.isBuffer(value))
            return `X'${value.toString('hex')}'`;
        if (value instanceof Date)
            return `'${luxon_1.DateTime.fromJSDate(value).toFormat('yyyy-LL-dd HH:mm:ss')}'`;
        if (typeof value === 'number')
            return String(value);
        if (typeof value === 'bigint')
            return String(value);
        if (typeof value === 'boolean')
            return value ? '1' : '0';
        if (typeof value === 'object')
            return this.escapeSql(JSON.stringify(value));
        return this.escapeSql(String(value));
    }
    escapeSql(value) {
        return `'${value
            .replace(/\\/g, '\\\\')
            .replace(/\0/g, '\\0')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\x08/g, '\\b')
            .replace(/\t/g, '\\t')
            .replace(/\x1a/g, '\\Z')
            .replace(/'/g, "\\'")}'`;
    }
    async prepareRestoreSql(sql) {
        const warnings = [];
        let preparedSql = sql;
        if (preparedSql.includes('\\b')) {
            preparedSql = preparedSql.replace(/\\b/g, '');
            warnings.push('Backup antigo continha escapes "\\b" em textos; eles foram normalizados antes da restauração.');
        }
        preparedSql = await this.removeMissingInsertColumns(preparedSql, warnings);
        preparedSql = this.removeRowsWithoutParentBookrecord(preparedSql, warnings);
        return {
            sql: preparedSql,
            warnings,
        };
    }
    async removeMissingInsertColumns(sql, warnings) {
        const insertRegex = /INSERT INTO ([a-zA-Z0-9_]+) \(([\s\S]*?)\) VALUES\n([\s\S]*?)\nON DUPLICATE KEY UPDATE [\s\S]*?;/g;
        const matches = Array.from(sql.matchAll(insertRegex));
        const tables = Array.from(new Set(matches.map((match) => match[1])));
        const columnCache = new Map();
        for (const table of tables) {
            columnCache.set(table, new Set(await this.getColumns(table)));
        }
        return sql.replace(insertRegex, (statement, table, columnSql, valuesSql) => {
            return this.sanitizeInsertStatement(statement, table, columnSql, valuesSql, columnCache, warnings);
        });
    }
    sanitizeInsertStatement(statement, table, columnSql, valuesSql, columnCache, warnings) {
        const currentColumns = columnCache.get(table);
        if (!currentColumns || currentColumns.size === 0)
            return statement;
        const columns = this.parseInsertColumns(columnSql);
        const keepIndexes = columns
            .map((column, index) => currentColumns.has(column) ? index : -1)
            .filter((index) => index >= 0);
        const ignoredColumns = columns.filter((column) => !currentColumns.has(column));
        if (ignoredColumns.length === 0)
            return statement;
        const rows = this.parseInsertRows(valuesSql);
        const sanitizedRows = rows.map((row) => {
            const values = this.parseRowValues(row);
            return `(${keepIndexes.map((index) => values[index]).join(', ')})`;
        });
        const keptColumns = keepIndexes.map((index) => columns[index]);
        warnings.push(`Tabela ${table}: colunas ignoradas por não existirem no banco atual: ${ignoredColumns.join(', ')}.`);
        return [
            `INSERT INTO ${table} (${keptColumns.map((column) => `\`${column}\``).join(', ')}) VALUES`,
            sanitizedRows.join(',\n'),
            this.getDuplicateUpdate(keptColumns),
        ].join('\n');
    }
    parseInsertColumns(columnSql) {
        return Array.from(columnSql.matchAll(/`([^`]+)`/g)).map((match) => match[1]);
    }
    parseInsertRows(valuesSql) {
        const rows = [];
        let start = -1;
        let depth = 0;
        let inString = false;
        let escaped = false;
        for (let index = 0; index < valuesSql.length; index++) {
            const char = valuesSql[index];
            if (inString) {
                if (escaped) {
                    escaped = false;
                }
                else if (char === '\\') {
                    escaped = true;
                }
                else if (char === "'") {
                    inString = false;
                }
                continue;
            }
            if (char === "'") {
                inString = true;
                continue;
            }
            if (char === '(') {
                if (depth === 0)
                    start = index;
                depth++;
            }
            else if (char === ')') {
                depth--;
                if (depth === 0 && start >= 0) {
                    rows.push(valuesSql.slice(start, index + 1));
                    start = -1;
                }
            }
        }
        return rows;
    }
    parseRowValues(rowSql) {
        const content = rowSql.trim().replace(/^\(/, '').replace(/\)$/, '');
        const values = [];
        let start = 0;
        let inString = false;
        let escaped = false;
        for (let index = 0; index < content.length; index++) {
            const char = content[index];
            if (inString) {
                if (escaped) {
                    escaped = false;
                }
                else if (char === '\\') {
                    escaped = true;
                }
                else if (char === "'") {
                    inString = false;
                }
                continue;
            }
            if (char === "'") {
                inString = true;
                continue;
            }
            if (char === ',') {
                values.push(content.slice(start, index).trim());
                start = index + 1;
            }
        }
        values.push(content.slice(start).trim());
        return values;
    }
    removeRowsWithoutParentBookrecord(sql, warnings) {
        const insertRegex = /INSERT INTO ([a-zA-Z0-9_]+) \(([\s\S]*?)\) VALUES\n([\s\S]*?)\nON DUPLICATE KEY UPDATE [\s\S]*?;/g;
        const bookrecordIds = new Set();
        const dependentTables = [
            'indeximages',
            'documents',
            'indeximage_ocr_checks',
            'indeximage_ocr_entities',
        ];
        for (const match of sql.matchAll(insertRegex)) {
            const [, table, columnSql, valuesSql] = match;
            if (table !== 'bookrecords')
                continue;
            const columns = this.parseInsertColumns(columnSql);
            const idIndex = columns.indexOf('id');
            if (idIndex < 0)
                continue;
            for (const row of this.parseInsertRows(valuesSql)) {
                const values = this.parseRowValues(row);
                const id = this.getSqlNumber(values[idIndex]);
                if (id)
                    bookrecordIds.add(id);
            }
        }
        if (bookrecordIds.size === 0)
            return sql;
        return sql.replace(insertRegex, (statement, table, columnSql, valuesSql) => {
            if (!dependentTables.includes(table))
                return statement;
            const columns = this.parseInsertColumns(columnSql);
            const parentIndex = columns.indexOf('bookrecords_id');
            if (parentIndex < 0)
                return statement;
            const rows = this.parseInsertRows(valuesSql);
            const validRows = rows.filter((row) => {
                const values = this.parseRowValues(row);
                const parentId = this.getSqlNumber(values[parentIndex]);
                return parentId ? bookrecordIds.has(parentId) : true;
            });
            const ignoredRows = rows.length - validRows.length;
            if (ignoredRows === 0)
                return statement;
            warnings.push(`Tabela ${table}: ${ignoredRows} registro(s) ignorado(s) porque o bookrecords_id não existe no snapshot.`);
            if (validRows.length === 0) {
                return `-- ${table}: ${ignoredRows} registro(s) ignorado(s) por bookrecords_id inexistente`;
            }
            return [
                `INSERT INTO ${table} (${columns.map((column) => `\`${column}\``).join(', ')}) VALUES`,
                validRows.join(',\n'),
                this.getDuplicateUpdate(columns),
            ].join('\n');
        });
    }
    getSqlNumber(value) {
        const numberValue = Number(String(value || '').trim());
        return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : null;
    }
    async ensureDriveBackupFolder(company) {
        if (!company.cloud) {
            throw new Error('Empresa sem configuração de cloud');
        }
        const companyFolderId = await createDriveFolder(company.foldername, company.cloud);
        return createDriveFolder('BACKUPS_ACERVO', company.cloud, companyFolderId);
    }
    async cleanupLocalRetention(companyId, retentionDays) {
        const companyPath = Application_1.default.tmpPath(`acervoBackups/company_${companyId}`);
        const snapshots = await fs_1.promises.readdir(companyPath).catch(() => []);
        const limit = luxon_1.DateTime.now().minus({ days: retentionDays });
        for (const snapshot of snapshots) {
            const snapshotDate = luxon_1.DateTime.fromFormat(snapshot, 'yyyy-MM-dd_HHmm');
            if (!snapshotDate.isValid || snapshotDate >= limit)
                continue;
            await fs_1.promises.rm(`${companyPath}/${snapshot}`, { recursive: true, force: true });
        }
    }
    async fileExists(path) {
        return fs_1.promises.access(path).then(() => true).catch(() => false);
    }
    async cleanupDriveRetention(company, retentionDays) {
        if (!company.cloud)
            return;
        const backupFolderId = await this.ensureDriveBackupFolder(company);
        const snapshots = await listDriveFilesMetadata(company.cloud, [{ id: backupFolderId }]);
        const limit = luxon_1.DateTime.now().minus({ days: retentionDays });
        for (const snapshot of snapshots || []) {
            const snapshotDate = luxon_1.DateTime.fromFormat(snapshot.name, 'yyyy-MM-dd_HHmm');
            if (!snapshotDate.isValid || snapshotDate >= limit)
                continue;
            await (0, googledrive_1.sendDeleteFile)(snapshot.id, company.cloud);
        }
    }
}
exports.default = AcervoBackupService;
//# sourceMappingURL=AcervoBackupService.js.map