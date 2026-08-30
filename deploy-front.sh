#!/bin/bash
set -euo pipefail

# ÚNICO deploy do front. Vale neste servidor e em qualquer outro.
# Uso: bash ~/qrdobem.com.br/deploy-front.sh
#      ou:  bash ~/deploy-front.sh   (se copiar o arquivo para a home)

ROOT="${HOME}/qrdobem.com.br"
cd "$ROOT"

git pull origin main
cp -R dist/. "$ROOT"/
cp -f .htaccess "$ROOT"/ 2>/dev/null || true

echo "OK $(git log -1 --oneline)"
echo "index:"
grep -oE '/assets/index-[^"]+' "$ROOT/index.html" || true
