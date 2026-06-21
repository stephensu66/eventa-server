#!/bin/sh
set -eu

find . \
  -path ./node_modules -prune -o \
  -path ./.git -prune -o \
  -path ./.history -prune -o \
  -name '*.js' -print | while IFS= read -r file
do
  node --check "$file"
done
