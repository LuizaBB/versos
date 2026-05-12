"""Remove o prefixo do serviço na Vercel (experimentalServices) antes do roteamento."""

import os

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request


def _route_prefix() -> str:
    # Se a chave existir (mesmo vazia), respeita: "" = sem prefixo (deploy ASGI único na raiz).
    if "BACKEND_ROUTE_PREFIX" in os.environ:
        return os.environ["BACKEND_ROUTE_PREFIX"].strip().rstrip("/")
    if os.getenv("VERCEL"):
        return "/_/backend"
    return ""


class StripServiceRoutePrefixMiddleware(BaseHTTPMiddleware):
    """Paths chegam como /_/backend/auth/... — roteadores usam /auth/...."""

    def __init__(self, app, prefix: str):
        super().__init__(app)
        self.prefix = prefix

    async def dispatch(self, request: Request, call_next):
        if self.prefix and request.url.path.startswith(self.prefix):
            new_path = request.url.path[len(self.prefix) :] or "/"
            request.scope["path"] = new_path
            request.scope["raw_path"] = new_path.encode("utf-8")
        return await call_next(request)
