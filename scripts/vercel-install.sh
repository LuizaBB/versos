#!/usr/bin/env bash
# Instalação na Vercel: Python (raiz) + Node (frontend).
# Se definires installCommand no vercel.json, deixas de ter o install automático do uv —
# por isso é obrigatório instalar aqui o requirements.txt da raiz antes do npm ci.
set -euxo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=== [versos] vercel-install START $(date -u +"%Y-%m-%dT%H:%M:%SZ") ==="
echo "=== [versos] ROOT=$ROOT ==="
cd "$ROOT"

echo "=== [versos] pwd=$(pwd) ==="
command -v node && node -v || echo "=== [versos] node not in PATH ==="
command -v npm && npm -v || echo "=== [versos] npm not in PATH ==="
command -v python3 && python3 --version || true
command -v uv && uv --version || true

echo "=== [versos] top-level listing (first 40 lines) ==="
ls -la | head -40

test -f requirements.txt && echo "=== [versos] requirements.txt ok ===" || {
  echo "MISSING requirements.txt"
  exit 1
}

echo "=== [versos] pip install -r requirements.txt (Python / vercel_app) ==="
python3 -m pip install -r requirements.txt

echo "=== [versos] frontend/package.json exists? ==="
test -f frontend/package.json && echo yes || {
  echo "MISSING frontend/package.json"
  exit 1
}

echo "=== [versos] npm ci (verbose) in frontend/ ==="
cd "$ROOT/frontend"
export NPM_CONFIG_LOGLEVEL="${NPM_CONFIG_LOGLEVEL:-verbose}"
npm ci

echo "=== [versos] vercel-install DONE ==="
