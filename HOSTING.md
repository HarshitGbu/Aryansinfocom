# Hosting on a single server (no Docker)

You cannot run a Next.js SSR app and a FastAPI API as *one process* without a large rewrite,
but you can run both on **one machine** behind a single TLS-terminating nginx reverse proxy so visitors use
one HTTPS origin (`https://aryansinfocom.com`).

## 1. Prerequisites (Ubuntu 22.04/24.04)

```bash
sudo apt update
sudo apt install -y nginx postgresql postgresql-contrib redis-server python3.12 python3.12-venv nodejs npm certbot python3-certbot-nginx
# uv (for locked backend dependency installation)
curl -LsSf https://astral.sh/uv/install.sh | sudo env UV_INSTALL_DIR=/usr/local/bin sh
# pnpm
sudo npm install -g pnpm@11.25.0
# pgvector extension (for Postgres)
sudo apt install -y postgresql-16-pgvector   # package name may vary by distro
```

Create dedicated least-privilege service users:
```bash
sudo useradd --system --no-create-home --shell /usr/sbin/nologin aryan-api
sudo useradd --system --no-create-home --shell /usr/sbin/nologin aryan-web
```

Create DB + user with a strong generated password (save the output for `backend.env`):
```bash
DB_PASSWORD=$(openssl rand -hex 24)
echo "DB_PASSWORD=${DB_PASSWORD}"
sudo -u postgres psql -c "CREATE USER app WITH PASSWORD '${DB_PASSWORD}';"
sudo -u postgres psql -c "CREATE DATABASE agency OWNER app;"
sudo -u postgres psql -d agency -c "CREATE EXTENSION IF NOT EXISTS vector;"
sudo -u postgres psql -d agency -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
sudo -u postgres psql -d agency -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
```

## 2. Deploy code

```bash
sudo mkdir -p /opt/aryan-infocom && sudo chown "$USER:$USER" /opt/aryan-infocom
git clone <your-repo> /opt/aryan-infocom
cd /opt/aryan-infocom
```

Backend:
```bash
cd /opt/aryan-infocom/Backend
uv sync --frozen --no-dev
sudo chown -R aryan-api:aryan-api /opt/aryan-infocom/Backend
```

Frontend:
```bash
cd /opt/aryan-infocom/frontend
pnpm install --frozen-lockfile
# same-origin: browser calls /api/v1 which nginx routes to backend
# NEXT_PUBLIC_API_BASE_URL and NEXT_PUBLIC_CAL_LINK are baked into client JS at build time (set NEXT_PUBLIC_CAL_LINK="..." here if enabled)
NEXT_PUBLIC_SITE_URL="https://aryansinfocom.com" NEXT_PUBLIC_API_BASE_URL="" NEXT_PUBLIC_CAL_LINK="" pnpm build
mkdir -p /opt/aryan-infocom/frontend/.next/cache /opt/aryan-infocom/frontend/.next/server
sudo chown -R aryan-web:aryan-web /opt/aryan-infocom/frontend
```

## 3. Split environment files

Keep backend secrets completely separate from the frontend runtime environment.
Never put `ADMIN_API_KEY`, `IP_HASH_SALT`, `CAL_WEBHOOK_SECRET`, `SMTP_URL`, `OPENAI_API_KEY`,
`ANTHROPIC_API_KEY`, `SLACK_WEBHOOK_URL`, or `DATABASE_URL` in `frontend.env`.

Create `/opt/aryan-infocom/backend.env` (see `Backend/.env.example` for optional keys):
```bash
ADMIN_KEY=$(openssl rand -hex 32)
SALT=$(openssl rand -hex 32)
CAL_SECRET=$(openssl rand -hex 32)

cat <<EOF | sudo tee /opt/aryan-infocom/backend.env >/dev/null
ENVIRONMENT=production
TRUSTED_PROXY_HOPS=1
DATABASE_URL=postgresql+asyncpg://app:${DB_PASSWORD}@127.0.0.1:5432/agency
REDIS_URL=redis://127.0.0.1:6379/0
CORS_ORIGINS=https://aryansinfocom.com
ADMIN_API_KEY=${ADMIN_KEY}
IP_HASH_SALT=${SALT}
CAL_WEBHOOK_SECRET=${CAL_SECRET}
# Optional: SMTP_URL, NOTIFY_EMAIL_TO, SLACK_WEBHOOK_URL, OPENAI_API_KEY, ANTHROPIC_API_KEY, SENTRY_DSN
EOF
sudo chown aryan-api:aryan-api /opt/aryan-infocom/backend.env
sudo chmod 600 /opt/aryan-infocom/backend.env
```

Note: `ENVIRONMENT=production` enforces `127.0.0.1` (not `localhost`) in `DATABASE_URL` and `REDIS_URL`, and rejects default or weak passwords in `DATABASE_URL`.

Run database migrations and initial seed using `backend.env`:
```bash
sudo -u aryan-api bash -c '
  set -a && source /opt/aryan-infocom/backend.env && set +a
  cd /opt/aryan-infocom/Backend
  .venv/bin/alembic upgrade head
  .venv/bin/python -m app.seed.seed
'
```

Create `/opt/aryan-infocom/frontend.env` (runtime SSR configuration only; client-side `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_CAL_LINK` are build-time Next.js variables baked during `pnpm build`, not runtime switches):
```bash
cat <<'EOF' | sudo tee /opt/aryan-infocom/frontend.env >/dev/null
NODE_ENV=production
PORT=3000
API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_SITE_URL=https://aryansinfocom.com
EOF
sudo chown aryan-web:aryan-web /opt/aryan-infocom/frontend.env
sudo chmod 600 /opt/aryan-infocom/frontend.env
```

## 4. systemd services

Copy all three unit files from `deploy/` to `/etc/systemd/system/` and enable them:
```bash
sudo cp /opt/aryan-infocom/deploy/aryan-backend.service /etc/systemd/system/
sudo cp /opt/aryan-infocom/deploy/aryan-worker.service /etc/systemd/system/
sudo cp /opt/aryan-infocom/deploy/aryan-frontend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now aryan-backend aryan-worker aryan-frontend
```

## 5. TLS (Certbot) & nginx

Obtain the Let's Encrypt certificate for `aryansinfocom.com` and `www.aryansinfocom.com` before enabling the TLS nginx config:
```bash
sudo mkdir -p /var/www/certbot
sudo systemctl stop nginx
sudo certbot certonly --standalone -d aryansinfocom.com -d www.aryansinfocom.com
```

Install `deploy/nginx.conf` and configure the `/api/v1/admin/` IP allowlist:
```bash
sudo cp /opt/aryan-infocom/deploy/nginx.conf /etc/nginx/sites-available/aryan-infocom
sudo ln -sf /etc/nginx/sites-available/aryan-infocom /etc/nginx/sites-enabled/aryan-infocom
sudo rm -f /etc/nginx/sites-enabled/default
```

> **Important:** In `/etc/nginx/sites-available/aryan-infocom`, the `location ^~ /api/v1/admin/` block defaults to `allow 127.0.0.1; allow ::1; deny all;`. Add your admin workstation or VPN CIDR (for example `allow 203.0.113.10/32;`) before reloading nginx, otherwise external `/api/v1/admin/` requests return `403`.

Validate and start nginx:
```bash
sudo nginx -t && sudo systemctl start nginx
```

Configure Certbot automatic renewal using the ACME webroot (`/.well-known/acme-challenge/`):
```bash
sudo certbot renew --dry-run --webroot -w /var/www/certbot
```

Open `https://aryansinfocom.com`.

## 6. Updating

```bash
cd /opt/aryan-infocom && git pull

# Rebuild frontend + restart (re-supply any NEXT_PUBLIC_* build-time vars such as NEXT_PUBLIC_CAL_LINK)
cd /opt/aryan-infocom/frontend
pnpm install --frozen-lockfile
NEXT_PUBLIC_SITE_URL="https://aryansinfocom.com" NEXT_PUBLIC_API_BASE_URL="" NEXT_PUBLIC_CAL_LINK="" pnpm build
sudo chown -R aryan-web:aryan-web /opt/aryan-infocom/frontend/.next
sudo systemctl restart aryan-frontend

# Sync backend deps, migrate, seed + restart API and worker
cd /opt/aryan-infocom/Backend
uv sync --frozen --no-dev
sudo chown -R aryan-api:aryan-api /opt/aryan-infocom/Backend
sudo -u aryan-api bash -c '
  set -a && source /opt/aryan-infocom/backend.env && set +a
  cd /opt/aryan-infocom/Backend
  .venv/bin/alembic upgrade head
  .venv/bin/python -m app.seed.seed
'
sudo systemctl restart aryan-backend aryan-worker
```