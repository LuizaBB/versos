"""
Entrypoint único na Vercel (raiz do repositório):
- Reutiliza a FastAPI em `backend/app`
- Serve o build do Vite copiado para `public/` (SPA + /assets)
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "backend"
sys.path.insert(0, str(BACKEND))

from fastapi import HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.main import app

PUBLIC = ROOT / "public"
INDEX = PUBLIC / "index.html"
_ASSETS = PUBLIC / "assets"

if _ASSETS.is_dir():
    app.mount("/assets", StaticFiles(directory=str(_ASSETS)), name="vite_assets")


@app.get("/", include_in_schema=False)
async def root_index():
    if INDEX.is_file():
        return FileResponse(INDEX)
    raise HTTPException(status_code=404, detail="Frontend não encontrado: rode o build (pasta public/).")


@app.get("/vite.svg", include_in_schema=False)
async def vite_svg():
    p = PUBLIC / "vite.svg"
    if p.is_file():
        return FileResponse(p)
    raise HTTPException(status_code=404)


@app.get("/{full_path:path}", include_in_schema=False)
async def static_or_spa(full_path: str):
    """Arquivos em public/ ou fallback para index.html (React Router)."""
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
