#!/bin/sh
set -eu

TEMP_ENV_CREATED=0

cleanup() {
  if [ "$TEMP_ENV_CREATED" -eq 1 ]; then
    rm -f .env
  fi
}

trap cleanup EXIT INT TERM

if [ ! -f .env ]; then
  cp .env.example .env
  TEMP_ENV_CREATED=1
fi

docker compose config -q
