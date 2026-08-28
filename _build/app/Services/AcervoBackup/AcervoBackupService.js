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
        let driveSnapshotFolderId = null;
        if (options.upload) {
            driveSnapshotFolderId = await this.ensureDriveSnapshotFolder(company, snapshot);
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
        if (options.dryRun) {
            return {
                dryRun: true,
                applied: false,
                source: options.source || 'local',
                snapshot: options.snapshot,
                manifest: packageData.manifest,
                typebook: packageData.typebook,
                checksum,
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
        await this.executeRestoreSql(sql);
        await this.logRestore(options, packageData.typebook, preRestore);
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
            const typebooks = this.filterManifestTypebooks(manifest, typebookId);
            if (typebooks.length === 0)
                continue;
            result.push({
                snapshot,
                source: 'local',
                generated_at: manifest.generated_at,
                company: manifest.company,
                typebooks,
            });
        }
        return this.sortSnapshots(result);
    }
    async listDriveSnapshots(company, typebookId) {
        if (!company.cloud) {
            throw new Error('Empresa sem configuração de cloud');
        }
        const companyFolderId = await (0, googledrive_1.sendCreateFolder)(company.foldername, company.cloud);
        const backupFolderId = await (0, googledrive_1.sendCreateFolder)('BACKUPS_ACERVO', company.cloud, companyFolderId);
        const snapshots = await listDriveFilesMetadata(company.cloud, [{ id: backupFolderId }]);
        const result = [];
        for (const snapshot of snapshots || []) {
            if (snapshot.mimeType !== 'application/vnd.google-apps.folder')
                continue;
            const snapshotDate = luxon_1.DateTime.fromFormat(snapshot.name, 'yyyy-MM-dd_HHmm');
            if (!snapshotDate.isValid)
                continue;
            const files = await listDriveFilesMetadata(company.cloud, [{ id: snapshot.id }]);
            const manifestFile = files?.find((item) => item.name === 'manifest.json');
            if (!manifestFile?.id)
                continue;
            const manifestBuffer = await downloadDriveFileBuffer(manifestFile.id, company.cloud);
            const manifest = JSON.parse(manifestBuffer.toString('utf8'));
            const typebooks = this.filterManifestTypebooks(manifest, typebookId);
            if (typebooks.length === 0)
                continue;
            result.push({
                snapshot: snapshot.name,
                source: 'drive',
                generated_at: manifest.generated_at,
                company: manifest.company,
                typebooks,
            });
        }
        return this.sortSnapshots(result);
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
        const companyFolderId = await (0, googledrive_1.sendCreateFolder)(company.foldername, company.cloud);
        const backupFolderId = await (0, googledrive_1.sendCreateFolder)('BACKUPS_ACERVO', company.cloud, companyFolderId);
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
        const result = [
            {
                table: 'typebooks',
                rows: typebookRows,
                columns: await this.getColumns('typebooks'),
            },
        ];
        for (const table of TABLES) {
            const rows = await Database_1.default.from(table)
                .where('companies_id', companyId)
                .andWhere('typebooks_id', typebookId);
            result.push({
                table,
                rows,
                columns: await this.getColumns(table),
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
    async logRestore(options, typebook, preRestore) {
        await AuditLog_1.default.create({
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
            firstAt: luxon_1.DateTime.now(),
            lastAt: luxon_1.DateTime.now(),
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
            .replace(/\b/g, '\\b')
            .replace(/\t/g, '\\t')
            .replace(/\x1a/g, '\\Z')
            .replace(/'/g, "\\'")}'`;
    }
    async ensureDriveSnapshotFolder(company, snapshot) {
        if (!company.cloud) {
            throw new Error('Empresa sem configuração de cloud');
        }
        const companyFolderId = await (0, googledrive_1.sendCreateFolder)(company.foldername, company.cloud);
        const backupFolderId = await (0, googledrive_1.sendCreateFolder)('BACKUPS_ACERVO', company.cloud, companyFolderId);
        return (0, googledrive_1.sendCreateFolder)(snapshot, company.cloud, backupFolderId);
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
        const companyFolderId = await (0, googledrive_1.sendCreateFolder)(company.foldername, company.cloud);
        const backupFolderId = await (0, googledrive_1.sendCreateFolder)('BACKUPS_ACERVO', company.cloud, companyFolderId);
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