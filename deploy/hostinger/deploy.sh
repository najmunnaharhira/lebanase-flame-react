#!/usr/bin/env bash
set -euo pipefail

# ====== EDIT BEFORE RUNNING ======
DOMAIN="lebaneseflames.co.uk"
WWW_DOMAIN="www.lebaneseflames.co.uk"
REPO_URL="https://github.com/najmunnaharhira/lebanase-flame-react.git"
APP_DIR="/var/www/app"
GIT_BRANCH="main"

DB_NAME="lebanese_flames"
DB_USER="lf_user"
DB_PASS="CHANGE_THIS_STRONG_DB_PASSWORD"

JWT_SECRET="CHANGE_THIS_TO_A_LONG_RANDOM_SECRET"
ADMIN_EMAIL="admin@lebaneseflames.co.uk"
ADMIN_PASSWORD="CHANGE_THIS_STRONG_ADMIN_PASSWORD"

LETSENCRYPT_EMAIL="admin@lebaneseflames.co.uk"

GOOGLE_CLIENT_ID=""
FIREBASE_PROJECT_ID=""
FIREBASE_CLIENT_EMAIL=""
FIREBASE_PRIVATE_KEY=""

STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
VITE_STRIPE_PUBLISHABLE_KEY=""

SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="Lebanese Flames <orders@lebaneseflames.co.uk>"

TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""
TWILIO_WHATSAPP_FROM="+14155238886"
TWILIO_WHATSAPP_CONTENT_SID=""

VITE_SUPABASE_PROJECT_ID=""
VITE_SUPABASE_PUBLISHABLE_KEY=""
VITE_SUPABASE_URL=""

VITE_FIREBASE_API_KEY=""
VITE_FIREBASE_AUTH_DOMAIN=""
VITE_FIREBASE_DATABASE_URL=""
VITE_FIREBASE_PROJECT_ID=""
VITE_FIREBASE_STORAGE_BUCKET=""
VITE_FIREBASE_MESSAGING_SENDER_ID=""
VITE_FIREBASE_APP_ID=""
VITE_FIREBASE_MEASUREMENT_ID=""
# =================================

echo "==> Installing system dependencies"
sudo apt update
sudo apt install -y nginx mysql-server git curl ufw certbot python3-certbot-nginx

echo "==> Installing Node.js 20 and PM2"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm i -g pm2

echo "==> Enabling firewall"
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

echo "==> Creating MySQL database and user"
sudo mysql -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
sudo mysql -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost'; FLUSH PRIVILEGES;"

echo "==> Cloning/updating application"
sudo mkdir -p /var/www
if [ ! -d "${APP_DIR}/.git" ]; then
  sudo git clone "${REPO_URL}" "${APP_DIR}"
fi
sudo chown -R "$USER:$USER" "${APP_DIR}"
cd "${APP_DIR}"

git fetch --all
git checkout "${GIT_BRANCH}"
git reset --hard "origin/${GIT_BRANCH}"

echo "==> Installing project dependencies"
npm --prefix backend install
npm --prefix frontend install
npm --prefix admin install

echo "==> Creating .env.production"
cat > .env.production <<EOF
NODE_ENV=production
PORT=5000
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=${DB_USER}
MYSQL_PASSWORD=${DB_PASS}
MYSQL_DATABASE=${DB_NAME}
ALLOWED_IPS=
CORS_ORIGIN=https://${DOMAIN},https://${WWW_DOMAIN}
TRUST_PROXY=1
ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=8h
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200
UPLOAD_DIR=uploads
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
FIREBASE_CLIENT_EMAIL=${FIREBASE_CLIENT_EMAIL}
FIREBASE_PRIVATE_KEY=${FIREBASE_PRIVATE_KEY}
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
SMTP_HOST=${SMTP_HOST}
SMTP_PORT=${SMTP_PORT}
SMTP_USER=${SMTP_USER}
SMTP_PASS=${SMTP_PASS}
SMTP_FROM=${SMTP_FROM}
TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}
TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}
TWILIO_PHONE_NUMBER=${TWILIO_PHONE_NUMBER}
TWILIO_WHATSAPP_FROM=${TWILIO_WHATSAPP_FROM}
TWILIO_WHATSAPP_CONTENT_SID=${TWILIO_WHATSAPP_CONTENT_SID}
CLOVER_ACCESS_TOKEN=
CLOVER_PRIVATE_KEY=
CLOVER_MERCHANT_ID=
CLOVER_API_BASE_URL=https://api.clover.com
CLOVER_DEFAULT_CURRENCY=gbp
APP_PUBLIC_URL=https://${DOMAIN}
ADMIN_PUBLIC_URL=https://${DOMAIN}/admin

VITE_API_BASE_URL=https://${DOMAIN}/api
VITE_SUPABASE_PROJECT_ID=${VITE_SUPABASE_PROJECT_ID}
VITE_SUPABASE_PUBLISHABLE_KEY=${VITE_SUPABASE_PUBLISHABLE_KEY}
VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY}
VITE_FIREBASE_AUTH_DOMAIN=${VITE_FIREBASE_AUTH_DOMAIN}
VITE_FIREBASE_DATABASE_URL=${VITE_FIREBASE_DATABASE_URL}
VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID}
VITE_FIREBASE_STORAGE_BUCKET=${VITE_FIREBASE_STORAGE_BUCKET}
VITE_FIREBASE_MESSAGING_SENDER_ID=${VITE_FIREBASE_MESSAGING_SENDER_ID}
VITE_FIREBASE_APP_ID=${VITE_FIREBASE_APP_ID}
VITE_FIREBASE_MEASUREMENT_ID=${VITE_FIREBASE_MEASUREMENT_ID}
VITE_STRIPE_PUBLISHABLE_KEY=${VITE_STRIPE_PUBLISHABLE_KEY}
EOF

cp .env.production .env

echo "==> Building frontend/admin"
npm --prefix frontend run build
npm --prefix admin run build

echo "==> Running DB migrations"
npm --prefix backend run migrate:mysql

echo "==> Starting backend via PM2"
pm2 delete lebanese-flames-api >/dev/null 2>&1 || true
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup systemd -u "$USER" --hp "$HOME" >/dev/null || true

echo "==> Configuring Nginx"
sudo tee "/etc/nginx/sites-available/${DOMAIN}" >/dev/null <<NGINX
server {
    listen 80;
    server_name ${DOMAIN} ${WWW_DOMAIN};

    root ${APP_DIR}/frontend/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /admin/ {
        alias ${APP_DIR}/admin/dist/;
        try_files \$uri \$uri/ /admin/index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5000/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
NGINX

sudo ln -sf "/etc/nginx/sites-available/${DOMAIN}" "/etc/nginx/sites-enabled/${DOMAIN}"
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

echo "==> Provisioning SSL (Let's Encrypt)"
sudo certbot --nginx --non-interactive --agree-tos -m "${LETSENCRYPT_EMAIL}" -d "${DOMAIN}" -d "${WWW_DOMAIN}" || true

echo "==> Deployment completed"
echo "Open: https://${DOMAIN}"
echo "API health: https://${DOMAIN}/api/health"
echo "PM2 status: pm2 status"
