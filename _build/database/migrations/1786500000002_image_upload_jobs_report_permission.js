"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'image_upload_jobs';
        this.permissiongroupId = 45;
    }
    async up() {
        if (!(await this.hasColumn('user_id'))) {
            try {
                await this.schema.alterTable(this.tableName, (table) => {
                    table
                        .integer('user_id')
                        .unsigned()
                        .nullable()
                        .references('id')
                        .inTable('users')
                        .onDelete('SET NULL')
                        .after('typebooks_id');
                });
            }
            catch (error) {
                if (!this.isDuplicateColumnError(error))
                    throw error;
            }
        }
        if (!(await this.hasIndex('image_upload_jobs_company_typebook_created_idx'))) {
            try {
                await this.schema.alterTable(this.tableName, (table) => {
                    table.index(['companies_id', 'typebooks_id', 'created_at'], 'image_upload_jobs_company_typebook_created_idx');
                });
            }
            catch (error) {
                if (!this.isDuplicateIndexError(error))
                    throw error;
            }
        }
        if (!(await this.hasIndex('image_upload_jobs_user_created_idx'))) {
            try {
                await this.schema.alterTable(this.tableName, (table) => {
                    table.index(['user_id', 'created_at'], 'image_upload_jobs_user_created_idx');
                });
            }
            catch (error) {
                if (!this.isDuplicateIndexError(error))
                    throw error;
            }
        }
        this.defer(async (db) => {
            const now = new Date();
            const exists = await db
                .from('permissiongroups')
                .where('id', this.permissiongroupId)
                .first();
            if (!exists) {
                await db.table('permissiongroups').insert({
                    id: this.permissiongroupId,
                    name: 'Histórico de uploads de imagens',
                    desc: 'Acesso ao relatório de uploads de imagens dos últimos 120 dias.',
                    inactive: false,
                    created_at: now,
                    updated_at: now,
                });
            }
            const digi3Group = await db
                .from('usergroups')
                .where('id', 1)
                .first();
            if (!digi3Group)
                return;
            const linked = await db
                .from('groupxpermissions')
                .where('usergroup_id', 1)
                .where('permissiongroup_id', this.permissiongroupId)
                .first();
            if (linked)
                return;
            await db.table('groupxpermissions').insert({
                usergroup_id: 1,
                permissiongroup_id: this.permissiongroupId,
                created_at: now,
                updated_at: now,
            });
        });
    }
    async down() {
        this.defer(async (db) => {
            await db
                .from('groupxpermissions')
                .where('permissiongroup_id', this.permissiongroupId)
                .delete();
            await db
                .from('permissiongroups')
                .where('id', this.permissiongroupId)
                .delete();
        });
        if (await this.hasIndex('image_upload_jobs_company_typebook_created_idx')) {
            await this.schema.alterTable(this.tableName, (table) => {
                table.dropIndex(['companies_id', 'typebooks_id', 'created_at'], 'image_upload_jobs_company_typebook_created_idx');
            });
        }
        if (await this.hasIndex('image_upload_jobs_user_created_idx')) {
            await this.schema.alterTable(this.tableName, (table) => {
                table.dropIndex(['user_id', 'created_at'], 'image_upload_jobs_user_created_idx');
            });
        }
        if (await this.hasColumn('user_id')) {
            await this.schema.alterTable(this.tableName, (table) => {
                table.dropColumn('user_id');
            });
        }
    }
    async hasColumn(columnName) {
        const result = await Database_1.default.rawQuery(`
        SELECT COLUMN_NAME
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND COLUMN_NAME = ?
        LIMIT 1
      `, [this.tableName, columnName]);
        const rows = Array.isArray(result?.[0]) ? result[0] : result;
        return Array.isArray(rows) && rows.length > 0;
    }
    async hasIndex(indexName) {
        const result = await Database_1.default.rawQuery(`
        SELECT INDEX_NAME
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND INDEX_NAME = ?
        LIMIT 1
      `, [this.tableName, indexName]);
        const rows = Array.isArray(result?.[0]) ? result[0] : result;
        return Array.isArray(rows) && rows.length > 0;
    }
    isDuplicateColumnError(error) {
        const databaseError = error;
        return databaseError.code === 'ER_DUP_FIELDNAME' || databaseError.errno === 1060;
    }
    isDuplicateIndexError(error) {
        const databaseError = error;
        return databaseError.code === 'ER_DUP_KEYNAME' || databaseError.errno === 1061;
    }
}
exports.default = default_1;
//# sourceMappingURL=1786500000002_image_upload_jobs_report_permission.js.map