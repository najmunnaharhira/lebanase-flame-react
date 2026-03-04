import { createRequire } from "module";
import { existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let initialized = false;

if (getApps().length === 0) {
  const serviceAccountPath = join(__dirname, "serviceAccountKey.json");

  if (existsSync(serviceAccountPath)) {
    const require = createRequire(import.meta.url);
    const serviceAccount = require("./serviceAccountKey.json");
    initializeApp({ credential: cert(serviceAccount) });
    initialized = true;
  } else if (
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
    initialized = true;
  } else {
    console.warn(
      "[Firebase Admin] No credentials found. Google login will not work until you either:\n" +
        "  1. Place backend/config/serviceAccountKey.json (download from Firebase Console → Project Settings → Service Accounts)\n" +
        "  2. Or set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY env vars"
    );
  }
} else {
  initialized = true;
}

export const auth = initialized ? getAuth() : null;

export async function verifyFirebaseToken(token) {
  if (!auth) {
    throw new Error(
      "Firebase Admin is not initialized. Download serviceAccountKey.json from Firebase Console."
    );
  }
  return auth.verifyIdToken(token);
}
