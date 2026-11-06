#!/usr/bin/env bash
set -euo pipefail
cd /opt/brewlite
test -f .env
new_tag=${1:?usage: deploy.sh COMMIT_SHA}
[[ "$new_tag" =~ ^[a-f0-9]{40}$ ]] || { echo 'Expected full commit SHA'; exit 1; }
old_tag=$(cat .deployed-tag 2>/dev/null || true)
export IMAGE_TAG="$new_tag"
compose=(docker compose --env-file .env -f docker-compose.production.yml)
rollback() {
  trap - ERR
  if [[ -n "$old_tag" ]]; then
    export IMAGE_TAG="$old_tag"
    "${compose[@]}" up -d --wait --wait-timeout 180
    echo "Restored previous images: $old_tag"
  else
    echo 'First deployment failed; no previous image tag. Inspect logs.'
  fi
  exit 1
}
trap rollback ERR
"${compose[@]}" pull
"${compose[@]}" up -d --wait db
# Only forward, backward-compatible migrations. Take a backup before destructive changes.
"${compose[@]}" run --rm --no-deps api ./node_modules/.bin/prisma migrate deploy --schema apps/api/prisma/schema.prisma
"${compose[@]}" up -d --wait --wait-timeout 240
# DOMAIN is a validated DNS name maintained by the operator, never execute .env as shell code.
domain=$(sed -n 's/^DOMAIN=//p' .env | tr -d '\r')
[[ "$domain" =~ ^[A-Za-z0-9.-]+$ ]] && test -n "$domain"
for i in $(seq 1 30); do
  if curl -fsS "https://$domain/backend/health" && curl -fsS "https://$domain/api/products" > /dev/null; then
    printf '%s\n' "$new_tag" > .deployed-tag
    echo "Deployment smoke passed for $new_tag"
    exit 0
  fi
  sleep 2
done
false
