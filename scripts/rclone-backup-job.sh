#!/bin/sh
set -u

RUN_ID="$(date -u +"%Y%m%dT%H%M%SZ")_gdrive_rclone"
HEARTBEAT_SECONDS="${BACKUP_MONITOR_HEARTBEAT_SECONDS:-300}"
LOG_FILE="${RCLONE_BACKUP_LOG_FILE:-/var/log/digi3/rclone-backup.log}"

send_event() {
  event="$1"
  error_message="${2:-}"
  metadata="${3:-{}}"

  if [ -z "${BACKUP_MONITOR_WEBHOOK_URL:-}" ] || [ -z "${BACKUP_WEBHOOK_SECRET:-}" ]; then
    return 0
  fi

  if [ -n "$error_message" ]; then
    payload="{\"run_id\":\"$RUN_ID\",\"kind\":\"GDRIVE_RCLONE\",\"event\":\"$event\",\"error_message\":\"$error_message\",\"metadata\":$metadata}"
  else
    payload="{\"run_id\":\"$RUN_ID\",\"kind\":\"GDRIVE_RCLONE\",\"event\":\"$event\",\"metadata\":$metadata}"
  fi

  curl -sS -X POST "$BACKUP_MONITOR_WEBHOOK_URL" \
    -H "Authorization: Bearer $BACKUP_WEBHOOK_SECRET" \
    -H "Content-Type: application/json" \
    --data "$payload" >/dev/null || true
}

heartbeat_loop() {
  while true; do
    sleep "$HEARTBEAT_SECONDS"
    send_event "HEARTBEAT"
  done
}

if [ -z "${RCLONE_BACKUP_COMMAND:-}" ]; then
  echo "RCLONE_BACKUP_COMMAND não configurado."
  send_event "RUN_ERROR" "RCLONE_BACKUP_COMMAND não configurado."
  exit 1
fi

mkdir -p "$(dirname "$LOG_FILE")"
echo "Iniciando backup rclone..." >> "$LOG_FILE"
send_event "RUN_STARTED" "" "{\"command_configured\":true}"

heartbeat_loop &
HEARTBEAT_PID="$!"

sh -c "$RCLONE_BACKUP_COMMAND" >> "$LOG_FILE" 2>&1
EXIT_CODE="$?"

kill "$HEARTBEAT_PID" >/dev/null 2>&1 || true

if [ "$EXIT_CODE" -eq 0 ]; then
  echo "Backup rclone concluído com sucesso." >> "$LOG_FILE"
  send_event "RUN_SUCCESS" "" "{\"exit_code\":0}"
  exit 0
fi

ERROR_MESSAGE="rclone finalizado com erro. Exit code: $EXIT_CODE"
echo "$ERROR_MESSAGE" >> "$LOG_FILE"
send_event "RUN_ERROR" "$ERROR_MESSAGE" "{\"exit_code\":$EXIT_CODE}"
exit "$EXIT_CODE"
