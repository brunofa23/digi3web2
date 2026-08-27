"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RETENTION_DAYS = exports.getUploadJobRetentionStart = exports.cleanupOldImageUploadJobs = void 0;
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const luxon_1 = require("luxon");
const RETENTION_DAYS = 120;
exports.RETENTION_DAYS = RETENTION_DAYS;
const CLEANUP_BATCH_LIMIT = 5000;
let lastCleanupDate = null;
function getUploadJobRetentionStart() {
    return luxon_1.DateTime.local().minus({ days: RETENTION_DAYS }).startOf('day');
}
exports.getUploadJobRetentionStart = getUploadJobRetentionStart;
async function cleanupOldImageUploadJobs() {
    const today = luxon_1.DateTime.local().toISODate();
    if (lastCleanupDate === today)
        return 0;
    const cutoff = getUploadJobRetentionStart().toFormat('yyyy-MM-dd HH:mm:ss');
    let deletedTotal = 0;
    try {
        while (true) {
            const result = await Database_1.default.rawQuery(`DELETE FROM image_upload_jobs WHERE created_at < ? LIMIT ${CLEANUP_BATCH_LIMIT}`, [cutoff]);
            const deleted = Number(result?.[0]?.affectedRows || result?.affectedRows || 0);
            deletedTotal += deleted;
            if (deleted < CLEANUP_BATCH_LIMIT)
                break;
        }
        lastCleanupDate = today;
    }
    catch (error) {
        console.error('Erro ao limpar image_upload_jobs antigos:', error);
    }
    return deletedTotal;
}
exports.cleanupOldImageUploadJobs = cleanupOldImageUploadJobs;
//# sourceMappingURL=imageUploadJobs.js.map