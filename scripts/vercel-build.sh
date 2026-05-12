#!/usr/bin/env bash
# Build do Vite + cópia para spa/ (NÃO usar public/ na raiz: a Vercel serve public/ na CDN e
# pedidos como /api/* podem ficar em 404 na edge sem invocar o Python — sem logs em Runtime).
set -euxo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=== [versos] vercel-build START $(date -u +"%Y-%m-%dT%H:%M:%SZ") ==="
echo "=== [versos] ROOT=$ROOT ==="
cd "$ROOT"

echo "=== [versos] env (build-relevant) ==="
echo "VERCEL=${VERCEL:-}"
echo "NODE_VERSION=$(node -v 2>/dev/null || echo n/a)"
echo "NPM_VERSION=$(npm -v 2>/dev/null || echo n/a)"

echo "=== [versos] after Python/uv step: check .vercel output hints ==="
ls -la . 2>/dev/null | head -30 || true
if test -d .vercel; then ls -la .vercel | head -20; else echo "=== [versos] no .vercel dir ==="; fi

echo "=== [versos] frontend: package.json scripts.build ==="
node -p "require('./frontend/package.json').scripts.build"

echo "=== [versos] npm run build (loglevel verbose) ==="
cd "$ROOT/frontend"
export NODE_OPTIONS="${NODE_OPTIONS:-} --trace-warnings"
npm run build --loglevel verbose

echo "=== [versos] dist/ contents ==="
ls -la dist
ls -la dist/assets 2>/dev/null | head -30 || true

echo "=== [versos] copy dist -> spa/ at repo root (avoid public/ CDN-only routing) ==="
cd "$ROOT"
rm -rf public spa
mkdir -p spa
cp -r frontend/dist/. spa/

echo "=== [versos] spa/ contents ==="
ls -la spa | head -30
ls -la spa/assets 2>/dev/null | head -20 || true

echo "=== [versos] vercel-build DONE ==="
