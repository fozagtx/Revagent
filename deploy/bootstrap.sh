#!/usr/bin/env bash
# Run this ONCE on the fresh Vultr VM as root. Installs Docker, builds, starts the API stack.
set -euo pipefail

APP_DIR=/opt/revagent

echo "==> Installing Docker (if missing)"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi

echo "==> Confirming code dropped at $APP_DIR/deploy"
test -d "$APP_DIR/deploy" || { echo "Missing $APP_DIR/deploy — rsync the repo first"; exit 1; }
test -f "$APP_DIR/deploy/.env" || { echo "Missing $APP_DIR/deploy/.env — copy your prod env file"; exit 1; }

echo "==> Building & starting containers"
cd "$APP_DIR/deploy"
docker compose -f docker-compose.prod.yml up -d --build

echo "==> Waiting for API health"
for i in $(seq 1 60); do
  if curl -fsS http://localhost:4000/api/health/integrations >/dev/null 2>&1; then
    echo "==> READY"
    curl -s http://localhost:4000/api/health/integrations
    echo
    exit 0
  fi
  sleep 2
done
echo "API did not become healthy in 120s. Logs:"
docker compose -f docker-compose.prod.yml logs --tail 50 api
exit 1
