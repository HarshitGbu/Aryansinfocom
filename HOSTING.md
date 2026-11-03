# Hosting on a single server (no Docker)

You cannot run a Next.js SSR app and a FastAPI API as *one process* without a large rewrite,
but you can run both on **one machine** behind a single nginx reverse proxy so visitors use
one origin (http://your-domain). This is the recommended "host together" setup.

## 1. Prerequisites (Ubuntu 22.04/24.04)

```bash
sudo apt update
sudo apt install -y nginx postgresql postgresql-contrib redis-server python3.12 python3.12-venv nodejs npm
# pnpm
npm install -g pnpm@11.25.0
# pgvector extension (for Postgres)
sudo apt install -y postgresql-16-pgvector   # package name may vary by distro
```

Create DB + user:
```bash
sudo -u postgres psql -c "CREATE USER app WITH PASSWORD 'app';"
sudo -u postgres psql -c "CREATE DATABASE agency OWNER app;"
sudo -u postgres psql -d agency -c "CREATE EXTENSION IF NOT EXISTS vector;"
sudo -u postgres psql -d agency -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
sudo -u postgres psql -d agency -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
```

## 2. Deploy code

```bash
sudo mkdir -p /opt/aryan-infocom && sudo chown $USER:$USER /opt/aryan-infocom
git clone <your-repo> /opt/aryan-infocom
cd /opt/aryan-infocom
```

Backend:
```bash
cd /opt/aryan-infocom/Backend
python3.12 -m venv .venv
.venv/bin/pip install -r <( .venv/bin/python -m pip compile 2>/dev/null ) 2>/dev/null || .venv/bin/pip install fastapi "uvicorn[standard]" "sqlalchemy[asyncio]" asyncpg alembic pgvector pydantic pydantic-settings structlog "redis[asyncio]" arq httpx aiosmtplib jinja2 python-multipart email-validator "psycopg[binary]"
export DATABASE_URL="postgresql+asyncpg://app:app@localhost:5432/agency"
export REDIS_URL="redis://localhost:6379/0"
.venv/bin/alembic upgrade head
.venv/bin/python -m app.seed.seed
```

Frontend:
```bash
cd /opt/aryan-infocom/frontend
pnpm install --frozen-lockfile
# same-origin: browser calls /api/v1 which nginx routes to backend
NEXT_PUBLIC_API_BASE_URL="" pnpm build
```

## 3. Environment

Create `/opt/aryan-infocom/.env` (see `.env.example`) and load it in the services.

## 4. systemd services

Copy the unit files from `deploy/` to `/etc/systemd/system/` and enable:
```bash
sudo cp /opt/aryan-infocom/deploy/aryan-backend.service /etc/systemd/system/
sudo cp /opt/aryan-infocom/deploy/aryan-frontend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now aryan-backend aryan-frontend
```

## 5. nginx (single origin)

```bash
sudo cp /opt/aryan-infocom/deploy/nginx.conf /etc/nginx/sites-available/aryan-infocom
sudo ln -sf /etc/nginx/sites-available/aryan-infocom /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Open http://your-domain (or http://localhost).

## 6. Updating
```bash
cd /opt/aryan-infocom && git pull
# rebuild frontend + restart
cd frontend && NEXT_PUBLIC_API_BASE_URL="" pnpm build && sudo systemctl restart aryan-frontend
cd ../Backend && .venv/bin/alembic upgrade head && .venv/bin/python -m app.seed.seed && sudo systemctl restart aryan-backend
```