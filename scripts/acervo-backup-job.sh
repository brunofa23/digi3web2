#!/bin/sh
set -eu

cd /app/_build

echo "Iniciando backup agendado do acervo..."
exec node --max-old-space-size="${ACERVO_BACKUP_NODE_HEAP_MB:-768}" ace acervo:backup-all --upload --retention-days="${ACERVO_BACKUP_RETENTION_DAYS:-30}"
