# Hostinger VPS deployment runbook

This folder contains production deployment assets for `lebaneseflames.co.uk`.

## Files

- `build-hostinger-zip.sh` – **builds a deployable zip for Hostinger upload** ← start here
- `deploy.sh` – first-time server setup and deployment (git-based alternative)
- `update.sh` – future updates/redeploys (git-based)
- `nginx.lebaneseflames.co.uk.conf` – Nginx virtual-host template

---

## Option A – Zip upload (recommended for Hostinger File Manager)

### Step 1 – Build the zip locally

Run this on your local machine (Node.js 18+ required):

```bash
chmod +x deploy/hostinger/build-hostinger-zip.sh
./deploy/hostinger/build-hostinger-zip.sh
```

This produces **`lebanese-flames-hostinger.zip`** in the repository root.
The zip contains:

| Path in zip | Contents |
|---|---|
| `backend/` | Backend source + `package.json` (no `node_modules`) |
| `frontend/dist/` | Pre-built customer-facing React site |
| `admin/dist/` | Pre-built admin panel |
| `ecosystem.config.cjs` | PM2 process-manager config |
| `.env.production.example` | Environment variable template |
| `deploy/hostinger/` | Nginx config, helper scripts |

### Step 2 – Upload & extract on Hostinger VPS

Upload `lebanese-flames-hostinger.zip` via Hostinger File Manager or `scp`, then SSH in:

```bash
sudo mkdir -p /var/www/app
cd /var/www
sudo unzip ~/lebanese-flames-hostinger.zip -d app
sudo chown -R $USER:$USER /var/www/app
cd /var/www/app
```

### Step 3 – Install backend dependencies

```bash
npm --prefix backend install
```

### Step 4 – Configure environment variables

```bash
cp .env.production.example .env.production
nano .env.production   # fill in all secrets (DB password, JWT_SECRET, SMTP, etc.)
cp .env.production .env
```

### Step 5 – Run database migrations

```bash
npm --prefix backend run migrate:mysql
```

### Step 6 – Start the API with PM2

```bash
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup   # follow the printed command to enable autostart
```

### Step 7 – Configure Nginx & SSL

```bash
sudo cp deploy/hostinger/nginx.lebaneseflames.co.uk.conf \
         /etc/nginx/sites-available/lebaneseflames.co.uk
sudo ln -sf /etc/nginx/sites-available/lebaneseflames.co.uk \
            /etc/nginx/sites-enabled/lebaneseflames.co.uk
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Free SSL via Let's Encrypt (requires certbot installed):
sudo certbot --nginx -d lebaneseflames.co.uk -d www.lebaneseflames.co.uk
```

### Step 8 – Verify

```bash
pm2 status
curl -sS https://lebaneseflames.co.uk/api/health
```

---

## Option B – Git-based deployment (automated)

### First deployment

1. Provision an Ubuntu VPS in Hostinger.
2. Point DNS:
   - `A @` -> VPS public IP
   - `A www` -> VPS public IP
3. SSH into VPS.
4. Edit `deploy/hostinger/deploy.sh` (fill in passwords / secrets).
5. Run:

```bash
chmod +x deploy/hostinger/deploy.sh
./deploy/hostinger/deploy.sh
```

### Future updates

```bash
cd /var/www/app
chmod +x deploy/hostinger/update.sh
./deploy/hostinger/update.sh
```

---

## Post-deploy checks

```bash
pm2 status
pm2 logs lebanese-flames-api --lines 100
sudo nginx -t
curl -sS https://lebaneseflames.co.uk/api/health
```

## Security notes

- Rotate Twilio auth token (Twilio Console) and update `.env.production`.
- Use strong values for `JWT_SECRET`, admin password, and DB password.
- Restrict SSH access and keep the VPS updated.
