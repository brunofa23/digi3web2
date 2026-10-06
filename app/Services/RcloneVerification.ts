export function isVerifiedRcloneCompletion(metadata: any): boolean {
  if (!metadata || metadata.verified !== true) return false

  return Number.isInteger(metadata.total_tasks)
    && metadata.total_tasks > 0
    && metadata.verified_tasks === metadata.total_tasks
    && metadata.pending_tasks === 0
    && metadata.verification_method === 'rclone check --one-way --download'
    && typeof metadata.completed_at === 'string'
    && Number.isFinite(Date.parse(metadata.completed_at))
}
