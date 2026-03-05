# Hostinger VPS deployment runbook

This folder contains production deployment assets for `lebaneseflames.co.uk`.

## Files

- `deploy.sh` – first-time server setup and deployment
- `update.sh` – future updates/redeploys
- `nginx.lebaneseflames.co.uk.conf` – Nginx template

## First deployment

1. Provision an Ubuntu VPS in Hostinger.
2. Point DNS:
   - `A @` -> VPS public IP
   - `A www` -> VPS public IP
3. SSH into VPS.
4. Clone repo:

```bash
sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/najmunnaharhira/lebanase-flame-react.git app
sudo chown -R $USER:$USER /var/www/app
cd /var/www/app
```

5. Edit `deploy/hostinger/deploy.sh` values (passwords/secrets/emails).
6. Run:

```bash
chmod +x deploy/hostinger/deploy.sh
./deploy/hostinger/deploy.sh
```

## Future updates

```bash
cd /var/www/app
chmod +x deploy/hostinger/update.sh
./deploy/hostinger/update.sh
```

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
