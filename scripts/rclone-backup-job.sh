#!/bin/sh
set -eu
# The resumable executor owns durable run IDs, heartbeats and verified success.
# This wrapper only preserves the existing environment/command/log integration.
LOG_FILE="${RCLONE_BACKUP_LOG_FILE:-/var/lib/rclone-backup/rclone-backup-monitor.log}"
if [ -z "${RCLONE_BACKUP_COMMAND:-}" ]; then
  echo 'RCLONE_BACKUP_COMMAND não configurado.' >&2
  exit 1
fi
if [ -z "${BACKUP_MONITOR_WEBHOOK_URL:-}" ] || [ -z "${BACKUP_WEBHOOK_SECRET:-}" ]; then
  echo 'Webhook de backup não configurado; execução não iniciada.' >&2
  exit 1
fi
mkdir -p "$(dirname "$LOG_FILE")"
exec /bin/sh -c "$RCLONE_BACKUP_COMMAND" >> "$LOG_FILE" 2>&1
