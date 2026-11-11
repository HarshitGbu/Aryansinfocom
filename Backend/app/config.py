from __future__ import annotations

import ipaddress
from functools import lru_cache
from urllib.parse import unquote, urlparse

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_DEV_DATABASE_URL = "postgresql+asyncpg://app:app@localhost:5432/agency"
_WEAK_DB_PASSWORDS = frozenset({"", "app", "postgres", "password", "changeme", "change-me", "secret", "admin", "dev"})


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ENVIRONMENT: str = "development"
    DATABASE_URL: str = _DEV_DATABASE_URL
    REDIS_URL: str = "redis://localhost:6379/0"
    CORS_ORIGINS: str = "http://localhost:3000"
    ADMIN_API_KEY: str = ""
    IP_HASH_SALT: str = "dev-salt-change-me"
    PUBLIC_BOOKING_URL: str = ""
    CAL_WEBHOOK_SECRET: str = ""
    EMBEDDING_PROVIDER: str = "fake"
    OPENAI_API_KEY: str = ""
    LLM_PROVIDER: str = "mock"
    ANTHROPIC_API_KEY: str = ""
    LLM_MODEL: str = ""
    RAG_DAILY_BUDGET: int = 100
    SMTP_URL: str = ""
    SMTP_FROM: str = ""
    NOTIFY_EMAIL_TO: str = ""
    SLACK_WEBHOOK_URL: str = ""
    SENTRY_DSN: str = ""
    PRICING_FILE: str = "app/services/pricing/pricing.v1.json"
    TRUSTED_PROXY_HOPS: int = 1
    TRUSTED_PROXIES: str = "127.0.0.1,::1"
    GIT_SHA: str = "dev"

    @field_validator("ENVIRONMENT")
    @classmethod
    def _env_valid(cls, v: str) -> str:
        if v not in ("development", "test", "production"):
            raise ValueError("ENVIRONMENT must be development|test|production")
        return v

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def trusted_proxy_networks(self) -> list[ipaddress.IPv4Network | ipaddress.IPv6Network]:
        nets: list[ipaddress.IPv4Network | ipaddress.IPv6Network] = []
        for item in self.TRUSTED_PROXIES.split(","):
            raw = item.strip()
            if not raw:
                continue
            try:
                nets.append(ipaddress.ip_network(raw, strict=False))
            except ValueError:
                continue
        return nets

    @property
    def version(self) -> str:
        try:
            from importlib.metadata import version

            return version("agency-api")
        except Exception:
            return self.GIT_SHA or "dev"

    def ensure_production_ready(self) -> None:
        if self.ENVIRONMENT != "production":
            return
        problems: list[str] = []
        if not self.ADMIN_API_KEY or len(self.ADMIN_API_KEY) < 32 or self.ADMIN_API_KEY.startswith("change-me"):
            problems.append("ADMIN_API_KEY missing/too short/example value")
        if (
            not self.IP_HASH_SALT
            or len(self.IP_HASH_SALT) < 16
            or self.IP_HASH_SALT.startswith("change-me")
            or self.IP_HASH_SALT == "dev-salt-change-me"
        ):
            problems.append("IP_HASH_SALT missing/too short/example value")
        if "*" in self.cors_origins:
            problems.append("CORS_ORIGINS must not contain * in production")
        db_parsed = urlparse(self.DATABASE_URL)
        db_user = unquote(db_parsed.username or "")
        db_pass = unquote(db_parsed.password or "")
        if (
            self.DATABASE_URL == _DEV_DATABASE_URL
            or db_parsed.hostname == "localhost"
            or "app:app@" in self.DATABASE_URL
            or "postgres:postgres@" in self.DATABASE_URL
            or (db_user, db_pass) in {("app", "app"), ("postgres", "postgres"), ("admin", "admin")}
            or db_pass in _WEAK_DB_PASSWORDS
        ):
            problems.append("DATABASE_URL uses default/weak credentials or localhost")
        redis_parsed = urlparse(self.REDIS_URL)
        if redis_parsed.hostname == "localhost" or "localhost" in self.REDIS_URL:
            problems.append("REDIS_URL still uses the local development default")
        if problems:
            raise RuntimeError("Refusing to start in production: " + "; ".join(problems))


@lru_cache
def get_settings() -> Settings:
    s = Settings()
    return s
