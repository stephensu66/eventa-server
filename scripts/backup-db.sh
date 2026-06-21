#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)

cd "$PROJECT_DIR"

mkdir -p backups

OUTPUT_FILE=${1:-"backups/taro_event_$(date +%Y%m%d_%H%M%S).sql"}

docker compose exec -T mysql sh -c 'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' > "$OUTPUT_FILE"

echo "Backup created: $OUTPUT_FILE"
