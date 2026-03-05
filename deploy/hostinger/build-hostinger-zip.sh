#!/usr/bin/env bash
# Build a deployable zip archive for Hostinger upload.
#
# Usage (from any directory):
#   chmod +x deploy/hostinger/build-hostinger-zip.sh
#   ./deploy/hostinger/build-hostinger-zip.sh
#
# What the script does:
#   1. Installs frontend & admin dependencies.
#   2. Runs "vite build" for both apps (output → frontend/dist, admin/dist).
#   3. Packages the deployable artifacts into lebanese-flames-hostinger.zip
#      at the repository root – ready to upload to your Hostinger VPS.
#
# What is included in the zip:
#   backend/        – full backend source + package*.json (no node_modules)
#   frontend/dist/  – pre-built static files for the customer site
#   admin/dist/     – pre-built static files for the admin panel
#   ecosystem.config.cjs – PM2 process-manager config
#   package.json    – root workspace file
#   .env.production.example – environment variable template
#   deploy/hostinger/ – Nginx config, deploy/update helper scripts, README
#
# After uploading and extracting on the VPS, run:
#   npm --prefix backend install
#   cp .env.production.example .env.production   # then edit with real secrets
#   npm --prefix backend run migrate:mysql
#   pm2 start ecosystem.config.cjs --env production
#   sudo cp deploy/hostinger/nginx.lebaneseflames.co.uk.conf \
#            /etc/nginx/sites-available/lebaneseflames.co.uk
#   sudo ln -s /etc/nginx/sites-available/lebaneseflames.co.uk \
#              /etc/nginx/sites-enabled/
#   sudo nginx -t && sudo systemctl reload nginx

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
ZIP_NAME="lebanese-flames-hostinger.zip"
OUT_FILE="${ROOT_DIR}/${ZIP_NAME}"

echo "==> Building frontend (Vite)"
npm --prefix "${ROOT_DIR}/frontend" install
npm --prefix "${ROOT_DIR}/frontend" run build

echo "==> Building admin (Vite)"
npm --prefix "${ROOT_DIR}/admin" install
npm --prefix "${ROOT_DIR}/admin" run build

echo "==> Assembling deployment zip: ${ZIP_NAME}"
cd "${ROOT_DIR}"

# Remove stale archive if it already exists
rm -f "${OUT_FILE}"

# Create the zip.
# -r  recursive
# --exclude patterns use shell glob syntax relative to the zip source path.
zip -r "${ZIP_NAME}" \
  backend/ \
  frontend/dist/ \
  admin/dist/ \
  ecosystem.config.cjs \
  package.json \
  .env.production.example \
  deploy/hostinger/ \
  --exclude "backend/node_modules/*" \
  --exclude "backend/uploads/*" \
  --exclude "backend/secrets/*" \
  --exclude "*/.DS_Store" \
  --exclude "*/tmpclaude-*"

ZIP_SIZE=$(du -sh "${OUT_FILE}" | cut -f1)

echo ""
echo "============================================================"
echo "  Done!  ${ZIP_NAME}  (${ZIP_SIZE})"
echo "============================================================"
echo ""
echo "Next steps on your Hostinger VPS:"
echo ""
echo "  # 1. Upload ${ZIP_NAME} to the VPS (e.g. via Hostinger File Manager)"
echo "  #    then SSH in and run:"
echo ""
echo "  sudo mkdir -p /var/www/app"
echo "  cd /var/www"
echo "  sudo unzip ~/${ZIP_NAME} -d app"
echo "  sudo chown -R \$USER:\$USER /var/www/app"
echo "  cd /var/www/app"
echo ""
echo "  # 2. Install backend dependencies"
echo "  npm --prefix backend install"
echo ""
echo "  # 3. Configure environment variables"
echo "  cp .env.production.example .env.production"
echo "  nano .env.production   # fill in secrets"
echo "  cp .env.production .env"
echo ""
echo "  # 4. Run database migrations"
echo "  npm --prefix backend run migrate:mysql"
echo ""
echo "  # 5. Start the API via PM2"
echo "  pm2 start ecosystem.config.cjs --env production"
echo "  pm2 save"
echo "  pm2 startup"
echo ""
echo "  # 6. Configure Nginx & SSL"
echo "  sudo cp deploy/hostinger/nginx.lebaneseflames.co.uk.conf \\"
echo "           /etc/nginx/sites-available/lebaneseflames.co.uk"
echo "  sudo ln -sf /etc/nginx/sites-available/lebaneseflames.co.uk \\"
echo "              /etc/nginx/sites-enabled/lebaneseflames.co.uk"
echo "  sudo rm -f /etc/nginx/sites-enabled/default"
echo "  sudo nginx -t && sudo systemctl reload nginx"
echo "  sudo certbot --nginx -d lebaneseflames.co.uk -d www.lebaneseflames.co.uk"
echo ""
echo "  # 7. Verify"
echo "  curl -sS https://lebaneseflames.co.uk/api/health"
echo ""
