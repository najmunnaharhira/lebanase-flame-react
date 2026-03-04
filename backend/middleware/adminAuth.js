import dotenv from "dotenv";

dotenv.config({ path: new URL("../../.env", import.meta.url) });

const adminEmail = process.env.ADMIN_EMAIL || "";
const adminPassword = process.env.ADMIN_PASSWORD || "";

let firebaseAuth = null;

const tryInitFirebase = async () => {
  if (firebaseAuth) return firebaseAuth;
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) return null;

  try {
    const admin = await import("firebase-admin");
    const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(parsed),
      });
    }

    firebaseAuth = admin.auth();
    return firebaseAuth;
  } catch {
    return null;
  }
};

export const verifyAdminAuth = async (req, res, next) => {
  const authorization =
    typeof req.headers.authorization === "string"
      ? req.headers.authorization
      : "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";

  if (token) {
    const auth = await tryInitFirebase();
    if (auth) {
      try {
        const decoded = await auth.verifyIdToken(token);
        const role = decoded?.role || decoded?.admin;
        if (role === "admin" || role === true) {
          req.admin = {
            uid: decoded.uid,
            email: decoded.email || "",
            provider: "firebase",
          };
          return next();
        }
        return res.status(403).json({ message: "Admin role required" });
      } catch {
        return res.status(401).json({ message: "Invalid Firebase token" });
      }
    }
  }

  const email =
    typeof req.headers["x-admin-email"] === "string"
      ? req.headers["x-admin-email"]
      : "";
  const password =
    typeof req.headers["x-admin-password"] === "string"
      ? req.headers["x-admin-password"]
      : "";

  if (adminEmail && adminPassword && email === adminEmail && password === adminPassword) {
    req.admin = { email, provider: "headers" };
    return next();
  }

  return res.status(401).json({ message: "Unauthorized" });
};
