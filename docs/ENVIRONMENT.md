# Environment & URLs

This repo is split into three apps:

- `frontend/` - customer site
- `admin/` - admin portal
- `backend/` - API server

## Required URLs

- Frontend URL: `https://<your-frontend-domain>`
- Admin URL: `https://<your-admin-domain>/admin`
- Backend API URL: `https://<your-backend-domain>`
- Stripe Webhook URL: `https://<your-backend-domain>/payments/webhook`

## Backend env (`backend/.env`)

```
MONGODB_URI=mongodb+srv://nazmunnaharhira6_db_user:EPsopWpOKMNq33rK@resturant.r3ip7wp.mongodb.net/?appName=resturant
PORT=5000

# Optional: restrict API access to VPN/public IPs (comma-separated).
ALLOWED_IPS=203.0.113.10,203.0.113.11

# Optional: restrict CORS to specific domains (comma-separated).
CORS_ORIGIN=https://<your-frontend-domain>,https://<your-admin-domain>

# Optional: trust proxy count for hosted environments (e.g. 1 for many PaaS).
TRUST_PROXY=1

ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=Admin@123
UPLOAD_DIR=uploads

STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Clover UK (optional)
CLOVER_ACCESS_TOKEN=pat_xxx
CLOVER_API_BASE_URL=https://scl.clover.com
CLOVER_DEFAULT_CURRENCY=gbp

# Google OAuth
GOOGLE_CLIENT_ID=your_google_oauth_client_id

# bKash / Nagad placeholders
BKASH_BASE_URL=
BKASH_APP_KEY=
BKASH_APP_SECRET=
BKASH_USERNAME=
BKASH_PASSWORD=
NAGAD_BASE_URL=
NAGAD_MERCHANT_ID=
NAGAD_PUBLIC_KEY=
NAGAD_PRIVATE_KEY=

# Deployment URLs (Hostinger compatible)
APP_PUBLIC_URL=https://<your-frontend-domain>
ADMIN_PUBLIC_URL=https://<your-admin-domain>
```

## Frontend env (`frontend/.env`)

```
VITE_API_BASE_URL=https://<your-backend-domain>
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
VITE_CLOVER_ENABLED=true
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id

VITE_FIREBASE_API_KEY=AIzaSyA3Q5LOkRRyPI12Jg2guK3HMXxcibPx6jo
VITE_FIREBASE_AUTH_DOMAIN=uk-restuart.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://uk-restuart-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=uk-restuart
VITE_FIREBASE_STORAGE_BUCKET=uk-restuart.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=900477608367
VITE_FIREBASE_APP_ID=1:900477608367:web:1ca928365ffc4711bf4f5a
VITE_FIREBASE_MEASUREMENT_ID=G-98F9RFC8QX
```

## Admin env (`admin/.env`)

```
VITE_API_BASE_URL=https://<your-backend-domain>
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
VITE_CLOVER_ENABLED=true
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id

VITE_FIREBASE_API_KEY=AIzaSyA3Q5LOkRRyPI12Jg2guK3HMXxcibPx6jo
VITE_FIREBASE_AUTH_DOMAIN=uk-restuart.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://uk-restuart-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=uk-restuart
VITE_FIREBASE_STORAGE_BUCKET=uk-restuart.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=900477608367
VITE_FIREBASE_APP_ID=1:900477608367:web:1ca928365ffc4711bf4f5a
VITE_FIREBASE_MEASUREMENT_ID=G-98F9RFC8QX
```

## Deployment checklist (Hostinger)

- Build `frontend` and `admin` with `npm run build`.
- Host static builds on Hostinger public directories.
- Run backend as Node app (`node index.js`) with process manager.
- Set `CORS_ORIGIN` to both frontend/admin domains.
- Run MySQL migration before first launch: `npm run migrate:mysql` in `backend`.
