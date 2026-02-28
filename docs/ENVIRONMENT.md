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
```

## Frontend env (`frontend/.env`)

```
VITE_API_BASE_URL=https://<your-backend-domain>
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx

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

VITE_FIREBASE_API_KEY=AIzaSyA3Q5LOkRRyPI12Jg2guK3HMXxcibPx6jo
VITE_FIREBASE_AUTH_DOMAIN=uk-restuart.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://uk-restuart-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=uk-restuart
VITE_FIREBASE_STORAGE_BUCKET=uk-restuart.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=900477608367
VITE_FIREBASE_APP_ID=1:900477608367:web:1ca928365ffc4711bf4f5a
VITE_FIREBASE_MEASUREMENT_ID=G-98F9RFC8QX
```
