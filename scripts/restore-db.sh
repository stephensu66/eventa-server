#!/bin/sh
set -eu

if [ $# -lt 1 ]; then
  echo "Usage: $0 <sql-file>"
  exit 1
fi

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
SQL_FILE=$1

cd "$PROJECT_DIR"

if [ ! -f "$SQL_FILE" ]; then
  echo "SQL file not found: $SQL_FILE"
  exit 1
fi

docker compose exec -T mysql sh -c 'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' < "$SQL_FILE"

echo "Restore completed from: $SQL_FILE"
