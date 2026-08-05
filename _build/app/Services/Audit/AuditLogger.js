"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const luxon_1 = require("luxon");
const AuditLog_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/AuditLog"));
const hiddenFields = [
    'password',
    'remember_me_token',
    'token',
    'credentials',
    'public_key',
    'device_cookie_hash',
    'credential_id',
    'imageBase64',
    'imageCaptureBase64',
    'fileDownload',
    'index_text',
];
function toPlain(value) {
    if (!value)
        return null;
    if (typeof value.serialize === 'function')
        return value.serialize();
    if (value.$attributes)
        return { ...value.$attributes };
    if (typeof value === 'object')
        return { ...value };
    return value;
}
function sanitize(value) {
    const plain = toPlain(value);
    if (!plain || typeof plain !== 'object')
        return plain;
    const sanitized = {};
    for (const [key, rawValue] of Object.entries(plain)) {
        if (hiddenFields.includes(key))
            continue;
        if (typeof rawValue === 'string' && rawValue.length > 500) {
            sanitized[key] = `${rawValue.slice(0, 500)}...`;
            continue;
        }
        sanitized[key] = rawValue;
    }
    return sanitized;
}
function buildDiff(beforeData, afterData) {
    const before = sanitize(beforeData) || {};
    const after = sanitize(afterData) || {};
    const changedFields = [];
    const beforeDiff = {};
    const afterDiff = {};
    for (const key of Object.keys(after)) {
        if (['created_at', 'updated_at', 'createdAt', 'updatedAt'].includes(key))
            continue;
        const beforeValue = before[key];
        const afterValue = after[key];
        if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
            changedFields.push(key);
            beforeDiff[key] = beforeValue;
            afterDiff[key] = afterValue;
        }
    }
    return { changedFields, beforeDiff, afterDiff };
}
class AuditLogger {
    static getRequestIp(ctx) {
        if (!ctx)
            return null;
        return ctx.request.header('x-forwarded-for')?.split(',')?.[0]?.trim() || ctx.request.ip();
    }
    static async record(ctx, payload) {
        try {
            const now = luxon_1.DateTime.now();
            return await AuditLog_1.default.create({
                companiesId: payload.companiesId || null,
                userId: payload.userId || null,
                action: payload.action,
                entityTable: payload.entityTable || null,
                entityId: payload.entityId || null,
                resourceKey: payload.resourceKey || null,
                entityKey: payload.entityKey || null,
                description: payload.description || null,
                metadata: sanitize(payload.metadata),
                changedFields: payload.changedFields || null,
                beforeData: sanitize(payload.beforeData),
                afterData: sanitize(payload.afterData),
                occurrenceCount: 1,
                firstAt: now,
                lastAt: now,
                ip: this.getRequestIp(ctx),
            });
        }
        catch (error) {
            console.error('Erro ao registrar auditoria:', error);
            return null;
        }
    }
    static async login(ctx, user) {
        return this.record(ctx, {
            companiesId: user.companies_id,
            userId: user.id,
            action: 'login',
            entityTable: 'users',
            entityId: user.id,
            resourceKey: `users:${user.id}`,
            description: `Usuário ${user.name || user.username} fez login`,
            metadata: {
                username: user.username,
            },
        });
    }
    static async imageView(ctx, payload) {
        try {
            const now = luxon_1.DateTime.now();
            const compactAfter = now.minus({ minutes: 5 });
            const existent = await AuditLog_1.default.query()
                .where('companies_id', payload.companiesId || 0)
                .andWhere('user_id', payload.userId || 0)
                .andWhere('action', 'image_view')
                .andWhere('resource_key', payload.resourceKey || '')
                .andWhere('last_at', '>=', compactAfter.toFormat('yyyy-MM-dd HH:mm:ss'))
                .first();
            if (existent) {
                existent.occurrenceCount = Number(existent.occurrenceCount || 1) + 1;
                existent.lastAt = now;
                await existent.save();
                return existent;
            }
            return this.record(ctx, {
                ...payload,
                action: 'image_view',
            });
        }
        catch (error) {
            console.error('Erro ao registrar visualização de imagem:', error);
            return null;
        }
    }
    static async imageUpload(ctx, payload) {
        return this.record(ctx, {
            ...payload,
            action: 'image_upload',
        });
    }
    static async created(ctx, payload) {
        return this.record(ctx, {
            ...payload,
            afterData: payload.afterData,
        });
    }
    static async updated(ctx, payload) {
        const diff = buildDiff(payload.beforeData, payload.afterData);
        if (!diff.changedFields.length)
            return null;
        return this.record(ctx, {
            ...payload,
            changedFields: diff.changedFields,
            beforeData: diff.beforeDiff,
            afterData: diff.afterDiff,
        });
    }
    static async deleted(ctx, payload) {
        return this.record(ctx, {
            ...payload,
            beforeData: payload.beforeData,
        });
    }
}
exports.default = AuditLogger;
//# sourceMappingURL=AuditLogger.js.map