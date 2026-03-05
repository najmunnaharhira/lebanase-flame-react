#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/app"
GIT_BRANCH="main"

echo "==> Updating code"
cd "${APP_DIR}"
git fetch --all
git checkout "${GIT_BRANCH}"
git reset --hard "origin/${GIT_BRANCH}"

echo "==> Installing dependencies"
npm --prefix backend install
npm --prefix frontend install
npm --prefix admin install

echo "==> Building frontend/admin"
npm --prefix frontend run build
npm --prefix admin run build

echo "==> Running DB migrations"
npm --prefix backend run migrate:mysql

echo "==> Reloading backend"
pm2 reload lebanese-flames-api || pm2 start ecosystem.config.cjs --env production
pm2 save

echo "==> Reloading Nginx"
sudo nginx -t
sudo systemctl reload nginx

echo "==> Update completed"
echo "Open: https://lebaneseflames.co.uk"
echo "API health: https://lebaneseflames.co.uk/api/health"
