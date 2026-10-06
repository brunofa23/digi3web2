"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const crypto_1 = require("crypto");
const luxon_1 = require("luxon");
const Company_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Company"));
const DriveDuplicateFolderScan_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/DriveDuplicateFolderScan"));
const googledrive_1 = global[Symbol.for('ioc.use')]("App/Services/googleDrive/googledrive");
class DriveDuplicateFolderScanService {
    async getSnapshot() {
        const scan = await DriveDuplicateFolderScan_1.default.findOrFail(1);
        if (scan.status === 'IDLE' || (scan.status === 'RUNNING' &&
            (!scan.heartbeatAt || scan.heartbeatAt < luxon_1.DateTime.now().minus({ minutes: 15 })))) {
            await this.start();
        }
        return this.snapshot();
    }
    async start() {
        const token = (0, crypto_1.randomUUID)();
        const now = new Date();
        const claimed = await Database_1.default.from('drive_duplicate_folder_scans')
            .where('id', 1)
            .where((query) => query.whereNot('status', 'RUNNING')
            .orWhere('heartbeat_at', '<', luxon_1.DateTime.now().minus({ minutes: 15 }).toJSDate())
            .orWhereNull('heartbeat_at'))
            .update({ status: 'RUNNING', run_token: token, started_at: now,
            heartbeat_at: now, error_message: null, updated_at: now });
        if (claimed)
            void this.run(token);
        return this.snapshot();
    }
    async snapshot() {
        const scan = await DriveDuplicateFolderScan_1.default.findOrFail(1);
        return {
            status: scan.status,
            companies: scan.result || [],
            error_message: scan.errorMessage,
            started_at: scan.startedAt?.toISO() || null,
            finished_at: scan.finishedAt?.toISO() || null,
        };
    }
    async run(token) {
        try {
            const companies = await Company_1.default.query().select('id', 'name', 'foldername', 'cloud').orderBy('id');
            const result = companies.map((company) => ({
                company_id: company.id,
                company_name: company.name,
                folder_found: false,
                file_count: 0,
                size_bytes: '0',
                duplicates: [],
            }));
            for (const cloud of new Set(companies.map((company) => company.cloud))) {
                const cloudCompanies = companies.filter((company) => company.cloud === cloud);
                const folders = await (0, googledrive_1.sendListDriveFolders)(cloud, async () => {
                    const updated = await Database_1.default.from('drive_duplicate_folder_scans')
                        .where('id', 1).where('run_token', token)
                        .update({ heartbeat_at: new Date(), updated_at: new Date() });
                    if (!updated)
                        throw new Error('Pesquisa substituída por outra execução.');
                });
                const byId = new Map(folders.map((folder) => [folder.id, folder]));
                const roots = new Map();
                for (const folder of folders) {
                    if (folder.parents?.some((parent) => byId.has(parent)))
                        continue;
                    const company = cloudCompanies.find((item) => item.foldername === folder.name);
                    if (company)
                        roots.set(folder.id, company.id);
                }
                const companiesWithRoot = new Set(roots.values());
                for (const company of result) {
                    if (companiesWithRoot.has(company.company_id))
                        company.folder_found = true;
                }
                const companyByFolder = new Map();
                function getCompanyId(folderId, visited = new Set()) {
                    if (companyByFolder.has(folderId))
                        return companyByFolder.get(folderId) || null;
                    if (visited.has(folderId))
                        return null;
                    visited.add(folderId);
                    const folder = byId.get(folderId);
                    const companyId = roots.get(folderId) ||
                        folder?.parents?.map((parent) => getCompanyId(parent, visited)).find(Boolean) || null;
                    companyByFolder.set(folderId, companyId);
                    return companyId;
                }
                const namesByCompany = new Map();
                for (const folder of folders) {
                    const companyId = getCompanyId(folder.id);
                    if (!companyId)
                        continue;
                    if (!namesByCompany.has(companyId))
                        namesByCompany.set(companyId, new Map());
                    const names = namesByCompany.get(companyId);
                    if (!names.has(folder.name))
                        names.set(folder.name, []);
                    names.get(folder.name).push({ id: folder.id, url: `https://drive.google.com/drive/folders/${folder.id}` });
                }
                for (const company of result) {
                    const names = namesByCompany.get(company.company_id);
                    if (!names)
                        continue;
                    company.duplicates = [...names.entries()]
                        .filter(([, sameName]) => sameName.length > 1)
                        .map(([name, sameName]) => ({ name, folders: sameName }))
                        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
                }
                const totals = new Map();
                await (0, googledrive_1.sendCountDriveFiles)(cloud, async (files) => {
                    for (const file of files) {
                        const companyId = file.parents?.map((parent) => getCompanyId(parent)).find(Boolean);
                        if (!companyId)
                            continue;
                        const total = totals.get(companyId) || { count: 0, bytes: 0n };
                        total.count += 1;
                        total.bytes += BigInt(file.size || 0);
                        totals.set(companyId, total);
                    }
                    const updated = await Database_1.default.from('drive_duplicate_folder_scans')
                        .where('id', 1).where('run_token', token)
                        .update({ heartbeat_at: new Date(), updated_at: new Date() });
                    if (!updated)
                        throw new Error('Pesquisa substituída por outra execução.');
                });
                for (const company of result) {
                    const total = totals.get(company.company_id);
                    if (!total)
                        continue;
                    company.file_count = total.count;
                    company.size_bytes = total.bytes.toString();
                }
            }
            const now = new Date();
            await Database_1.default.from('drive_duplicate_folder_scans').where('id', 1).where('run_token', token)
                .update({ status: 'COMPLETED', result: JSON.stringify(result), finished_at: now,
                heartbeat_at: now, updated_at: now });
        }
        catch (error) {
            console.error('Erro ao pesquisar pastas duplicadas do Google Drive:', error);
            const now = new Date();
            await Database_1.default.from('drive_duplicate_folder_scans').where('id', 1).where('run_token', token)
                .update({ status: 'FAILED', error_message: 'Não foi possível consultar todas as nuvens do Google Drive.',
                updated_at: now });
        }
    }
}
exports.default = DriveDuplicateFolderScanService;
//# sourceMappingURL=DriveDuplicateFolderScanService.js.map