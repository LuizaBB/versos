"""
Entrypoint único na Vercel:
- A API FastAPI corre sob **/api** (ex.: POST /api/auth/login). Isto evita que a CDN
  sirva HTML de erro para pedidos que coincidem com rotas “estáticas” em public/.
- O SPA e assets do Vite vêm de **spa/** (cópia do dist), não de **public/** — a pasta `public/`
  na raiz é servida na CDN e pode impedir que `/api/*` chegue ao Python (404 na edge, sem logs).
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

os.environ["BACKEND_ROUTE_PREFIX"] = ""

ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "backend"
sys.path.insert(0, str(BACKEND))

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.main import app as api_application

PUBLIC = ROOT / "spa"
INDEX = PUBLIC / "index.html"
_ASSETS = PUBLIC / "assets"

shell = FastAPI(title="Versos", version="0.1.0")

shell.mount("/api", api_application)

if _ASSETS.is_dir():
    shell.mount("/assets", StaticFiles(directory=str(_ASSETS)), name="vite_assets")


@shell.get("/", include_in_schema=False)
async def root_index():
    if INDEX.is_file():
        return FileResponse(INDEX)
    raise HTTPException(status_code=404, detail="Frontend não encontrado: rode o build (pasta spa/).")


@shell.get("/vite.svg", include_in_schema=False)
async def vite_svg():
    p = PUBLIC / "vite.svg"
    if p.is_file():
        return FileResponse(p)
    raise HTTPException(status_code=404)


@shell.get("/{full_path:path}", include_in_schema=False)
async def static_or_spa(full_path: str):
    """Ficheiros em spa/ ou fallback para index.html (React Router)."""
    if not full_path:
        if INDEX.is_file():
            return FileResponse(INDEX)
        raise HTTPException(status_code=404)

    target = (PUBLIC / full_path).resolve()
    try:
        target.relative_to(PUBLIC.resolve())
    except ValueError:
        raise HTTPException(status_code=404)

    if target.is_file():
        return FileResponse(target)

    if INDEX.is_file():
        return FileResponse(INDEX)

    raise HTTPException(status_code=404)


app = shell
