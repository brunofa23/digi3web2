#!/bin/sh
set -eu

cd /app/_build

echo "Iniciando backup agendado do acervo..."
exec node ace acervo:backup-all --upload --retention-days="${ACERVO_BACKUP_RETENTION_DAYS:-30}"
