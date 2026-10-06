"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isVerifiedRcloneCompletion = void 0;
function isVerifiedRcloneCompletion(metadata) {
    if (!metadata || metadata.verified !== true)
        return false;
    return Number.isInteger(metadata.total_tasks)
        && metadata.total_tasks > 0
        && metadata.verified_tasks === metadata.total_tasks
        && metadata.pending_tasks === 0
        && metadata.verification_method === 'rclone check --one-way --download'
        && typeof metadata.completed_at === 'string'
        && Number.isFinite(Date.parse(metadata.completed_at));
}
exports.isVerifiedRcloneCompletion = isVerifiedRcloneCompletion;
//# sourceMappingURL=RcloneVerification.js.map