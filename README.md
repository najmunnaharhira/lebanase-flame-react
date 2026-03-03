# Lebanese Flames

A full-stack restaurant ordering application.

## Project Structure

```
├── backend/    # Node.js/Express API server
├── frontend/   # React customer-facing site (Vite + TypeScript)
└── admin/      # React admin panel (Vite + TypeScript)
```

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [npm](https://www.npmjs.com/) v9 or later
- A MongoDB instance (e.g. [MongoDB Atlas](https://www.mongodb.com/atlas))
- A MySQL database (local or hosted)
- A [Firebase project](https://console.firebase.google.com/) with Google Authentication enabled

## Setup

### 1. Clone the repository

```sh
git clone <YOUR_GIT_URL>
cd lebanase-flame-react
```

### 2. Install backend dependencies

```sh
cd backend
npm install
```

### 3. Configure backend environment variables

Copy the example env file and fill in your values:

```sh
cp .env.example .env
```

Edit `backend/.env` with your credentials:

```
MONGODB_URI=your_mongodb_connection_string
PORT=5000
JWT_SECRET=change_me_to_a_long_random_value
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change_me_to_a_strong_password
CORS_ORIGIN=http://localhost:5173,http://localhost:4173
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
CLOVER_ACCESS_TOKEN=pat_...
CLOVER_API_BASE_URL=https://scl.clover.com
CLOVER_DEFAULT_CURRENCY=gbp
GOOGLE_CLIENT_ID=your_google_oauth_client_id
APP_PUBLIC_URL=http://localhost:5173
ADMIN_PUBLIC_URL=http://localhost:4173
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM="Lebanese Flames <orders@example.com>"
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

> **Note:** Do not set `ALLOWED_IPS` during local development or if your frontend/admin are
> hosted on different domains – leave it unset to allow browser traffic from any IP.
> Use `CORS_ORIGIN` to restrict which origins can call the API.

### 4. Start the backend server

```sh
cd backend
npm run dev
```

The API server will start on `http://localhost:5000`.

Run MySQL migrations before first launch:

```sh
cd backend
npm run migrate:mysql
```

### 5. Install frontend dependencies

```sh
cd frontend
npm install
```

### 6. Configure frontend environment variables

```sh
cp .env.example .env
```

Edit `frontend/.env`:

```
VITE_API_BASE_URL=http://localhost:5000
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

### 7. Start the frontend

```sh
cd frontend
npm run dev
```

### 8. Install and configure the admin panel

```sh
cd admin
npm install
cp .env.example .env
```

Edit `admin/.env` (same Firebase + API values as the frontend):

```
VITE_API_BASE_URL=http://localhost:5000
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

```sh
cd admin
npm run dev
```

The admin panel runs on `http://localhost:4173` (preview) or the port shown by `npm run dev`.

## Google Sign-In

Both the customer site and the admin panel support **Sign in with Google** via Firebase:

1. Create a [Firebase project](https://console.firebase.google.com/) and enable **Authentication → Sign-in method → Google**.
2. Register `localhost` (dev) and your production domains as **Authorized domains** in Firebase.
3. Copy your Firebase Web config values (`apiKey`, `authDomain`, `projectId`, …) into `VITE_FIREBASE_*` variables for both `frontend/.env` and `admin/.env`.
4. In [Google Cloud Console](https://console.cloud.google.com/), find the **OAuth 2.0 Client ID** linked to your Firebase project and set `GOOGLE_CLIENT_ID` in `backend/.env` (and `VITE_GOOGLE_CLIENT_ID` in both frontends).
5. Restart the backend. The `/auth/google` endpoint will verify Firebase ID tokens and automatically create user records on first sign-in.

## Admin panel – managing roles (managers & editors)

The admin panel (`/admin`) uses role-based access control to let you delegate restaurant management to staff:

| Role | Access |
|------|--------|
| `admin` | Everything – full access including settings, payments, and user management |
| `manager` | Orders, menu, analytics, content, promotions, and creating editor/user accounts |
| `editor` | Orders, menu, analytics, and content – can create, edit, and upload media |
| `moderator` | Orders, menu, analytics, and content – can review content and manage reports |

### Adding a manager or editor

1. Sign in to `/admin/login` with your **admin** credentials (email + password set in `backend/.env`).
2. Navigate to **Users** (`/admin/users`).
3. Fill in **Name**, **Email**, **Password**, and select **Role** (`manager` or `editor`).
4. Click **Create user**. The new staff member can then sign in at `/admin/login` with those credentials.

### Google-based staff login

Staff can also use **Continue with Google** on the admin login page. On first sign-in their account is created with the `user` role; an admin must then go to **Users** and change their role to `manager` or `editor`.

## Production smoke check

From the workspace root, run:

```sh
npm run smoke:prod
```

This command validates:
- frontend production build
- admin production build
- backend syntax check

If you also want to run MySQL migration as part of the smoke check:

```sh
npm run smoke:prod:db
```

## Common Errors

### `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'stripe'`

This error means the backend dependencies have not been installed. Run the following from the `backend` directory:

```sh
cd backend
npm install
```

This installs all required packages including `stripe`, and then you can start the server with `npm run dev`.

### Frontend/admin gets `403 API access is restricted`

Make sure `ALLOWED_IPS` is **not set** (or is empty) in `backend/.env` unless you intentionally want to restrict access to specific server IPs. When `ALLOWED_IPS` is empty, the backend accepts requests from any IP and relies on `CORS_ORIGIN` for origin security.

## Technologies

- **Backend**: Node.js, Express, MySQL (mysql2), MongoDB (Mongoose), Stripe, Twilio, Nodemailer
- **Frontend**: React, Vite, TypeScript, Tailwind CSS, shadcn-ui, Firebase Auth
- **Admin**: React, Vite, TypeScript, Tailwind CSS, shadcn-ui, Firebase Auth
