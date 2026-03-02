# Lebanese Flames

A full-stack restaurant ordering application.

## Project Structure

```
├── backend/    # Node.js/Express API server
├── frontend/   # React frontend (Vite + TypeScript)
└── admin/      # React admin panel (Vite + TypeScript)
```

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [npm](https://www.npmjs.com/) v9 or later
- A MongoDB instance (e.g. [MongoDB Atlas](https://www.mongodb.com/atlas))

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
cp .env.example .env   # if available, otherwise create frontend/.env
```

Add the following to `frontend/.env`:

```
VITE_API_BASE_URL=http://localhost:5000
VITE_CLOVER_ENABLED=true
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 7. Start the frontend

```sh
cd frontend
npm run dev
```

## Common Errors

### `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'stripe'`

This error means the backend dependencies have not been installed. Run the following from the `backend` directory:

```sh
cd backend
npm install
```

This installs all required packages including `stripe`, and then you can start the server with `npm run dev`.

## Technologies

- **Backend**: Node.js, Express, MongoDB (Mongoose), Stripe, Twilio, Nodemailer
- **Frontend**: React, Vite, TypeScript, Tailwind CSS, shadcn-ui
