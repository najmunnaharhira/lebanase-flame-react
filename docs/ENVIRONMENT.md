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
MONGODB_URI=mongodb+srv://<db_user>:<db_password>@<cluster-host>/<db_name>?retryWrites=true&w=majority
PORT=5000

# Optional: restrict API access to specific IPs (comma-separated). Leave empty to allow all IPs.
# ALLOWED_IPS=203.0.113.10,203.0.113.11

# Required in production: restrict CORS to specific domains (comma-separated).
CORS_ORIGIN=https://<your-frontend-domain>,https://<your-admin-domain>

# Optional: trust proxy count for hosted environments (e.g. 1 for many PaaS).
TRUST_PROXY=1

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change_me_to_a_strong_password
UPLOAD_DIR=uploads

JWT_SECRET=change_me_to_a_long_random_value
JWT_EXPIRES_IN=1h

STRIPE_SECRET_KEY=sk_live_or_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Clover UK (optional)
CLOVER_ACCESS_TOKEN=your_clover_oauth_access_token
CLOVER_API_BASE_URL=https://scl.clover.com
CLOVER_DEFAULT_CURRENCY=gbp

# Google OAuth – required for Google Sign-In on frontend and admin
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
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_or_test_xxx
VITE_CLOVER_ENABLED=true
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id

VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## Admin env (`admin/.env`)

```
VITE_API_BASE_URL=https://<your-backend-domain>
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_or_test_xxx
VITE_CLOVER_ENABLED=true
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id

VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## Google Sign-In setup

1. Create a project in [Firebase Console](https://console.firebase.google.com/) and enable **Authentication → Google** sign-in.
2. Register your frontend and admin domains as **Authorized domains** in Firebase.
3. Copy the **Web API Key** and other config values into the `VITE_FIREBASE_*` variables for both `frontend/.env` and `admin/.env`.
4. In [Google Cloud Console](https://console.cloud.google.com/), locate the OAuth 2.0 client for your Firebase project and copy the **Client ID** into:
   - `GOOGLE_CLIENT_ID` in `backend/.env`
   - `VITE_GOOGLE_CLIENT_ID` in `frontend/.env` and `admin/.env`
5. Restart the backend. The `/auth/google` endpoint will now accept Firebase ID tokens and create or update user records.

## Admin panel – adding managers and editors

The admin panel (`admin/`) provides role-based access so you can delegate restaurant management:

| Role | Permissions |
|------|-------------|
| `admin` | Full access – all pages, all users |
| `manager` | Orders, menu, analytics, content, users (editor/user only) |
| `editor` | Orders, menu, analytics, content |
| `moderator` | Orders, menu, analytics, content |

To add a manager or editor:
1. Sign in to the admin panel at `/admin/login` with your admin credentials.
2. Go to **Users** (`/admin/users`).
3. Fill in the **Name**, **Email**, **Password**, and select **Role** (`manager` or `editor`).
4. Click **Create user**. The new account can then sign in at `/admin/login`.

Alternatively, if you have Google accounts for your staff, they can use **Continue with Google** on the admin login page. Their account will be created automatically with the `user` role on first sign-in; an admin must then upgrade their role from the **Users** page.

## Deployment checklist (Hostinger)

- Build `frontend` and `admin` with `npm run build`.
- Host static builds on Hostinger public directories.
- Run backend as Node app (`node index.js`) with process manager.
- Set `CORS_ORIGIN` to both frontend/admin domains.
- Set `GOOGLE_CLIENT_ID` to your Google OAuth client ID.
- Set `VITE_FIREBASE_*` and `VITE_GOOGLE_CLIENT_ID` in both frontend and admin `.env` files.
- Run MySQL migration before first launch: `npm run migrate:mysql` in `backend`.
- **Do not set `ALLOWED_IPS`** unless you need to restrict API access to specific server IPs. Leave it unset to allow browser traffic from any IP.
