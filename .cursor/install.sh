#!/usr/bin/env bash
# Idempotent repository bootstrap for EVELIA Intelligence.
# Prepares MariaDB, the .env file, Node dependencies, the Prisma client,
# the database schema and seed data. Safe to run multiple times.
set -euo pipefail

cd "$(dirname "$0")/.."

SOCKET="/var/run/mysqld/mysqld.sock"

echo "==> Ensuring MariaDB server is installed"
if ! command -v mariadbd >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq mariadb-server mariadb-client
fi

echo "==> Preparing MariaDB data directory"
sudo mkdir -p /var/lib/mysql /var/run/mysqld
sudo chown -R mysql:mysql /var/lib/mysql /var/run/mysqld
if [ ! -d /var/lib/mysql/mysql ]; then
  sudo mariadb-install-db --user=mysql --datadir=/var/lib/mysql \
    --auth-root-authentication-method=normal >/tmp/mariadb-initdb.log 2>&1
fi

echo "==> Starting MariaDB (if not already running)"
if ! sudo mysqladmin --socket="$SOCKET" ping >/dev/null 2>&1; then
  sudo -b bash -c "mariadbd --user=mysql --datadir=/var/lib/mysql \
    --socket=$SOCKET --pid-file=/var/run/mysqld/mysqld.pid \
    --skip-name-resolve >/tmp/mariadb.log 2>&1"
  for _ in $(seq 1 30); do
    sudo mysqladmin --socket="$SOCKET" ping >/dev/null 2>&1 && break
    sleep 1
  done
fi
sudo mysqladmin --socket="$SOCKET" ping

echo "==> Ensuring application database and user exist"
sudo mysql --socket="$SOCKET" <<'SQL'
CREATE DATABASE IF NOT EXISTS evelia CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'evelia'@'127.0.0.1' IDENTIFIED BY 'evelia';
CREATE USER IF NOT EXISTS 'evelia'@'localhost' IDENTIFIED BY 'evelia';
GRANT ALL PRIVILEGES ON evelia.* TO 'evelia'@'127.0.0.1';
GRANT ALL PRIVILEGES ON evelia.* TO 'evelia'@'localhost';
FLUSH PRIVILEGES;
SQL

echo "==> Ensuring .env exists for local development"
if [ ! -f .env ]; then
  PEPPER="$(openssl rand -hex 32)"
  ENCKEY="$(openssl rand -base64 32)"
  cat > .env <<EOF
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_NAME=EVELIA
SESSION_COOKIE_NAME=evelia_session
SESSION_TTL_DAYS=30
SECURITY_HASH_PEPPER=${PEPPER}
ENCRYPTION_KEY=${ENCKEY}

# MySQL 8 / MariaDB
DATABASE_URL=mysql://evelia:evelia@127.0.0.1:3306/evelia
DATABASE_HOST=127.0.0.1
DATABASE_PORT=3306
DATABASE_USER=evelia
DATABASE_PASSWORD=evelia
DATABASE_NAME=evelia
DATABASE_CONNECTION_LIMIT=10

# One-time administrator bootstrap used by db:seed
BOOTSTRAP_ADMIN_EMAIL=admin@evelia.local
BOOTSTRAP_ADMIN_PASSWORD=EveliaAdmin!2026

# AI providers (disabled unless all required values are configured)
AI_PROVIDER=openai-compatible

# Payment adapter (none keeps checkout disabled)
PAYMENT_PROVIDER=none

# SMTP email delivery
SMTP_PORT=587
SMTP_SECURE=false
SMTP_FROM=EVELIA <no-reply@example.com>
EOF
fi

echo "==> Installing Node dependencies"
npm ci

echo "==> Generating Prisma client"
npm run db:generate

echo "==> Applying database migrations"
npm run db:deploy

echo "==> Seeding database"
# prisma/seed.ts does not load .env itself, so pass it explicitly.
npx tsx --env-file=.env prisma/seed.ts

echo "==> Install complete"
