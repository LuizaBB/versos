import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, books, groups, listings, me_shelf, notifications, purchases
from app.strip_prefix import StripServiceRoutePrefixMiddleware, _route_prefix


def _cors_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS", "")
    out = [o.strip() for o in raw.split(",") if o.strip()]
    for d in ("http://localhost:5173", "http://127.0.0.1:5173"):
        if d not in out:
            out.append(d)
    return out


def _cors_origin_regex() -> str | None:
    if "CORS_ORIGIN_REGEX" in os.environ:
        s = os.environ["CORS_ORIGIN_REGEX"].strip()
        return s if s else None
    return r"https://.*\.vercel\.app"


app = FastAPI(title="Versos API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_origin_regex=_cors_origin_regex(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(books.router)
app.include_router(me_shelf.router)
app.include_router(groups.router)
app.include_router(groups.me_groups_router)
app.include_router(listings.router)
app.include_router(listings.me_listings_router)
app.include_router(purchases.router)
app.include_router(purchases.me_purchases_router)
app.include_router(notifications.router)

# Vercel multi-serviço: prefixo /_/backend; deploy único na raiz define BACKEND_ROUTE_PREFIX vazio em vercel_app.py.
_rp = _route_prefix()
if _rp:
    app.add_middleware(StripServiceRoutePrefixMiddleware, prefix=_rp)


@app.get("/health")
def health():
    return {"status": "ok"}
