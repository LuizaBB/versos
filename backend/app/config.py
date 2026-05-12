import os

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine.url import make_url


def _db_host_is_loopback(url: str) -> bool:
    try:
        host = (make_url(url).host or "").lower()
        return host in ("localhost", "127.0.0.1", "::1")
    except Exception:
        return False


class Settings(BaseSettings):
    # On Vercel only OS env vars apply; loading `.env` would hide a missing DATABASE_URL.
    model_config = SettingsConfigDict(
        env_file=(".env",) if not os.getenv("VERCEL") else None,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "postgresql+psycopg://versos:versos@localhost:5432/versos"
    secret_key: str = "dev-secret-change-in-production"
    access_token_expire_minutes: int = 60 * 24 * 7

    @field_validator("database_url")
    @classmethod
    def _reject_loopback_on_vercel(cls, v: str) -> str:
        if os.getenv("VERCEL") and _db_host_is_loopback(v):
            raise ValueError(
                "DATABASE_URL must use a cloud Postgres host on Vercel (e.g. Neon). "
                "Set DATABASE_URL in the Vercel project: Settings -> Environment Variables."
            )
        return v


settings = Settings()
