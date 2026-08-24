#!/usr/bin/env bash
# Per-boot startup for EVELIA Intelligence.
# Ensures the MariaDB server is running and ready before agents/services use it.
# Idempotent: does nothing if MariaDB is already up.
set -euo pipefail

SOCKET="/var/run/mysqld/mysqld.sock"

sudo mkdir -p /var/run/mysqld
sudo chown -R mysql:mysql /var/lib/mysql /var/run/mysqld 2>/dev/null || true

if ! sudo mysqladmin --socket="$SOCKET" ping >/dev/null 2>&1; then
  echo "==> Starting MariaDB"
  sudo -b bash -c "mariadbd --user=mysql --datadir=/var/lib/mysql \
    --socket=$SOCKET --pid-file=/var/run/mysqld/mysqld.pid \
    --skip-name-resolve >/tmp/mariadb.log 2>&1"
  for _ in $(seq 1 30); do
    sudo mysqladmin --socket="$SOCKET" ping >/dev/null 2>&1 && break
    sleep 1
  done
fi

sudo mysqladmin --socket="$SOCKET" ping
echo "==> MariaDB is ready"
