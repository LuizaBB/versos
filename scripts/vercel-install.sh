#!/usr/bin/env bash
# Instalação Node (frontend) com log explícito para a consola de build da Vercel.
set -euxo pipefail

echo "=== [versos] vercel-install START $(date -u +"%Y-%m-%dT%H:%M:%SZ") ==="
echo "=== [versos] pwd=$(pwd) ==="
command -v node && node -v || echo "=== [versos] node not in PATH ==="
command -v npm && npm -v || echo "=== [versos] npm not in PATH ==="
command -v python3 && python3 --version || true
command -v uv && uv --version || true
echo "=== [versos] top-level listing (first 40 lines) ==="
ls -la | head -40

echo "=== [versos] frontend/package.json exists? ==="
test -f frontend/package.json && echo yes || { echo "MISSING frontend/package.json"; exit 1; }

echo "=== [versos] npm ci (verbose) in frontend/ ==="
cd frontend
export NPM_CONFIG_LOGLEVEL="${NPM_CONFIG_LOGLEVEL:-verbose}"
npm ci

echo "=== [versos] vercel-install DONE ==="
