import Stripe from "stripe";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";
import cors from "cors";
import csurf from "csurf";
import dotenv from "dotenv";
import express from "express";
import fetch from "node-fetch";
import fs from "fs";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import multer from "multer";
import nodemailer from "nodemailer";
import path from "path";
import rateLimit from "express-rate-limit";
import sharp from "sharp";
import twilio from "twilio";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";
import { sanitizeInput } from "./middleware/sanitizeInput.js";
import { AbandonedCart } from "./models/AbandonedCart.js";
import { BusinessSettings } from "./models/BusinessSettings.js";
import { Category } from "./models/Category.js";
import { MenuItem } from "./models/MenuItem.js";
import { Order } from "./models/Order.js";
import { Promotion } from "./models/Promotion.js";
import { SupportMessage } from "./models/SupportMessage.js";
import { UserProfile } from "./models/UserProfile.js";
import { mysqlPool, testMySqlConnection } from "./mysql/connection.js";

dotenv.config({ path: new URL("./.env", import.meta.url) });

const app = express();
const PORT = process.env.PORT || 5000;

const trustProxy = Number(process.env.TRUST_PROXY || 0);
if (trustProxy > 0) {
  app.set("trust proxy", trustProxy);
}

const corsOrigin = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean);

const isDevEnvironment = process.env.NODE_ENV !== "production";
const isDevNetworkOrigin = (origin) => {
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false;
    }

    const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
    const isPrivateLan = /^192\.168\.\d{1,3}\.\d{1,3}$/.test(parsed.hostname);

    return isLocalhost || isPrivateLan;
  } catch {
    return false;
  }
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (corsOrigin.length === 0 || corsOrigin.includes(origin)) {
        callback(null, true);
        return;
      }

      if (isDevEnvironment && isDevNetworkOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  }),
);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use(cookieParser());

const rateLimitWindowMs = Number(
  process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
);
const rateLimitMax = Number(process.env.RATE_LIMIT_MAX || 200);

const apiLimiter = rateLimit({
  windowMs: rateLimitWindowMs,
  max: rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/auth", apiLimiter);
app.use("/payments", apiLimiter);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = process.env.UPLOAD_DIR || "uploads";
const uploadsPath = path.join(__dirname, uploadDir);

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

app.use("/uploads", express.static(uploadsPath));

const allowedImageMimeTypes = ["image/jpeg", "image/png", "image/webp"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedImageMimeTypes.includes(file.mimetype)) {
      callback(new Error("Only JPG, PNG, and WEBP images are allowed"));
      return;
    }
    callback(null, true);
  },
});

const MENU_IMAGE_MAX_WIDTH = 1024;
const MENU_IMAGE_MAX_HEIGHT = 1024;
const MENU_IMAGE_QUALITY = 82;

const processAndStoreMenuImage = async (buffer) => {
  const filename = `${Date.now()}-${randomUUID()}.webp`;
  const outputPath = path.join(uploadsPath, filename);

  await sharp(buffer)
    .rotate()
    .resize(MENU_IMAGE_MAX_WIDTH, MENU_IMAGE_MAX_HEIGHT, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: MENU_IMAGE_QUALITY })
    .toFile(outputPath);

  return filename;
};

const parseAllowedIps = (value) => {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const allowedIps = parseAllowedIps(process.env.ALLOWED_IPS);
const adminEmail = process.env.ADMIN_EMAIL || "";
const adminPassword = process.env.ADMIN_PASSWORD || "";
const jwtSecret = process.env.JWT_SECRET || "dev-secret";
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "1h";
const googleClientId = process.env.GOOGLE_CLIENT_ID || "";
const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || "";

const getRequestIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "";
};

const normalizeIp = (ip) => ip.replace(/^::ffff:/, "");

app.use((req, res, next) => {
  if (req.path === "/health" || req.path === "/payments/webhook") {
    return next();
  }

  if (allowedIps.length === 0) {
    return next();
  }

  const requestIp = normalizeIp(getRequestIp(req));
  const isLocal =
    requestIp === "127.0.0.1" ||
    requestIp === "::1" ||
    requestIp.startsWith("192.168.") ||
    requestIp.startsWith("10.") ||
    requestIp.startsWith("172.16.");
  if (isLocal || allowedIps.includes(requestIp)) {
    return next();
  }

  return res.status(403).json({ message: "API access is restricted" });
});

const buildJwtPayload = (user) => ({
  sub: String(user.id),
  email: user.email,
  role: user.role || "user",
  name: user.name,
});

const signAccessToken = (user) =>
  jwt.sign(buildJwtPayload(user), jwtSecret, {
    expiresIn: jwtExpiresIn,
  });

const extractAuthUser = (req) => {
  const authHeader = req.headers.authorization || "";
  const tokenFromHeader = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;
  const tokenFromCookie =
    typeof req.cookies?.access_token === "string"
      ? req.cookies.access_token
      : null;
  const token = tokenFromHeader || tokenFromCookie;

  if (!token) return null;

  const decoded = jwt.verify(token, jwtSecret);
  return {
    id: decoded.sub,
    email: decoded.email,
    role: decoded.role,
    name: decoded.name,
  };
};

const authenticateJwt = async (req, res, next) => {
  try {
    const user = extractAuthUser(req);
    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

const requireRole = (roles) => {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    let user = req.user;
    if (!user) {
      try {
        user = extractAuthUser(req);
        if (user) req.user = user;
      } catch {
        user = null;
      }
    }

    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (!allowed.includes(user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    return next();
  };
};

const requireAdmin = (req, res, next) => {
  const email =
    typeof req.headers["x-admin-email"] === "string"
      ? req.headers["x-admin-email"]
      : "";
  const password =
    typeof req.headers["x-admin-password"] === "string"
      ? req.headers["x-admin-password"]
      : "";

  if (adminEmail && adminPassword && email === adminEmail && password === adminPassword) {
    req.user = {
      id: "env-admin",
      email: adminEmail,
      role: "admin",
      name: "Administrator",
    };
    return next();
  }

  let user = req.user;
  if (!user) {
    try {
      user = extractAuthUser(req);
      if (user) req.user = user;
    } catch {
      user = null;
    }
  }

  if (user && user.role === "admin") {
    return next();
  }

  return res.status(401).json({ message: "Unauthorized" });
};

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  throw new Error("MONGODB_URI is missing in environment variables");
}

const envStripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
const envStripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
const envStripePublishableKey = process.env.VITE_STRIPE_PUBLISHABLE_KEY || "";

const envCloverAccessToken = process.env.CLOVER_ACCESS_TOKEN || "";
const envCloverPrivateKey = process.env.CLOVER_PRIVATE_KEY || "";
const envCloverMerchantId = process.env.CLOVER_MERCHANT_ID || "";
const envCloverApiBaseUrl =
  process.env.CLOVER_API_BASE_URL || "https://scl-sandbox.dev.clover.com";
const envCloverDefaultCurrency =
  (process.env.CLOVER_DEFAULT_CURRENCY || "gbp").toLowerCase();

app.post(
  "/payments/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const paymentSettings = await getResolvedPaymentSettings();
    const stripe = paymentSettings.stripeSecretKey
      ? new Stripe(paymentSettings.stripeSecretKey, { apiVersion: "2024-06-20" })
      : null;

    if (!stripe || !paymentSettings.stripeWebhookSecret) {
      return res.status(500).json({ message: "Stripe is not configured" });
    }

    const signature = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        paymentSettings.stripeWebhookSecret,
      );
    } catch (error) {
      return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    try {
      if (event.type === "payment_intent.succeeded") {
        const intent = event.data.object;
        await Order.findOneAndUpdate(
          { paymentIntentId: intent.id },
          { paymentStatus: "paid" },
        );
      }

      if (event.type === "payment_intent.payment_failed") {
        const intent = event.data.object;
        await Order.findOneAndUpdate(
          { paymentIntentId: intent.id },
          { paymentStatus: "pending" },
        );
      }
    } catch (error) {
      return res.status(500).json({ message: "Failed to process webhook" });
    }

    return res.json({ received: true });
  },
);

app.use(express.json());
app.use(sanitizeInput);

mongoose
  .connect(mongoUri)
  .then(() => console.log("MongoDB connected"))
  .catch((error) => {
    console.error("MongoDB connection error:", error.message || error);
    if (error.message && error.message.includes("whitelist")) {
      console.error(
        "\n>>> FIX: Add your current IP to MongoDB Atlas Network Access:",
      );
      console.error(
        "    1. Go to https://cloud.mongodb.com → your project → Network Access",
      );
      console.error("    2. Click 'Add IP Address'");
      console.error(
        "    3. Add your current IP, or use 0.0.0.0/0 to allow all (dev only)",
      );
      console.error(
        "    https://www.mongodb.com/docs/atlas/security-whitelist/\n",
      );
    }
    process.exit(1);
  });

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  },
});

app.get("/auth/csrf-token", csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

const serializeMenuItem = (item) => {
  const { _id, __v, ...rest } = item;
  return {
    ...rest,
    id: item.id || _id?.toString(),
  };
};

const calculateOrderTotal = (
  items = [],
  deliveryFee = 0,
  loyaltyDiscount = 0,
  promoDiscount = 0,
) => {
  const itemsTotal = items.reduce(
    (sum, item) => sum + (Number(item?.totalPrice) || 0),
    0,
  );
  return Math.max(
    0,
    itemsTotal +
      Number(deliveryFee || 0) -
      Number(loyaltyDiscount || 0) -
      Number(promoDiscount || 0),
  );
};

const serializeOrder = (order) => {
  const { __v, ...rest } = order;
  return {
    ...rest,
    status: normalizeOrderStatus(order.status),
    _id: order._id?.toString(),
  };
};

const ORDER_STATUS_MAP = {
  "Order Received": "Food Processing",
  Preparing: "Food Processing",
  "Ready for Collection": "Out for delivery",
  "Out for Delivery": "Out for delivery",
  Completed: "Delivered",
  "Food Processing": "Food Processing",
  "Out for delivery": "Out for delivery",
  Delivered: "Delivered",
};

const normalizeOrderStatus = (status) => {
  if (typeof status !== "string") return "Food Processing";
  const trimmed = status.trim();
  return ORDER_STATUS_MAP[trimmed] || "Food Processing";
};

const serializeCategory = (category) => {
  const { _id, __v, ...rest } = category;
  return {
    ...rest,
    id: category.slug,
    dbId: _id?.toString(),
  };
};

const toSlug = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const defaultOpeningHours = [
  { day: "Monday", open: "12:00", close: "23:00", closed: false },
  { day: "Tuesday", open: "12:00", close: "23:00", closed: false },
  { day: "Wednesday", open: "12:00", close: "23:00", closed: false },
  { day: "Thursday", open: "12:00", close: "23:00", closed: false },
  { day: "Friday", open: "12:00", close: "23:00", closed: false },
  { day: "Saturday", open: "12:00", close: "23:00", closed: false },
  { day: "Sunday", open: "12:00", close: "23:00", closed: false },
];

const defaultPaymentSettings = {
  stripePublishableKey: "",
  stripeSecretKey: "",
  stripeWebhookSecret: "",
  cloverEnabled: false,
  cloverAccessToken: "",
  cloverPrivateKey: "",
  cloverMerchantId: "",
  cloverApiBaseUrl: "https://scl-sandbox.dev.clover.com",
  cloverDefaultCurrency: "gbp",
};

const defaultAboutChef = {
  sectionTitle: "Meet Our Chef",
  chefName: "Chef Ahmad Khoury",
  bio:
    "Born in Beirut and trained in the finest Lebanese kitchens, Chef Ahmad brings over two decades of culinary expertise to Eltham. Every dish is crafted with love, using traditional family recipes passed down through generations.",
  imageUrl: "",
  experienceText: "20+ Years Experience",
};

const defaultContactInfo = {
  phone: "07466 305 669",
  email: "hello@lebaneseflames.co.uk",
  address: "381 Footscray Road, New Eltham, London SE9 2DR",
  whatsapp: "447466305669",
};

const defaultOfferPopup = {
  enabled: true,
  title: "Welcome Offer 🔥",
  description: "Get 10% OFF your first order with code WELCOME10.",
  promoCode: "WELCOME10",
  ctaText: "Order now",
  ctaLink: "/menu",
  cashbackAmount: 0,
};

const getBusinessSettings = async () => {
  let settings = await BusinessSettings.findOne().lean();
  if (!settings) {
    settings = await BusinessSettings.create({
      businessName: "Lebanese Flames",
      logoUrl: "",
      openingHours: defaultOpeningHours,
      holidayClosures: [],
      paymentSettings: defaultPaymentSettings,
      aboutChef: defaultAboutChef,
      contactInfo: defaultContactInfo,
      offerPopup: defaultOfferPopup,
    });
  }

  return {
    ...settings,
    paymentSettings: {
      ...defaultPaymentSettings,
      ...(settings.paymentSettings || {}),
    },
    aboutChef: {
      ...defaultAboutChef,
      ...(settings.aboutChef || {}),
    },
    contactInfo: {
      ...defaultContactInfo,
      ...(settings.contactInfo || {}),
    },
    offerPopup: {
      ...defaultOfferPopup,
      ...(settings.offerPopup || {}),
    },
  };
};

const getResolvedPaymentSettings = async () => {
  const settings = await getBusinessSettings();
  const saved = settings.paymentSettings || defaultPaymentSettings;

  return {
    stripePublishableKey:
      String(saved.stripePublishableKey || "").trim() || envStripePublishableKey,
    stripeSecretKey:
      String(saved.stripeSecretKey || "").trim() || envStripeSecretKey,
    stripeWebhookSecret:
      String(saved.stripeWebhookSecret || "").trim() || envStripeWebhookSecret,
    cloverEnabled:
      Boolean(saved.cloverEnabled) ||
      Boolean(
        String(saved.cloverAccessToken || "").trim() ||
          String(saved.cloverPrivateKey || "").trim() ||
          envCloverAccessToken ||
          envCloverPrivateKey,
      ),
    cloverAccessToken:
      String(saved.cloverAccessToken || "").trim() || envCloverAccessToken,
    cloverPrivateKey:
      String(saved.cloverPrivateKey || "").trim() || envCloverPrivateKey,
    cloverMerchantId:
      String(saved.cloverMerchantId || "").trim() || envCloverMerchantId,
    cloverApiBaseUrl:
      String(saved.cloverApiBaseUrl || "").trim() || envCloverApiBaseUrl,
    cloverDefaultCurrency:
      (String(saved.cloverDefaultCurrency || "").trim() ||
        envCloverDefaultCurrency ||
        "gbp")
        .toLowerCase(),
  };
};

const toPublicBusinessSettings = (settings) => ({
  ...settings,
  paymentSettings: {
    stripePublishableKey: String(settings?.paymentSettings?.stripePublishableKey || "").trim(),
    cloverEnabled: Boolean(settings?.paymentSettings?.cloverEnabled),
  },
});

const toAdminBusinessSettings = (settings) => ({
  ...settings,
  paymentSettings: {
    ...defaultPaymentSettings,
    ...(settings?.paymentSettings || {}),
  },
});

const buildStripeClient = (secretKey) =>
  secretKey ? new Stripe(secretKey, { apiVersion: "2024-06-20" }) : null;

const normalizePaymentSettingsInput = (raw, current) => {
  const source = raw && typeof raw === "object" ? raw : {};
  const fallback = current || defaultPaymentSettings;

  return {
    stripePublishableKey:
      typeof source.stripePublishableKey === "string"
        ? source.stripePublishableKey.trim()
        : String(fallback.stripePublishableKey || "").trim(),
    stripeSecretKey:
      typeof source.stripeSecretKey === "string"
        ? source.stripeSecretKey.trim()
        : String(fallback.stripeSecretKey || "").trim(),
    stripeWebhookSecret:
      typeof source.stripeWebhookSecret === "string"
        ? source.stripeWebhookSecret.trim()
        : String(fallback.stripeWebhookSecret || "").trim(),
    cloverEnabled:
      typeof source.cloverEnabled === "boolean"
        ? source.cloverEnabled
        : Boolean(fallback.cloverEnabled),
    cloverAccessToken:
      typeof source.cloverAccessToken === "string"
        ? source.cloverAccessToken.trim()
        : String(fallback.cloverAccessToken || "").trim(),
    cloverPrivateKey:
      typeof source.cloverPrivateKey === "string"
        ? source.cloverPrivateKey.trim()
        : String(fallback.cloverPrivateKey || "").trim(),
    cloverMerchantId:
      typeof source.cloverMerchantId === "string"
        ? source.cloverMerchantId.trim()
        : String(fallback.cloverMerchantId || "").trim(),
    cloverApiBaseUrl:
      typeof source.cloverApiBaseUrl === "string"
        ? source.cloverApiBaseUrl.trim()
        : String(fallback.cloverApiBaseUrl || defaultPaymentSettings.cloverApiBaseUrl),
    cloverDefaultCurrency:
      typeof source.cloverDefaultCurrency === "string"
        ? source.cloverDefaultCurrency.trim().toLowerCase()
        : String(fallback.cloverDefaultCurrency || defaultPaymentSettings.cloverDefaultCurrency)
            .trim()
            .toLowerCase(),
  };
};

const validatePaymentSettingsInput = (paymentSettings) => {
  const issues = [];

  if (
    paymentSettings.stripePublishableKey &&
    !/^pk_(test|live)_/i.test(paymentSettings.stripePublishableKey)
  ) {
    issues.push("stripePublishableKey must start with pk_test_ or pk_live_");
  }

  if (
    paymentSettings.stripeSecretKey &&
    !/^sk_(test|live)_/i.test(paymentSettings.stripeSecretKey)
  ) {
    issues.push("stripeSecretKey must start with sk_test_ or sk_live_");
  }

  if (
    paymentSettings.stripeWebhookSecret &&
    !/^whsec_/i.test(paymentSettings.stripeWebhookSecret)
  ) {
    issues.push("stripeWebhookSecret must start with whsec_");
  }

  if (
    paymentSettings.cloverApiBaseUrl &&
    !/^https?:\/\//i.test(paymentSettings.cloverApiBaseUrl)
  ) {
    issues.push("cloverApiBaseUrl must be a valid absolute URL");
  }

  if (paymentSettings.cloverDefaultCurrency.length !== 3) {
    issues.push("cloverDefaultCurrency must be a 3-letter currency code");
  }

  return issues;
};

const normalizeAboutChefInput = (raw, current) => {
  const source = raw && typeof raw === "object" ? raw : {};
  const fallback = current || defaultAboutChef;

  return {
    sectionTitle:
      typeof source.sectionTitle === "string"
        ? source.sectionTitle.trim()
        : String(fallback.sectionTitle || defaultAboutChef.sectionTitle).trim(),
    chefName:
      typeof source.chefName === "string"
        ? source.chefName.trim()
        : String(fallback.chefName || defaultAboutChef.chefName).trim(),
    bio:
      typeof source.bio === "string"
        ? source.bio.trim()
        : String(fallback.bio || defaultAboutChef.bio).trim(),
    imageUrl:
      typeof source.imageUrl === "string"
        ? source.imageUrl.trim()
        : String(fallback.imageUrl || defaultAboutChef.imageUrl).trim(),
    experienceText:
      typeof source.experienceText === "string"
        ? source.experienceText.trim()
        : String(fallback.experienceText || defaultAboutChef.experienceText).trim(),
  };
};

const normalizeContactInfoInput = (raw, current) => {
  const source = raw && typeof raw === "object" ? raw : {};
  const fallback = current || defaultContactInfo;

  return {
    phone:
      typeof source.phone === "string"
        ? source.phone.trim()
        : String(fallback.phone || defaultContactInfo.phone).trim(),
    email:
      typeof source.email === "string"
        ? source.email.trim()
        : String(fallback.email || defaultContactInfo.email).trim(),
    address:
      typeof source.address === "string"
        ? source.address.trim()
        : String(fallback.address || defaultContactInfo.address).trim(),
    whatsapp:
      typeof source.whatsapp === "string"
        ? source.whatsapp.trim()
        : String(fallback.whatsapp || defaultContactInfo.whatsapp).trim(),
  };
};

const validateAboutChefInput = (aboutChef) => {
  const issues = [];

  if (!aboutChef.sectionTitle || aboutChef.sectionTitle.length > 80) {
    issues.push("aboutChef.sectionTitle is required and must be 80 characters or less");
  }
  if (!aboutChef.chefName || aboutChef.chefName.length > 80) {
    issues.push("aboutChef.chefName is required and must be 80 characters or less");
  }
  if (!aboutChef.bio || aboutChef.bio.length > 1200) {
    issues.push("aboutChef.bio is required and must be 1200 characters or less");
  }
  if (aboutChef.experienceText.length > 60) {
    issues.push("aboutChef.experienceText must be 60 characters or less");
  }
  if (
    aboutChef.imageUrl &&
    !/^https?:\/\//i.test(aboutChef.imageUrl) &&
    !aboutChef.imageUrl.startsWith("/uploads/") &&
    !aboutChef.imageUrl.startsWith("uploads/")
  ) {
    issues.push("aboutChef.imageUrl must be an absolute URL or an uploads path");
  }

  return issues;
};

const validateContactInfoInput = (contactInfo) => {
  const issues = [];

  if (!contactInfo.phone || contactInfo.phone.length > 40) {
    issues.push("contactInfo.phone is required and must be 40 characters or less");
  }
  if (!contactInfo.email || contactInfo.email.length > 120 || !emailRegex.test(contactInfo.email)) {
    issues.push("contactInfo.email must be a valid email address");
  }
  if (!contactInfo.address || contactInfo.address.length > 200) {
    issues.push("contactInfo.address is required and must be 200 characters or less");
  }
  if (contactInfo.whatsapp && contactInfo.whatsapp.length > 20) {
    issues.push("contactInfo.whatsapp must be 20 characters or less");
  }

  return issues;
};

const normalizeOfferPopupInput = (raw, current) => {
  const source = raw && typeof raw === "object" ? raw : {};
  const fallback = current || defaultOfferPopup;

  return {
    enabled:
      typeof source.enabled === "boolean"
        ? source.enabled
        : Boolean(fallback.enabled),
    title:
      typeof source.title === "string"
        ? source.title.trim()
        : String(fallback.title || defaultOfferPopup.title).trim(),
    description:
      typeof source.description === "string"
        ? source.description.trim()
        : String(fallback.description || defaultOfferPopup.description).trim(),
    promoCode:
      typeof source.promoCode === "string"
        ? source.promoCode.trim().toUpperCase()
        : String(fallback.promoCode || defaultOfferPopup.promoCode)
            .trim()
            .toUpperCase(),
    ctaText:
      typeof source.ctaText === "string"
        ? source.ctaText.trim()
        : String(fallback.ctaText || defaultOfferPopup.ctaText).trim(),
    ctaLink:
      typeof source.ctaLink === "string"
        ? source.ctaLink.trim()
        : String(fallback.ctaLink || defaultOfferPopup.ctaLink).trim(),
    cashbackAmount: Number.isFinite(Number(source.cashbackAmount))
      ? Math.max(0, Number(source.cashbackAmount))
      : Math.max(0, Number(fallback.cashbackAmount || 0)),
  };
};

const validateOfferPopupInput = (offerPopup) => {
  const issues = [];

  if (!offerPopup.title || offerPopup.title.length > 80) {
    issues.push("offerPopup.title is required and must be 80 characters or less");
  }
  if (!offerPopup.description || offerPopup.description.length > 220) {
    issues.push("offerPopup.description is required and must be 220 characters or less");
  }
  if (offerPopup.promoCode.length > 30) {
    issues.push("offerPopup.promoCode must be 30 characters or less");
  }
  if (!offerPopup.ctaText || offerPopup.ctaText.length > 30) {
    issues.push("offerPopup.ctaText is required and must be 30 characters or less");
  }
  if (!offerPopup.ctaLink || offerPopup.ctaLink.length > 120) {
    issues.push("offerPopup.ctaLink is required and must be 120 characters or less");
  }
  if (offerPopup.cashbackAmount < 0 || offerPopup.cashbackAmount > 1000) {
    issues.push("offerPopup.cashbackAmount must be between 0 and 1000");
  }

  return issues;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const findUserByEmail = async (email) => {
  const [rows] = await mysqlPool.query(
    "SELECT id, name, email, password, role, google_id, profile_image, is_active FROM users WHERE email = ? LIMIT 1",
    [email],
  );
  return rows[0] || null;
};

const findUserById = async (id) => {
  const [rows] = await mysqlPool.query(
    "SELECT id, name, email, password, role, google_id, profile_image, is_active FROM users WHERE id = ? LIMIT 1",
    [id],
  );
  return rows[0] || null;
};

const createUser = async ({
  name,
  email,
  passwordHash,
  role = "user",
  googleId,
  profileImage,
}) => {
  const [result] = await mysqlPool.query(
    "INSERT INTO users (name, email, password, role, google_id, profile_image) VALUES (?, ?, ?, ?, ?, ?)",
    [name, email, passwordHash, role, googleId || null, profileImage || null],
  );
  return findUserById(result.insertId);
};

const updateUserRole = async ({ userId, role }) => {
  await mysqlPool.query("UPDATE users SET role = ? WHERE id = ?", [
    role,
    userId,
  ]);
  return findUserById(userId);
};

const SUPPORTED_ROLES = ["admin", "manager", "moderator", "editor", "user"];

const ROLE_PERMISSIONS = {
  admin: [
    "users.manage",
    "roles.assign",
    "dashboard.full",
    "payments.manage",
    "content.manage",
    "reports.manage",
    "settings.manage",
  ],
  manager: [
    "users.manage_limited",
    "roles.assign_editor",
    "dashboard.full",
    "content.manage",
    "reports.manage",
    "promotions.manage",
  ],
  moderator: ["content.review", "reports.manage", "dashboard.read"],
  editor: ["content.create", "content.edit", "media.upload", "dashboard.read"],
  user: ["self.read"],
};

const canAssignRole = (actorRole, nextRole) => {
  if (actorRole === "admin") return true;
  if (actorRole === "manager") {
    return ["editor", "user"].includes(nextRole);
  }
  return false;
};

const canManageExistingUser = (actorRole, targetRole) => {
  if (actorRole === "admin") return true;
  if (actorRole === "manager") {
    return ["editor", "user"].includes(targetRole);
  }
  return false;
};

const normalizeRoleInput = (role) => {
  const value = String(role || "")
    .trim()
    .toLowerCase();
  return SUPPORTED_ROLES.includes(value) ? value : null;
};

const sanitizeUserResponse = (user) => {
  if (!user) return null;
  return {
    id: Number(user.id),
    name: user.name,
    email: user.email,
    role: user.role,
    googleId: user.google_id || null,
    profileImage: user.profile_image || null,
    isActive: Boolean(user.is_active),
  };
};

const getRolePermissions = (role) =>
  ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.user;

const requireStaffRole = requireRole([
  "admin",
  "manager",
  "moderator",
  "editor",
]);

const logActivity = async ({
  userId,
  action,
  entityType,
  entityId,
  details,
  ipAddress,
}) => {
  try {
    await mysqlPool.query(
      "INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
      [
        userId || null,
        action,
        entityType || null,
        entityId || null,
        details || null,
        ipAddress || null,
      ],
    );
  } catch {}
};

app.get("/admin/payments", requireAdmin, async (req, res) => {
  try {
    const [rows] = await mysqlPool.query(
      `SELECT p.id,
              p.transaction_id,
              p.amount,
              p.payment_method,
              p.status,
              p.created_at,
              u.email AS user_email
       FROM payments p
       LEFT JOIN users u ON u.id = p.user_id
       ORDER BY p.created_at DESC
       LIMIT 500`,
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Failed to load payments" });
  }
});

app.get("/admin/payments/summary", requireAdmin, async (req, res) => {
  try {
    const [rows] = await mysqlPool.query(
      `SELECT
         COUNT(*) AS totalCount,
         SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS successCount,
         SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failedCount,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pendingCount,
         SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END) AS totalRevenue
       FROM payments`,
    );

    const [byMethod] = await mysqlPool.query(
      `SELECT payment_method, COUNT(*) as count, SUM(amount) as total
       FROM payments
       GROUP BY payment_method`,
    );

    res.json({
      overview: rows[0] || {
        totalCount: 0,
        successCount: 0,
        failedCount: 0,
        pendingCount: 0,
        totalRevenue: 0,
      },
      byMethod,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load payments summary" });
  }
});

app.post("/admin/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();
    const normalizedPassword = String(password || "");

    if (!normalizedEmail || !normalizedPassword) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    let user = await findUserByEmail(normalizedEmail);

    if (
      !user &&
      adminEmail && adminPassword &&
      normalizedEmail === String(adminEmail).toLowerCase() &&
      normalizedPassword === String(adminPassword)
    ) {
      const passwordHash = await bcrypt.hash(normalizedPassword, 10);
      user = await createUser({
        name: "Administrator",
        email: normalizedEmail,
        passwordHash,
        role: "admin",
      });
    }

    if (!user || !user.is_active) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    let isMatch = false;
    if (
      adminEmail && adminPassword &&
      normalizedEmail === String(adminEmail).toLowerCase() &&
      normalizedPassword === String(adminPassword)
    ) {
      isMatch = true;
    } else {
      isMatch = await bcrypt.compare(normalizedPassword, user.password);
    }

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!["admin", "manager", "moderator", "editor"].includes(user.role)) {
      return res.status(403).json({ message: "Admin panel access denied" });
    }

    const token = signAccessToken(user);
    setAuthCookie(res, token);

    await logActivity({
      userId: user.id,
      action: "admin_login",
      entityType: "user",
      entityId: String(user.id),
      details: null,
      ipAddress: normalizeIp(getRequestIp(req)),
    });

    return res.json({
      accessToken: token,
      user: sanitizeUserResponse(user),
      permissions: getRolePermissions(user.role),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to sign in" });
  }
});

app.get("/admin/auth/me", requireStaffRole, async (req, res) => {
  try {
    const user = await findUserById(req.user.id);
    if (!user || !user.is_active) {
      return res.status(401).json({ message: "Authentication required" });
    }
    return res.json({
      user: sanitizeUserResponse(user),
      permissions: getRolePermissions(user.role),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load account" });
  }
});

app.get("/auth/me", authenticateJwt, async (req, res) => {
  try {
    const user = await findUserById(req.user.id);
    if (!user || !user.is_active) {
      return res.status(401).json({ message: "Authentication required" });
    }
    return res.json(sanitizeUserResponse(user));
  } catch (error) {
    return res.status(500).json({ message: "Failed to load account" });
  }
});

app.post("/auth/google", async (req, res) => {
  try {
    const idToken = String(req.body?.idToken || "").trim();
    const firebaseIdToken = String(req.body?.firebaseIdToken || "").trim();

    if (!idToken && !firebaseIdToken) {
      return res.status(400).json({ message: "Google idToken is required" });
    }

    const acceptedAudiences = [googleClientId, firebaseProjectId].filter(Boolean);
    if (acceptedAudiences.length === 0) {
      return res
        .status(500)
        .json({ message: "Google OAuth is not configured" });
    }

    const tokenCandidates = [idToken, firebaseIdToken].filter(Boolean);
    let googleUser = null;

    for (const candidate of tokenCandidates) {
      const googleRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(candidate)}`,
      );

      if (!googleRes.ok) {
        continue;
      }

      const payload = await googleRes.json();
      if (!acceptedAudiences.includes(String(payload?.aud || ""))) {
        continue;
      }

      googleUser = payload;
      break;
    }

    if (!googleUser) {
      return res.status(401).json({ message: "Invalid Google token" });
    }

    const email = String(googleUser.email || "").toLowerCase();
    if (!email || googleUser.email_verified !== "true") {
      return res
        .status(401)
        .json({ message: "Google account is not verified" });
    }

    const googleId = String(googleUser.sub || "").trim();
    const name = String(googleUser.name || "Google User").trim();
    const picture = String(googleUser.picture || "").trim();

    let user = await findUserByEmail(email);
    if (!user) {
      const passwordHash = await bcrypt.hash(randomUUID(), 10);
      user = await createUser({
        name,
        email,
        passwordHash,
        role: "user",
        googleId,
        profileImage: picture,
      });
    } else {
      await mysqlPool.query(
        "UPDATE users SET google_id = ?, profile_image = COALESCE(NULLIF(?, ''), profile_image), name = COALESCE(NULLIF(?, ''), name), updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [googleId || null, picture || null, name || null, user.id],
      );
      user = await findUserById(user.id);
    }

    const token = signAccessToken(user);
    setAuthCookie(res, token);

    await logActivity({
      userId: user.id,
      action: "auth_google_login",
      entityType: "user",
      entityId: String(user.id),
      details: null,
      ipAddress: normalizeIp(getRequestIp(req)),
    });

    return res.json({
      accessToken: token,
      user: sanitizeUserResponse(user),
      permissions: getRolePermissions(user.role),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to sign in with Google" });
  }
});

app.get("/admin/roles", requireStaffRole, async (_req, res) => {
  try {
    const [rows] = await mysqlPool.query(
      "SELECT id, role_name, description, permissions FROM roles ORDER BY id ASC",
    );
    const data = rows.map((role) => ({
      id: role.id,
      roleName: role.role_name,
      description: role.description,
      permissions:
        role.permissions || JSON.stringify(getRolePermissions(role.role_name)),
    }));
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load roles" });
  }
});

app.get("/admin/users", requireRole(["admin", "manager"]), async (req, res) => {
  try {
    if (req.user?.role === "manager") {
      const [rows] = await mysqlPool.query(
        "SELECT id, name, email, role, google_id, profile_image, is_active, created_at, updated_at FROM users WHERE role IN ('editor', 'user') ORDER BY created_at DESC LIMIT 1000",
      );
      return res.json(rows.map((row) => sanitizeUserResponse(row)));
    }

    const [rows] = await mysqlPool.query(
      "SELECT id, name, email, role, google_id, profile_image, is_active, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT 1000",
    );
    return res.json(rows.map((row) => sanitizeUserResponse(row)));
  } catch (error) {
    return res.status(500).json({ message: "Failed to load users" });
  }
});

app.post(
  "/admin/users",
  requireRole(["admin", "manager"]),
  async (req, res) => {
    try {
      const { name, email, password, role } = req.body || {};
      const normalizedEmail = String(email || "")
        .trim()
        .toLowerCase();
      const normalizedRole = normalizeRoleInput(role || "user");

      if (!name || !normalizedEmail || !password || !normalizedRole) {
        return res
          .status(400)
          .json({ message: "Name, email, password and role are required" });
      }
      if (!emailRegex.test(normalizedEmail)) {
        return res.status(400).json({ message: "Invalid email address" });
      }
      if (String(password).length < 8) {
        return res
          .status(400)
          .json({ message: "Password must be at least 8 characters long" });
      }

      if (!canAssignRole(req.user?.role, normalizedRole)) {
        return res
          .status(403)
          .json({ message: "Insufficient permissions for this role" });
      }

      const existing = await findUserByEmail(normalizedEmail);
      if (existing) {
        return res.status(409).json({ message: "Email is already registered" });
      }

      const passwordHash = await bcrypt.hash(String(password), 10);
      const created = await createUser({
        name: String(name).trim(),
        email: normalizedEmail,
        passwordHash,
        role: normalizedRole,
      });

      await logActivity({
        userId: req.user?.id,
        action: "admin_user_create",
        entityType: "user",
        entityId: String(created.id),
        details: JSON.stringify({ role: normalizedRole }),
        ipAddress: normalizeIp(getRequestIp(req)),
      });

      return res.status(201).json(sanitizeUserResponse(created));
    } catch (error) {
      return res.status(500).json({ message: "Failed to create user" });
    }
  },
);

app.patch(
  "/admin/users/:id",
  requireRole(["admin", "manager"]),
  async (req, res) => {
    try {
      const userId = Number(req.params.id);
      if (!Number.isFinite(userId) || userId <= 0) {
        return res.status(400).json({ message: "Invalid user id" });
      }

      const updates = req.body || {};
      const nextName =
        typeof updates.name === "string" ? updates.name.trim() : undefined;
      const nextEmail =
        typeof updates.email === "string"
          ? updates.email.trim().toLowerCase()
          : undefined;
      const nextRole =
        typeof updates.role === "string"
          ? normalizeRoleInput(updates.role)
          : undefined;
      const nextActive = updates.isActive;

      if (nextEmail && !emailRegex.test(nextEmail)) {
        return res.status(400).json({ message: "Invalid email address" });
      }
      if (typeof updates.role === "string" && !nextRole) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const existing = await findUserById(userId);
      if (!existing) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!canManageExistingUser(req.user?.role, existing.role)) {
        return res
          .status(403)
          .json({ message: "Insufficient permissions for this user" });
      }

      if (nextRole && !canAssignRole(req.user?.role, nextRole)) {
        return res
          .status(403)
          .json({ message: "Insufficient permissions for this role" });
      }

      await mysqlPool.query(
        `UPDATE users
       SET name = COALESCE(?, name),
           email = COALESCE(?, email),
           role = COALESCE(?, role),
           is_active = COALESCE(?, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
        [
          nextName || null,
          nextEmail || null,
          nextRole || null,
          typeof nextActive === "boolean" ? (nextActive ? 1 : 0) : null,
          userId,
        ],
      );

      const updated = await findUserById(userId);
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }

      await logActivity({
        userId: req.user?.id,
        action: "admin_user_update",
        entityType: "user",
        entityId: String(userId),
        details: JSON.stringify({
          name: nextName,
          email: nextEmail,
          role: nextRole,
          isActive: nextActive,
        }),
        ipAddress: normalizeIp(getRequestIp(req)),
      });

      return res.json(sanitizeUserResponse(updated));
    } catch (error) {
      return res.status(500).json({ message: "Failed to update user" });
    }
  },
);

app.patch(
  "/admin/users/:id/role",
  requireRole(["admin", "manager"]),
  async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const role = normalizeRoleInput(req.body?.role);
      if (!Number.isFinite(userId) || userId <= 0 || !role) {
        return res
          .status(400)
          .json({ message: "Invalid role assignment request" });
      }

      const existing = await findUserById(userId);
      if (!existing) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!canManageExistingUser(req.user?.role, existing.role)) {
        return res
          .status(403)
          .json({ message: "Insufficient permissions for this user" });
      }

      if (!canAssignRole(req.user?.role, role)) {
        return res
          .status(403)
          .json({ message: "Insufficient permissions for this role" });
      }

      const updated = await updateUserRole({ userId, role });
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }

      await logActivity({
        userId: req.user?.id,
        action: "admin_user_role_update",
        entityType: "user",
        entityId: String(userId),
        details: JSON.stringify({ role }),
        ipAddress: normalizeIp(getRequestIp(req)),
      });

      return res.json(sanitizeUserResponse(updated));
    } catch (error) {
      return res.status(500).json({ message: "Failed to update user role" });
    }
  },
);

app.delete(
  "/admin/users/:id",
  requireRole(["admin", "manager"]),
  async (req, res) => {
    try {
      const userId = Number(req.params.id);
      if (!Number.isFinite(userId) || userId <= 0) {
        return res.status(400).json({ message: "Invalid user id" });
      }

      const existing = await findUserById(userId);
      if (!existing) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!canManageExistingUser(req.user?.role, existing.role)) {
        return res
          .status(403)
          .json({ message: "Insufficient permissions for this user" });
      }

      await mysqlPool.query(
        "UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [userId],
      );

      await logActivity({
        userId: req.user?.id,
        action: "admin_user_deactivate",
        entityType: "user",
        entityId: String(userId),
        details: null,
        ipAddress: normalizeIp(getRequestIp(req)),
      });

      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Failed to deactivate user" });
    }
  },
);

app.get("/admin/content", requireStaffRole, async (req, res) => {
  try {
    const status =
      typeof req.query?.status === "string" ? req.query.status : "";
    const params = [];
    let whereSql = "";
    if (status) {
      whereSql = "WHERE c.status = ?";
      params.push(status);
    }

    const [rows] = await mysqlPool.query(
      `SELECT c.id, c.title, c.description, c.status, c.created_at, c.updated_at,
              c.created_by, u.name AS created_by_name, u.email AS created_by_email
       FROM content c
       LEFT JOIN users u ON u.id = c.created_by
       ${whereSql}
       ORDER BY c.created_at DESC
       LIMIT 1000`,
      params,
    );

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load content" });
  }
});

app.post(
  "/admin/content",
  requireRole(["admin", "manager", "editor"]),
  async (req, res) => {
    try {
      const { title, description, status } = req.body || {};
      if (!title || !description) {
        return res
          .status(400)
          .json({ message: "Title and description are required" });
      }
      const allowedStatus = [
        "draft",
        "pending_review",
        "approved",
        "rejected",
        "archived",
      ];
      const resolvedStatus = allowedStatus.includes(status) ? status : "draft";

      const [result] = await mysqlPool.query(
        "INSERT INTO content (title, description, created_by, status) VALUES (?, ?, ?, ?)",
        [
          String(title).trim(),
          String(description).trim(),
          Number(req.user.id) || null,
          resolvedStatus,
        ],
      );

      const [rows] = await mysqlPool.query(
        "SELECT * FROM content WHERE id = ? LIMIT 1",
        [result.insertId],
      );
      await logActivity({
        userId: req.user?.id,
        action: "content_create",
        entityType: "content",
        entityId: String(result.insertId),
        details: JSON.stringify({ status: resolvedStatus }),
        ipAddress: normalizeIp(getRequestIp(req)),
      });

      return res.status(201).json(rows[0]);
    } catch (error) {
      return res.status(500).json({ message: "Failed to create content" });
    }
  },
);

app.patch(
  "/admin/content/:id",
  requireRole(["admin", "manager", "moderator", "editor"]),
  async (req, res) => {
    try {
      const contentId = Number(req.params.id);
      if (!Number.isFinite(contentId) || contentId <= 0) {
        return res.status(400).json({ message: "Invalid content id" });
      }

      const updates = req.body || {};
      const allowedStatus = [
        "draft",
        "pending_review",
        "approved",
        "rejected",
        "archived",
      ];
      const nextStatus =
        typeof updates.status === "string" &&
        allowedStatus.includes(updates.status)
          ? updates.status
          : null;

      if (req.user.role === "moderator") {
        if (!nextStatus || !["approved", "rejected"].includes(nextStatus)) {
          return res
            .status(403)
            .json({ message: "Moderators can only approve or reject content" });
        }
        await mysqlPool.query(
          "UPDATE content SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
          [nextStatus, contentId],
        );
      } else {
        await mysqlPool.query(
          `UPDATE content
         SET title = COALESCE(?, title),
             description = COALESCE(?, description),
             status = COALESCE(?, status),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
          [
            typeof updates.title === "string" ? updates.title.trim() : null,
            typeof updates.description === "string"
              ? updates.description.trim()
              : null,
            nextStatus,
            contentId,
          ],
        );
      }

      const [rows] = await mysqlPool.query(
        "SELECT * FROM content WHERE id = ? LIMIT 1",
        [contentId],
      );
      if (!rows[0]) {
        return res.status(404).json({ message: "Content not found" });
      }

      await logActivity({
        userId: req.user?.id,
        action: "content_update",
        entityType: "content",
        entityId: String(contentId),
        details: JSON.stringify({ status: nextStatus }),
        ipAddress: normalizeIp(getRequestIp(req)),
      });

      return res.json(rows[0]);
    } catch (error) {
      return res.status(500).json({ message: "Failed to update content" });
    }
  },
);

app.delete("/admin/content/:id", requireRole(["admin"]), async (req, res) => {
  try {
    const contentId = Number(req.params.id);
    if (!Number.isFinite(contentId) || contentId <= 0) {
      return res.status(400).json({ message: "Invalid content id" });
    }
    await mysqlPool.query("DELETE FROM content WHERE id = ?", [contentId]);

    await logActivity({
      userId: req.user?.id,
      action: "content_delete",
      entityType: "content",
      entityId: String(contentId),
      details: null,
      ipAddress: normalizeIp(getRequestIp(req)),
    });

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete content" });
  }
});

app.get(
  "/admin/reports",
  requireRole(["admin", "manager", "moderator"]),
  async (_req, res) => {
    try {
      const [rows] = await mysqlPool.query(
        `SELECT r.id, r.content_id, r.reported_by, r.reason, r.status, r.created_at, r.updated_at,
              c.title AS content_title,
              u.email AS reported_by_email
       FROM reports r
       LEFT JOIN content c ON c.id = r.content_id
       LEFT JOIN users u ON u.id = r.reported_by
       ORDER BY r.created_at DESC
       LIMIT 1000`,
      );
      return res.json(rows);
    } catch (error) {
      return res.status(500).json({ message: "Failed to load reports" });
    }
  },
);

app.post("/admin/reports", authenticateJwt, async (req, res) => {
  try {
    const { contentId, reason } = req.body || {};
    const numericContentId = Number(contentId);
    if (
      !Number.isFinite(numericContentId) ||
      numericContentId <= 0 ||
      !reason
    ) {
      return res
        .status(400)
        .json({ message: "contentId and reason are required" });
    }

    const [result] = await mysqlPool.query(
      "INSERT INTO reports (content_id, reported_by, reason, status) VALUES (?, ?, ?, 'open')",
      [numericContentId, Number(req.user.id) || null, String(reason).trim()],
    );

    return res.status(201).json({ id: result.insertId });
  } catch (error) {
    return res.status(500).json({ message: "Failed to submit report" });
  }
});

app.patch(
  "/admin/reports/:id",
  requireRole(["admin", "manager", "moderator"]),
  async (req, res) => {
    try {
      const reportId = Number(req.params.id);
      const status = String(req.body?.status || "")
        .trim()
        .toLowerCase();
      const resolution = String(req.body?.resolution || "").trim();

      if (!Number.isFinite(reportId) || reportId <= 0) {
        return res.status(400).json({ message: "Invalid report id" });
      }
      if (!["open", "reviewing", "resolved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid report status" });
      }

      await mysqlPool.query(
        "UPDATE reports SET status = ?, resolution = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [status, resolution || null, reportId],
      );

      const [rows] = await mysqlPool.query(
        "SELECT * FROM reports WHERE id = ? LIMIT 1",
        [reportId],
      );
      return res.json(rows[0] || null);
    } catch (error) {
      return res.status(500).json({ message: "Failed to update report" });
    }
  },
);

app.get("/admin/activity-logs", requireRole(["admin"]), async (req, res) => {
  try {
    const limit = Math.min(1000, Math.max(1, Number(req.query.limit || 200)));
    const [rows] = await mysqlPool.query(
      `SELECT a.id, a.action, a.entity_type, a.entity_id, a.details, a.ip_address, a.created_at,
              u.email AS user_email, u.role AS user_role
       FROM activity_logs a
       LEFT JOIN users u ON u.id = a.user_id
       ORDER BY a.created_at DESC
       LIMIT ?`,
      [limit],
    );
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load activity logs" });
  }
});

app.post("/auth/register", csrfProtection, async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email address" });
    }
    if (String(password).length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await createUser({
      name: String(name),
      email: String(email).toLowerCase(),
      passwordHash,
      role: "user",
    });

    const token = signAccessToken(user);
    setAuthCookie(res, token);
    await logActivity({
      userId: user.id,
      action: "auth_register",
      entityType: "user",
      entityId: String(user.id),
      details: null,
      ipAddress: normalizeIp(getRequestIp(req)),
    });

    return res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to register user" });
  }
});

app.post("/auth/login", csrfProtection, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    const user = await findUserByEmail(String(email).toLowerCase());
    if (!user || !user.is_active) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(String(password), user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signAccessToken(user);
    setAuthCookie(res, token);
    await logActivity({
      userId: user.id,
      action: "auth_login",
      entityType: "user",
      entityId: String(user.id),
      details: null,
      ipAddress: normalizeIp(getRequestIp(req)),
    });

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to log in" });
  }
});

app.post("/auth/logout", authenticateJwt, csrfProtection, async (req, res) => {
  try {
    await logActivity({
      userId: req.user?.id,
      action: "auth_logout",
      entityType: "user",
      entityId: String(req.user?.id || ""),
      details: null,
      ipAddress: normalizeIp(getRequestIp(req)),
    });
  } catch {}
  clearAuthCookie(res);
  return res.json({ success: true });
});

<<<<<<< Updated upstream
=======
const getBusinessSettings = async () => {
  let settings = await BusinessSettings.findOne().lean();
  if (!settings) {
    settings = await BusinessSettings.create({
      logoUrl: "",
      openingHours: defaultOpeningHours,
      holidayClosures: [],
    });
  }
  return settings;
};

>>>>>>> Stashed changes
const clampLoyaltyDiscount = (subtotal, discount) => {
  const maxDiscount = Number(subtotal || 0) * 0.5;
  return Math.max(0, Math.min(Number(discount || 0), maxDiscount));
};

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const twilioWhatsAppFrom = process.env.TWILIO_WHATSAPP_FROM || "+14155238886";
const twilioWhatsAppContentSid = process.env.TWILIO_WHATSAPP_CONTENT_SID;

const twilioClient =
  twilioAccountSid && twilioAuthToken
    ? twilio(twilioAccountSid, twilioAuthToken)
    : null;

const toE164 = (phone) => {
  if (!phone || typeof phone !== "string") return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 0) return "";
  if (digits.startsWith("+")) return phone.trim();
  return "+" + digits;
};

const sendSmsNotification = async ({ phone, message }) => {
  if (!phone || !message) return;
  const to = toE164(phone);
  if (!to) return;
  if (!twilioClient || !twilioPhoneNumber) {
    console.log("[sms-placeholder]", { to, message });
    return;
  }
  try {
    await twilioClient.messages.create({
      from: twilioPhoneNumber,
      to,
      body: message,
    });
  } catch (err) {
    console.error("[sms-error]", err.message || err);
  }
};

const sendWhatsAppNotification = async ({
  phone,
  message,
  contentVariables,
}) => {
  if (!phone) return;
  const to = toE164(phone);
  if (!to) return;
  if (!twilioClient) {
    console.log("[whatsapp-placeholder]", { to, message });
    return;
  }
  const from = "whatsapp:" + twilioWhatsAppFrom.replace(/^whatsapp:/i, "");
  const payload = {
    from,
    to: "whatsapp:" + to,
  };
  if (twilioWhatsAppContentSid && contentVariables) {
    payload.contentSid = twilioWhatsAppContentSid;
    payload.contentVariables =
      typeof contentVariables === "string"
        ? contentVariables
        : JSON.stringify(contentVariables);
  } else {
    payload.body = message || "";
  }
  try {
    await twilioClient.messages.create(payload);
  } catch (err) {
    console.error("[whatsapp-error]", err.message || err);
  }
};

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 0);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM;

const mailTransporter =
  smtpHost && smtpPort && smtpUser && smtpPass
    ? nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      })
    : null;

const buildInvoiceNumber = () => {
  const now = new Date();
  const stamp = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `LF-${stamp}-${rand}`;
};

<<<<<<< Updated upstream
=======
const cloverAccessToken = process.env.CLOVER_ACCESS_TOKEN;
const cloverPrivateKey = process.env.CLOVER_PRIVATE_KEY;
const cloverMerchantId = process.env.CLOVER_MERCHANT_ID;
const cloverApiBaseUrl =
  process.env.CLOVER_API_BASE_URL || "https://scl-sandbox.dev.clover.com";
const cloverDefaultCurrency = (
  process.env.CLOVER_DEFAULT_CURRENCY || "gbp"
).toLowerCase();

>>>>>>> Stashed changes
const createPaymentRecord = async ({
  userId,
  transactionId,
  amount,
  paymentMethod,
  status,
  metadata,
}) => {
  await mysqlPool.query(
    "INSERT INTO payments (user_id, transaction_id, amount, payment_method, status, metadata) VALUES (?, ?, ?, ?, ?, ?)",
    [
      userId || null,
      transactionId,
      amount,
      paymentMethod,
      status,
      metadata ? JSON.stringify(metadata) : null,
    ],
  );
};

const upsertPaymentRecord = async ({
  userId,
  transactionId,
  amount,
  paymentMethod,
  status,
  metadata,
}) => {
  await mysqlPool.query(
    `INSERT INTO payments (user_id, transaction_id, amount, payment_method, status, metadata)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       status = VALUES(status),
       amount = VALUES(amount),
       payment_method = VALUES(payment_method),
       metadata = JSON_MERGE_PATCH(COALESCE(metadata, JSON_OBJECT()), VALUES(metadata)),
       updated_at = CURRENT_TIMESTAMP`,
    [
      userId || null,
      transactionId,
      amount,
      paymentMethod,
      status,
      metadata ? JSON.stringify(metadata) : null,
    ],
  );
};

const setAuthCookie = (res, token) => {
  res.cookie("access_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const clearAuthCookie = (res) => {
  res.clearCookie("access_token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
};

const buildReceiptHtml = (order) => {
  const itemsHtml = order.items
    .map(
      (item) =>
        `<tr><td>${item.quantity}× ${item.menuItem?.name || "Item"}</td><td>£${Number(item.totalPrice || 0).toFixed(2)}</td></tr>`,
    )
    .join("");
  return `
    <h2>Lebanese Flames Receipt</h2>
    <p>Invoice: ${order.invoiceNumber}</p>
    <p>Order: ${order._id.toString()}</p>
    <table cellpadding="6" cellspacing="0" border="1">
      <thead><tr><th>Item</th><th>Total</th></tr></thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    <p>Subtotal: £${Number(order.subtotal || 0).toFixed(2)}</p>
    <p>Delivery: £${Number(order.deliveryFee || 0).toFixed(2)}</p>
    <p>Loyalty discount: -£${Number(order.loyaltyDiscount || 0).toFixed(2)}</p>
    <p>Promo discount: -£${Number(order.promoDiscount || 0).toFixed(2)}</p>
    <p><strong>Total: £${Number(order.total || 0).toFixed(2)}</strong></p>
    <p>Payment: ${order.paymentMethod} (${order.paymentStatus})</p>
  `;
};

const resolveCustomerOrderCount = async ({ userId, email }) => {
  if (userId) {
    return Order.countDocuments({ userId });
  }
  if (email) {
    return Order.countDocuments({ email });
  }
  return 0;
};

const validatePromotion = async ({ code, subtotal, userId, email }) => {
  if (!code) {
    return { isValid: false, message: "Promo code is required" };
  }

  const promo = await Promotion.findOne({
    code: code.trim().toUpperCase(),
  }).lean();
  if (!promo || !promo.active) {
    return { isValid: false, message: "Promo code is not active" };
  }

  const now = new Date();
  if (promo.startsAt && now < new Date(promo.startsAt)) {
    return { isValid: false, message: "Promo code is not active yet" };
  }
  if (promo.endsAt && now > new Date(promo.endsAt)) {
    return { isValid: false, message: "Promo code has expired" };
  }

  const normalizedSubtotal = Number(subtotal || 0);
  if (normalizedSubtotal < Number(promo.minSubtotal || 0)) {
    return { isValid: false, message: "Order does not meet promo minimum" };
  }

  const orderCount = await resolveCustomerOrderCount({ userId, email });
  if (promo.firstOrderOnly && orderCount > 0) {
    return { isValid: false, message: "Promo code is only for first orders" };
  }

  if (promo.minCompletedOrders && userId) {
    const profile = await UserProfile.findOne({ uid: userId }).lean();
    const completedOrders = profile?.completedOrders || 0;
    if (completedOrders < promo.minCompletedOrders) {
      return {
        isValid: false,
        message: "Promo code is only for loyal customers",
      };
    }
  }

  let discount = 0;
  if (promo.discountType === "percent") {
    discount = (normalizedSubtotal * Number(promo.value || 0)) / 100;
  } else {
    discount = Number(promo.value || 0);
  }

  if (promo.maxDiscount) {
    discount = Math.min(discount, Number(promo.maxDiscount));
  }

  discount = Math.max(0, Number(discount.toFixed(2)));

  return {
    isValid: discount > 0,
    promo,
    discount,
  };
};

const sendReceiptEmail = async (order) => {
  if (!mailTransporter || !smtpFrom) {
    console.log("[email-placeholder] Receipt email not configured");
    return false;
  }

  await mailTransporter.sendMail({
    from: smtpFrom,
    to: order.email,
    subject: `Lebanese Flames receipt ${order.invoiceNumber}`,
    html: buildReceiptHtml(order),
  });

  return true;
};

app.get("/menu", async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category
      ? { category, isAvailable: true }
      : { isAvailable: true };
    const items = await MenuItem.find(filter)
      .sort({ category: 1, name: 1 })
      .lean();
    res.json(items.map(serializeMenuItem));
  } catch (error) {
    res.status(500).json({ message: "Failed to load menu items" });
  }
});

app.get("/categories", async (_req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();
    res.json(categories.map(serializeCategory));
  } catch (error) {
    res.status(500).json({ message: "Failed to load categories" });
  }
});

app.get("/categories/all", requireAdmin, async (_req, res) => {
  try {
    const categories = await Category.find({})
      .sort({ sortOrder: 1, name: 1 })
      .lean();
    res.json(categories.map(serializeCategory));
  } catch (error) {
    res.status(500).json({ message: "Failed to load categories" });
  }
});

app.post("/categories", requireAdmin, async (req, res) => {
  try {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const icon =
      typeof req.body?.icon === "string" ? req.body.icon.trim() : "🍽️";
    const sortOrder = Number(req.body?.sortOrder ?? 0);
    const providedSlug =
      typeof req.body?.slug === "string" ? req.body.slug : "";
    const slug = toSlug(providedSlug || name);

    if (!name || !slug) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const existing = await Category.findOne({ slug }).lean();
    if (existing) {
      return res.status(409).json({ message: "Category slug already exists" });
    }

    const category = await Category.create({
      name,
      slug,
      icon,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      isActive: req.body?.isActive !== false,
    });

    res.status(201).json(serializeCategory(category.toObject()));
  } catch (error) {
    res.status(400).json({ message: "Failed to create category" });
  }
});

app.patch("/categories/:id", requireAdmin, async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.id });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const oldSlug = category.slug;
    if (typeof req.body?.name === "string")
      category.name = req.body.name.trim();
    if (typeof req.body?.icon === "string")
      category.icon = req.body.icon.trim() || "🍽️";
    if (typeof req.body?.sortOrder !== "undefined") {
      const sortOrder = Number(req.body.sortOrder);
      category.sortOrder = Number.isFinite(sortOrder)
        ? sortOrder
        : category.sortOrder;
    }
    if (typeof req.body?.isActive !== "undefined")
      category.isActive = Boolean(req.body.isActive);
    if (typeof req.body?.slug === "string") {
      const nextSlug = toSlug(req.body.slug || category.name);
      if (!nextSlug) {
        return res.status(400).json({ message: "Invalid category slug" });
      }
      const existing = await Category.findOne({
        slug: nextSlug,
        _id: { $ne: category._id },
      }).lean();
      if (existing) {
        return res
          .status(409)
          .json({ message: "Category slug already exists" });
      }
      category.slug = nextSlug;
    }

    await category.save();

    if (oldSlug !== category.slug) {
      await MenuItem.updateMany(
        { category: oldSlug },
        { $set: { category: category.slug } },
      );
    }

    res.json(serializeCategory(category.toObject()));
  } catch (error) {
    res.status(400).json({ message: "Failed to update category" });
  }
});

app.delete("/categories/:id", requireAdmin, async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.id }).lean();
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const linkedCount = await MenuItem.countDocuments({
      category: category.slug,
    });
    if (linkedCount > 0) {
      return res.status(409).json({
        message:
          "Cannot delete category with menu items. Reassign or remove items first.",
      });
    }

    await Category.deleteOne({ slug: req.params.id });
    return res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: "Failed to delete category" });
  }
});

app.get("/menu/all", requireAdmin, async (_req, res) => {
  try {
    const items = await MenuItem.find({}).sort({ category: 1, name: 1 }).lean();
    res.json(items.map(serializeMenuItem));
  } catch (error) {
    res.status(500).json({ message: "Failed to load menu items" });
  }
});

app.post("/menu", requireAdmin, async (req, res) => {
  try {
    const category =
      typeof req.body?.category === "string" ? req.body.category.trim() : "";
    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }
    const categoryExists = await Category.findOne({
      slug: category,
      isActive: true,
    }).lean();
    if (!categoryExists) {
      return res.status(400).json({ message: "Invalid category" });
    }
    const menuItem = await MenuItem.create(req.body);
    res.status(201).json(menuItem.toJSON());
  } catch (error) {
    res.status(400).json({ message: "Failed to create menu item" });
  }
});

app.put("/menu/:id", requireAdmin, async (req, res) => {
  try {
    if (typeof req.body?.category === "string") {
      const categoryExists = await Category.findOne({
        slug: req.body.category.trim(),
        isActive: true,
      }).lean();
      if (!categoryExists) {
        return res.status(400).json({ message: "Invalid category" });
      }
    }
    const menuItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(menuItem ? menuItem.toJSON() : null);
  } catch (error) {
    res.status(400).json({ message: "Failed to update menu item" });
  }
});

app.patch("/menu/:id", requireAdmin, async (req, res) => {
  try {
    if (typeof req.body?.category === "string") {
      const categoryExists = await Category.findOne({
        slug: req.body.category.trim(),
        isActive: true,
      }).lean();
      if (!categoryExists) {
        return res.status(400).json({ message: "Invalid category" });
      }
    }
    const menuItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(menuItem ? menuItem.toJSON() : null);
  } catch (error) {
    res.status(400).json({ message: "Failed to update menu item" });
  }
});

app.delete("/menu/:id", requireAdmin, async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    return res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: "Failed to delete menu item" });
  }
});

app.post(
  "/menu/upload",
  requireAdmin,
  upload.single("image"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    try {
      const filename = await processAndStoreMenuImage(req.file.buffer);
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const url = `${baseUrl}/uploads/${filename}`;
      return res.status(201).json({ url });
    } catch (error) {
      return res.status(500).json({ message: "Failed to process image" });
    }
  },
);

app.post("/payments/request", async (req, res) => {
  try {
    const { userId, amount, paymentMethod, currency, metadata } =
      req.body || {};
    const resolvedMethod = String(paymentMethod || "")
      .trim()
      .toLowerCase();
    const supportedMethods = ["bkash", "nagad", "stripe"];
    const resolvedAmount = Number(amount || 0);

    if (!supportedMethods.includes(resolvedMethod)) {
      return res.status(400).json({ message: "Unsupported payment method" });
    }
    if (!Number.isFinite(resolvedAmount) || resolvedAmount <= 0) {
      return res.status(400).json({ message: "Valid amount is required" });
    }

    const transactionId = `txn_${randomUUID().replace(/-/g, "")}`;
    await createPaymentRecord({
      userId: Number.isFinite(Number(userId)) ? Number(userId) : null,
      transactionId,
      amount: resolvedAmount,
      paymentMethod: resolvedMethod,
      status: "pending",
      metadata: {
        currency: String(currency || "BDT").toUpperCase(),
        providerStatus: "created",
        ...(metadata && typeof metadata === "object" ? metadata : {}),
      },
    });

    return res.status(201).json({
      transactionId,
      status: "pending",
      paymentMethod: resolvedMethod,
      redirectUrl: `/payments/${resolvedMethod}/checkout?transactionId=${transactionId}`,
      futureReady: resolvedMethod === "stripe",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to create payment request" });
  }
});

app.post("/payments/verify", async (req, res) => {
  try {
    const { transactionId, status, verificationData } = req.body || {};
    const resolvedStatus = String(status || "")
      .trim()
      .toLowerCase();
    if (
      !transactionId ||
      !["success", "failed", "pending"].includes(resolvedStatus)
    ) {
      return res.status(400).json({ message: "Invalid verification payload" });
    }

    const [rows] = await mysqlPool.query(
      "SELECT id, metadata FROM payments WHERE transaction_id = ? LIMIT 1",
      [transactionId],
    );
    if (!rows[0]) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    let existingMetadata = {};
    try {
      existingMetadata = rows[0].metadata ? JSON.parse(rows[0].metadata) : {};
    } catch {
      existingMetadata = {};
    }

    await mysqlPool.query(
      "UPDATE payments SET status = ?, metadata = ?, updated_at = CURRENT_TIMESTAMP WHERE transaction_id = ?",
      [
        resolvedStatus,
        JSON.stringify({
          ...existingMetadata,
          providerStatus: resolvedStatus,
          verificationData: verificationData || null,
        }),
        transactionId,
      ],
    );

    return res.json({ transactionId, status: resolvedStatus });
  } catch (error) {
    return res.status(500).json({ message: "Failed to verify payment" });
  }
});

app.post("/payments/callback/:method", async (req, res) => {
  try {
    const method = String(req.params.method || "")
      .trim()
      .toLowerCase();
    const { transaction_id, status, payload } = req.body || {};
    const transactionId = String(transaction_id || "").trim();
    const normalizedStatus = String(status || "pending")
      .trim()
      .toLowerCase();

    if (!["bkash", "nagad", "stripe"].includes(method)) {
      return res.status(400).json({ message: "Unsupported callback method" });
    }
    if (!transactionId) {
      return res.status(400).json({ message: "transaction_id is required" });
    }

    const resolvedStatus = ["success", "failed", "pending"].includes(
      normalizedStatus,
    )
      ? normalizedStatus
      : "pending";

    await mysqlPool.query(
      "UPDATE payments SET status = ?, metadata = JSON_MERGE_PATCH(COALESCE(metadata, JSON_OBJECT()), ?), updated_at = CURRENT_TIMESTAMP WHERE transaction_id = ?",
      [
        resolvedStatus,
        JSON.stringify({
          callbackMethod: method,
          callbackPayload: payload || req.body || null,
          callbackAt: new Date().toISOString(),
        }),
        transactionId,
      ],
    );

    return res.json({ received: true, transactionId, status: resolvedStatus });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to process payment callback" });
  }
});

app.post("/payments/intent", async (req, res) => {
  const paymentSettings = await getResolvedPaymentSettings();
  const stripe = buildStripeClient(paymentSettings.stripeSecretKey);

  if (!stripe) {
    return res.status(500).json({ message: "Stripe is not configured" });
  }

  try {
    const {
      email,
      userId,
      items,
      deliveryFee,
      loyaltyDiscount,
      promoCode,
      total,
    } = req.body || {};
    let promoDiscount = 0;
    let resolvedPromoCode = "";

    if (promoCode) {
      const promoResult = await validatePromotion({
        code: promoCode,
        subtotal: items?.reduce(
          (sum, item) => sum + (Number(item?.totalPrice) || 0),
          0,
        ),
        userId,
        email,
      });
      if (!promoResult.isValid) {
        return res
          .status(400)
          .json({ message: promoResult.message || "Invalid promo code" });
      }
      promoDiscount = promoResult.discount;
      resolvedPromoCode = promoResult.promo.code;
    }

    const calculatedTotal = calculateOrderTotal(
      items,
      deliveryFee,
      loyaltyDiscount,
      promoDiscount,
    );
    const expected = Number(total || 0);

    if (
      !items?.length ||
      calculatedTotal <= 0 ||
      Math.abs(calculatedTotal - expected) > 0.01
    ) {
      return res.status(400).json({ message: "Invalid order total" });
    }

    const amount = Math.round(calculatedTotal * 100);
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "gbp",
      receipt_email: email,
      automatic_payment_methods: { enabled: true },
      metadata: {
        orderSource: "lebanese-flames-ui",
        promoCode: resolvedPromoCode || undefined,
      },
    });

    return res.status(201).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      promoDiscount,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create payment intent" });
  }
});

app.post("/payments/clover/charge", async (req, res) => {
  try {
    const paymentSettings = await getResolvedPaymentSettings();
    if (!paymentSettings.cloverAccessToken) {
      return res
        .status(500)
        .json({ message: "Clover is not configured on the server" });
    }

    const {
      source,
      amount,
      currency,
      email,
      userId,
      items,
      deliveryFee,
      loyaltyDiscount,
      promoCode,
      total,
    } = req.body || {};
    const numericAmount = Number(amount || 0);
    let promoDiscount = 0;

    if (promoCode) {
      const promoResult = await validatePromotion({
        code: promoCode,
        subtotal: items?.reduce(
          (sum, item) => sum + (Number(item?.totalPrice) || 0),
          0,
        ),
        userId,
        email,
      });
      if (!promoResult.isValid) {
        return res
          .status(400)
          .json({ message: promoResult.message || "Invalid promo code" });
      }
      promoDiscount = promoResult.discount;
    }

    const calculatedTotal = calculateOrderTotal(
      items,
      deliveryFee,
      loyaltyDiscount,
      promoDiscount,
    );
    const expected = Number(total || numericAmount || 0);

    if (!source || typeof source !== "string") {
      return res
        .status(400)
        .json({ message: "Clover source token is required" });
    }
    if (
      !items?.length ||
      !Number.isFinite(calculatedTotal) ||
      calculatedTotal <= 0 ||
      Math.abs(calculatedTotal - expected) > 0.01
    ) {
      return res.status(400).json({ message: "Invalid order total" });
    }
    if (!Number.isFinite(numericAmount) && !Number.isFinite(calculatedTotal)) {
      return res.status(400).json({ message: "Valid amount is required" });
    }

    const resolvedAmount =
      calculatedTotal > 0 ? calculatedTotal : numericAmount;
    const minorUnits = Math.round(resolvedAmount * 100);
    const resolvedCurrency = (
      currency ||
      paymentSettings.cloverDefaultCurrency ||
      "gbp"
    ).toLowerCase();
    const clientIp = normalizeIp(getRequestIp(req));

    const response = await fetch(`${paymentSettings.cloverApiBaseUrl}/v1/charges`, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${paymentSettings.cloverAccessToken}`,
        "content-type": "application/json",
        "x-forwarded-for": clientIp,
      },
      body: JSON.stringify({
        amount: minorUnits,
        currency: resolvedCurrency,
        source,
      }),
    });

    const text = await response.text();
    if (!response.ok) {
      let payload;
      try {
        payload = JSON.parse(text);
      } catch {
        payload = null;
      }
      return res.status(400).json({
        message: payload?.message || "Clover charge failed",
      });
    }

    let charge;
    try {
      charge = JSON.parse(text);
    } catch {
      charge = { id: undefined, status: "unknown" };
    }

    const transactionId = charge.id || source;
    const cloverStatus = String(charge.status || "succeeded").toLowerCase();
    const normalizedStatus =
      cloverStatus === "succeeded" || cloverStatus === "paid"
        ? "success"
        : cloverStatus === "pending"
          ? "pending"
          : "failed";

    await createPaymentRecord({
      userId: Number.isFinite(Number(userId)) ? Number(userId) : null,
      transactionId,
      amount: resolvedAmount,
      paymentMethod: "clover",
      status: normalizedStatus,
      metadata: {
        cloverStatus,
        email,
      },
    });

    await logActivity({
      userId: Number.isFinite(Number(userId)) ? Number(userId) : null,
      action: "payment_clover_charge",
      entityType: "payment",
      entityId: transactionId,
      details: JSON.stringify({
        amount: resolvedAmount,
        currency: resolvedCurrency,
      }),
      ipAddress: clientIp,
    });

    return res.status(201).json({
      transactionId,
      status: normalizedStatus,
      promoDiscount,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to process Clover payment" });
  }
});

app.post("/payments/clover/hosted-checkout", async (req, res) => {
  try {
<<<<<<< Updated upstream
    const paymentSettings = await getResolvedPaymentSettings();

    if (!paymentSettings.cloverPrivateKey || !paymentSettings.cloverMerchantId) {
=======
    if (!cloverPrivateKey || !cloverMerchantId) {
>>>>>>> Stashed changes
      return res
        .status(500)
        .json({ message: "Clover hosted checkout is not configured on the server" });
    }

    const { items, email, total, returnUrl } = req.body || {};

<<<<<<< Updated upstream
    if (!items?.length || !Number.isFinite(Number(total)) || Number(total) <= 0) {
      return res.status(400).json({ message: "Invalid order items or total" });
    }

    const safeReturnUrl =
      typeof returnUrl === "string" && returnUrl.startsWith("http")
        ? returnUrl
        : undefined;

    const lineItems = items.map((item) => {
      const qty = Math.max(1, Number(item?.quantity) || 1);
      return {
        name: String(item?.name || item?.menuItem?.name || "Item"),
        unitQty: qty,
        price: Math.round((Number(item?.totalPrice || 0) / qty) * 100),
      };
    });

    const checkoutBody = {
      customer: email ? { email } : undefined,
      shoppingCart: { lineItems },
      redirectUrls: safeReturnUrl
        ? { success: safeReturnUrl, failure: safeReturnUrl }
        : undefined,
    };

    const clientIp = normalizeIp(getRequestIp(req));
    const response = await fetch(
      `${paymentSettings.cloverApiBaseUrl}/invoicingcheckoutservice/v1/checkouts`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          authorization: `Bearer ${paymentSettings.cloverPrivateKey}`,
          "x-clover-merchant-id": paymentSettings.cloverMerchantId,
          "content-type": "application/json",
          "x-forwarded-for": clientIp,
        },
        body: JSON.stringify(checkoutBody),
      }
    );

    const text = await response.text();
    if (!response.ok) {
=======
    if (!items?.length) {
      return res.status(400).json({ message: "Cart items are required" });
    }
    const numericTotal = Number(total || 0);
    if (!Number.isFinite(numericTotal) || numericTotal <= 0) {
      return res.status(400).json({ message: "Valid total is required" });
    }
    if (!returnUrl || typeof returnUrl !== "string") {
      return res.status(400).json({ message: "Return URL is required" });
    }

    const lineItems = items.map((item) => ({
      name: item.menuItem?.name || item.name || "Item",
      unitQty: item.quantity || 1,
      price: Math.round((Number(item.totalPrice) || 0) * 100),
    }));

    const checkoutBody = {
      customer: { email: email || undefined },
      shoppingCart: {
        lineItems,
        total: Math.round(numericTotal * 100),
        currency: cloverDefaultCurrency.toUpperCase(),
      },
      redirectUrls: {
        success: returnUrl,
        failure: returnUrl,
        cancel: returnUrl,
      },
    };

    const cloverResponse = await fetch(
      `${cloverApiBaseUrl}/invoicingcheckoutservice/v1/checkouts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${cloverPrivateKey}`,
          "X-Clover-Merchant-Id": cloverMerchantId,
        },
        body: JSON.stringify(checkoutBody),
      },
    );

    const text = await cloverResponse.text();
    if (!cloverResponse.ok) {
>>>>>>> Stashed changes
      let payload;
      try {
        payload = JSON.parse(text);
      } catch {
        payload = null;
      }
      return res.status(400).json({
<<<<<<< Updated upstream
        message: payload?.message || "Clover hosted checkout creation failed",
=======
        message: payload?.message || "Failed to create Clover checkout session",
>>>>>>> Stashed changes
      });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(500).json({ message: "Invalid response from Clover" });
    }

    const checkoutUrl = data.href;
    const sessionId = data.checkoutSessionId;

<<<<<<< Updated upstream
    if (!checkoutUrl || !sessionId) {
      return res.status(500).json({ message: "Clover did not return a valid checkout session" });
    }

    await createPaymentRecord({
      userId: null,
      transactionId: sessionId,
      amount: Number(total),
      paymentMethod: "clover_hosted",
      status: "pending",
      metadata: { sessionId, email },
=======
    if (!checkoutUrl) {
      return res.status(500).json({ message: "No checkout URL returned from Clover" });
    }

    const clientIp = normalizeIp(getRequestIp(req));

    await createPaymentRecord({
      userId: null,
      transactionId: sessionId || "pending",
      amount: numericTotal,
      paymentMethod: "clover",
      status: "pending",
      metadata: { email, checkoutSessionId: sessionId, type: "hosted_checkout" },
>>>>>>> Stashed changes
    });

    await logActivity({
      userId: null,
<<<<<<< Updated upstream
      action: "payment_clover_hosted_checkout_created",
      entityType: "payment",
      entityId: sessionId,
      details: JSON.stringify({ total, email }),
=======
      action: "payment_clover_hosted_checkout",
      entityType: "payment",
      entityId: sessionId,
      details: JSON.stringify({ amount: numericTotal, email }),
>>>>>>> Stashed changes
      ipAddress: clientIp,
    });

    return res.status(201).json({ checkoutUrl, sessionId });
  } catch (error) {
<<<<<<< Updated upstream
    console.error("Clover hosted checkout error:", error);
    return res
      .status(500)
      .json({ message: "Failed to create Clover hosted checkout" });
=======
    return res
      .status(500)
      .json({ message: "Failed to create Clover checkout session" });
>>>>>>> Stashed changes
  }
});

app.get("/orders", async (req, res) => {
  try {
    const { userId } = req.query;
    const filter = userId ? { userId } : {};
    const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();
    res.json(orders.map(serializeOrder));
  } catch (error) {
    res.status(500).json({ message: "Failed to load orders" });
  }
});

app.get("/admin/orders", requireAdmin, async (_req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 }).lean();
    res.json(orders.map(serializeOrder));
  } catch (error) {
    res.status(500).json({ message: "Failed to load admin orders" });
  }
});

app.get("/orders/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(serializeOrder(order));
  } catch (error) {
    res.status(400).json({ message: "Failed to load order" });
  }
});

app.post("/orders", async (req, res) => {
  try {
    const {
      userId,
      email,
      deliveryMode,
      address,
      items,
      subtotal,
      deliveryFee,
      loyaltyDiscount,
      promoCode,
      paymentMethod,
      paymentIntentId,
      paymentStatus,
      notes,
    } = req.body;

    if (!email || !deliveryMode || !items?.length || !paymentMethod) {
      return res.status(400).json({ message: "Missing required order fields" });
    }

    const orderItems = items.map((item) => ({
      menuItem: item.menuItem,
      quantity: item.quantity || 1,
      customizations: item.customizations || [],
      totalPrice: item.totalPrice || 0,
    }));

    let rewardApplied = false;
    let sanitizedLoyaltyDiscount = Number(loyaltyDiscount || 0);
    let promoDiscount = 0;
    let resolvedPromoCode = "";

    if (userId) {
      const profile = await UserProfile.findOne({ uid: userId });
      if (sanitizedLoyaltyDiscount > 0) {
        if (!profile?.loyaltyRewardAvailable) {
          return res
            .status(400)
            .json({ message: "Loyalty reward is not available" });
        }
        sanitizedLoyaltyDiscount = clampLoyaltyDiscount(
          subtotal,
          sanitizedLoyaltyDiscount,
        );
        rewardApplied = sanitizedLoyaltyDiscount > 0;
      }

      if (rewardApplied) {
        await UserProfile.findOneAndUpdate(
          { uid: userId },
          { loyaltyRewardAvailable: false, loyaltyStamps: 0 },
        );
      }
    } else if (sanitizedLoyaltyDiscount > 0) {
      return res
        .status(400)
        .json({ message: "Loyalty reward requires an account" });
    }

    if (promoCode) {
      const promoResult = await validatePromotion({
        code: promoCode,
        subtotal,
        userId,
        email,
      });
      if (!promoResult.isValid) {
        return res
          .status(400)
          .json({ message: promoResult.message || "Invalid promo code" });
      }
      promoDiscount = promoResult.discount;
      resolvedPromoCode = promoResult.promo.code;
    }

    const recalculatedTotal = calculateOrderTotal(
      orderItems,
      deliveryFee,
      sanitizedLoyaltyDiscount,
      promoDiscount,
    );

    const currentSettings = await getBusinessSettings();
    const cashbackEarned = Math.max(
      0,
      Number(
        currentSettings?.offerPopup?.enabled
          ? currentSettings?.offerPopup?.cashbackAmount
          : 0,
      ) || 0,
    );

    const order = await Order.create({
      userId,
      email,
      deliveryMode,
      address: deliveryMode === "delivery" ? address : undefined,
      items: orderItems,
      subtotal,
      deliveryFee,
      loyaltyDiscount: sanitizedLoyaltyDiscount,
      cashbackEarned,
      total: recalculatedTotal,
      paymentMethod,
      paymentStatus:
        paymentStatus ||
        (paymentMethod === "cash" ? "cash_on_collection" : "pending"),
      notes,
      loyaltyRewardApplied: rewardApplied,
      invoiceNumber: buildInvoiceNumber(),
      promoCode: resolvedPromoCode,
      promoDiscount,
      paymentIntentId,
    });

    const contactPhone = order.address?.phone;
    if (contactPhone) {
      sendSmsNotification({
        phone: contactPhone,
        message: `Thanks for your order! Order #${order._id.toString().slice(-6)} received.`,
      });
      sendWhatsAppNotification({
        phone: contactPhone,
        message: `Thanks for your order! Order #${order._id.toString().slice(-6)} received.`,
      });
    }

    const receiptSent = await sendReceiptEmail(order);
    if (receiptSent) {
      await Order.findByIdAndUpdate(order._id, { receiptEmailSent: true });
      order.receiptEmailSent = true;
    }

    if (paymentMethod === "card" && paymentIntentId) {
      const transactionId = String(paymentIntentId);
      const normalizedPaymentMethod = transactionId.startsWith("pi_")
        ? "stripe"
        : "clover";
      const normalizedPaymentStatus =
        order.paymentStatus === "paid" ? "success" : "pending";

      await upsertPaymentRecord({
        userId: Number.isFinite(Number(userId)) ? Number(userId) : null,
        transactionId,
        amount: Number(order.total || recalculatedTotal || 0),
        paymentMethod: normalizedPaymentMethod,
        status: normalizedPaymentStatus,
        metadata: {
          orderId: order._id.toString(),
          orderEmail: order.email,
          source: "order_create",
        },
      });
    }

    res.status(201).json(serializeOrder(order.toJSON()));
  } catch (error) {
    res.status(400).json({ message: "Failed to create order" });
  }
});

app.patch("/orders/:id/status", requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const previousStatus = normalizeOrderStatus(order.status);
    const normalizedStatus = normalizeOrderStatus(status);
    order.status = normalizedStatus;
    await order.save();

    const contactPhone = order.address?.phone;
    if (contactPhone) {
      sendSmsNotification({
        phone: contactPhone,
        message: `Order #${order._id.toString().slice(-6)} is now ${normalizedStatus}.`,
      });
      sendWhatsAppNotification({
        phone: contactPhone,
        message: `Order #${order._id.toString().slice(-6)} is now ${normalizedStatus}.`,
      });
    }

    if (
      normalizedStatus === "Delivered" &&
      previousStatus !== "Delivered" &&
      order.userId
    ) {
      const profile = await UserProfile.findOne({ uid: order.userId });
      if (profile) {
        const nextStamps = (profile.loyaltyStamps || 0) + 1;
        const rewardAvailable = nextStamps >= 5;
        const earnedPoints = Math.max(0, Math.floor(Number(order.total || 0)));
        await UserProfile.findOneAndUpdate(
          { uid: order.userId },
          {
            completedOrders: (profile.completedOrders || 0) + 1,
            loyaltyStamps: rewardAvailable ? 5 : nextStamps,
            loyaltyRewardAvailable: rewardAvailable,
            rewardPoints: (profile.rewardPoints || 0) + earnedPoints,
          },
        );
      }
    }

    if (normalizedStatus === "Delivered" && previousStatus !== "Delivered") {
      const followUpPhone = order.address?.phone;
      if (followUpPhone) {
        sendSmsNotification({
          phone: followUpPhone,
          message:
            "Thanks for ordering with Lebanese Flames! We hope you loved it.",
        });
        sendWhatsAppNotification({
          phone: followUpPhone,
          message:
            "Thanks for ordering with Lebanese Flames! We hope you loved it.",
        });
      }
    }

    return res.json(serializeOrder(order.toJSON()));
  } catch (error) {
    return res.status(400).json({ message: "Failed to update order status" });
  }
});

app.post("/support/contact", async (req, res) => {
  try {
    const { name, email, phone, orderId, message } = req.body || {};
    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ message: "Name, email, and message are required" });
    }

    const record = await SupportMessage.create({
      name,
      email,
      phone,
      orderId,
      message,
      source: "contact_form",
    });

    if (phone) {
      sendSmsNotification({
        phone,
        message: "Thanks for your message. We will reply shortly.",
      });
      sendWhatsAppNotification({
        phone,
        message: "Thanks for your message. We will reply shortly.",
      });
    }

    return res.status(201).json({ id: record._id?.toString() });
  } catch (error) {
    return res.status(400).json({ message: "Failed to submit message" });
  }
});

app.post("/marketing/abandoned-cart", async (req, res) => {
  try {
    const {
      email,
      phone,
      items,
      subtotal,
      deliveryFee,
      total,
      source,
      promoLink,
    } = req.body || {};
    if (!email && !phone) {
      return res.status(400).json({ message: "Email or phone is required" });
    }

    const record = await AbandonedCart.create({
      email,
      phone,
      items: Array.isArray(items)
        ? items.map((item) => ({
            name: item?.menuItem?.name || item?.name || "Item",
            quantity: Number(item?.quantity || 1),
            totalPrice: Number(item?.totalPrice || 0),
          }))
        : [],
      subtotal: Number(subtotal || 0),
      deliveryFee: Number(deliveryFee || 0),
      total: Number(total || 0),
      source: source || "checkout",
      promoLink: promoLink || "",
    });

    if (phone) {
      const linkText = promoLink ? ` Complete here: ${promoLink}` : "";
      sendSmsNotification({
        phone,
        message: `Your cart is waiting! Complete your Lebanese Flames order anytime.${linkText}`,
      });
      sendWhatsAppNotification({
        phone,
        message: `Your cart is waiting! Complete your Lebanese Flames order anytime.${linkText}`,
      });
    }

    res.status(201).json({ id: record._id?.toString() });
  } catch (error) {
    res.status(400).json({ message: "Failed to capture abandoned cart" });
  }
});

app.get("/settings/business", async (_req, res) => {
  try {
    const settings = await getBusinessSettings();
    res.json(toPublicBusinessSettings(settings));
  } catch (error) {
    res.status(500).json({ message: "Failed to load business settings" });
  }
});

app.get("/settings/business/admin", requireAdmin, async (_req, res) => {
  try {
    const settings = await getBusinessSettings();
    res.json(toAdminBusinessSettings(settings));
  } catch (error) {
    res.status(500).json({ message: "Failed to load business settings" });
  }
});

app.put("/settings/business", requireAdmin, async (req, res) => {
  try {
<<<<<<< Updated upstream
    const {
      businessName,
      logoUrl,
      openingHours,
      holidayClosures,
      paymentSettings,
      aboutChef,
      contactInfo,
      offerPopup,
    } = req.body || {};
    const settings = await getBusinessSettings();
    const normalizedBusinessName =
      typeof businessName === "string"
        ? businessName.trim()
        : settings.businessName || "Lebanese Flames";
    const normalizedLogoUrl =
      typeof logoUrl === "string" ? logoUrl.trim() : settings.logoUrl || "";

    if (!normalizedBusinessName || normalizedBusinessName.length > 80) {
      return res.status(400).json({
        message: "businessName is required and must be 80 characters or less",
      });
    }

    if (
      normalizedLogoUrl &&
      !/^https?:\/\//i.test(normalizedLogoUrl) &&
      !normalizedLogoUrl.startsWith("/uploads/") &&
      !normalizedLogoUrl.startsWith("uploads/")
    ) {
      return res.status(400).json({
        message:
          "logoUrl must be an absolute URL or an uploads path",
      });
    }

    const normalizedPaymentSettings = normalizePaymentSettingsInput(
      paymentSettings,
      settings.paymentSettings,
    );
    const paymentIssues = validatePaymentSettingsInput(normalizedPaymentSettings);
    const normalizedAboutChef = normalizeAboutChefInput(aboutChef, settings.aboutChef);
    const normalizedContactInfo = normalizeContactInfoInput(contactInfo, settings.contactInfo);
    const normalizedOfferPopup = normalizeOfferPopupInput(offerPopup, settings.offerPopup);
    const aboutChefIssues = validateAboutChefInput(normalizedAboutChef);
    const contactInfoIssues = validateContactInfoInput(normalizedContactInfo);
    const offerPopupIssues = validateOfferPopupInput(normalizedOfferPopup);
    const issues = [
      ...paymentIssues,
      ...aboutChefIssues,
      ...contactInfoIssues,
      ...offerPopupIssues,
    ];
    if (issues.length > 0) {
      return res.status(400).json({ message: issues.join("; ") });
    }

    const updated = await BusinessSettings.findByIdAndUpdate(
      settings._id,
      {
        businessName: normalizedBusinessName,
=======
    const { logoUrl, openingHours, holidayClosures } = req.body || {};
    const settings = await getBusinessSettings();
    const normalizedLogoUrl =
      typeof logoUrl === "string" ? logoUrl.trim() : settings.logoUrl || "";
    const updated = await BusinessSettings.findByIdAndUpdate(
      settings._id,
      {
>>>>>>> Stashed changes
        logoUrl: normalizedLogoUrl,
        openingHours: openingHours || settings.openingHours,
        holidayClosures: holidayClosures || settings.holidayClosures,
        paymentSettings: normalizedPaymentSettings,
        aboutChef: normalizedAboutChef,
        contactInfo: normalizedContactInfo,
        offerPopup: normalizedOfferPopup,
      },
      { new: true },
    ).lean();
    res.json(toAdminBusinessSettings(updated));
  } catch (error) {
    res.status(400).json({ message: "Failed to update business settings" });
  }
});

app.get("/promotions", requireAdmin, async (_req, res) => {
  try {
    const promotions = await Promotion.find().sort({ createdAt: -1 }).lean();
    res.json(promotions);
  } catch (error) {
    res.status(500).json({ message: "Failed to load promotions" });
  }
});

app.post("/promotions", requireAdmin, async (req, res) => {
  try {
    const payload = req.body || {};
    const code = String(payload.code || "")
      .trim()
      .toUpperCase();
    if (!code) {
      return res.status(400).json({ message: "Promo code is required" });
    }
    const created = await Promotion.create({
      ...payload,
      code,
    });
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ message: "Failed to create promotion" });
  }
});

app.put("/promotions/:id", requireAdmin, async (req, res) => {
  try {
    const payload = req.body || {};
    if (payload.code) {
      payload.code = String(payload.code).trim().toUpperCase();
    }
    const updated = await Promotion.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) {
      return res.status(404).json({ message: "Promotion not found" });
    }
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: "Failed to update promotion" });
  }
});

app.post("/promotions/validate", async (req, res) => {
  try {
    const { code, subtotal, userId, email } = req.body || {};
    const result = await validatePromotion({ code, subtotal, userId, email });
    if (!result.isValid) {
      return res
        .status(400)
        .json({ message: result.message || "Invalid promo code" });
    }
    res.json({
      code: result.promo.code,
      description: result.promo.description,
      discount: result.discount,
    });
  } catch (error) {
    res.status(400).json({ message: "Unable to validate promo code" });
  }
});

app.get("/admin/marketing/inactive", requireAdmin, async (req, res) => {
  try {
    const days = Math.max(1, Number(req.query.days || 30));
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const inactive = await Order.aggregate([
      { $group: { _id: "$email", lastOrderAt: { $max: "$createdAt" } } },
      { $match: { lastOrderAt: { $lte: cutoff } } },
      { $sort: { lastOrderAt: -1 } },
      { $limit: 200 },
    ]);

    res.json(
      inactive.map((entry) => ({
        email: entry._id,
        lastOrderAt: entry.lastOrderAt,
      })),
    );
  } catch (error) {
    res.status(500).json({ message: "Failed to load inactive customers" });
  }
});

app.post("/admin/marketing/campaigns/send", requireAdmin, async (req, res) => {
  try {
    const { subject, message, recipients } = req.body || {};
    if (
      !subject ||
      !message ||
      !Array.isArray(recipients) ||
      recipients.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "Subject, message, and recipients are required" });
    }

    if (!mailTransporter || !smtpFrom) {
      console.log("[email-placeholder] Campaign email not configured", {
        subject,
        recipients,
      });
      return res.json({ sent: 0, skipped: recipients.length });
    }

    await Promise.all(
      recipients.map((email) =>
        mailTransporter.sendMail({
          from: smtpFrom,
          to: email,
          subject,
          html: `<p>${message}</p>`,
        }),
      ),
    );

    res.json({ sent: recipients.length, skipped: 0 });
  } catch (error) {
    res.status(500).json({ message: "Failed to send campaign" });
  }
});

app.get("/admin/analytics", requireAdmin, async (_req, res) => {
  try {
    const orders = await Order.find({}).lean();
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce(
      (sum, order) => sum + (Number(order.total) || 0),
      0,
    );
    const hourCounts = new Array(24).fill(0);
    const itemCounts = new Map();
    const customerCounts = new Map();
    const promoCounts = new Map();
    const weekdayCounts = new Array(7).fill(0);
    const weekdayRevenue = new Array(7).fill(0);

    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      return date;
    });

    const last7Keys = last7Days.map((date) => date.toISOString().slice(0, 10));
    const dailyCounts = new Map(last7Keys.map((key) => [key, 0]));
    const dailyRevenue = new Map(last7Keys.map((key) => [key, 0]));
    const peakWindowStart = 18;
    const peakWindowEnd = 21;
    let peakWindowOrders = 0;
    let peakWindowRevenue = 0;

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfLast7Days = new Date(now);
    startOfLast7Days.setDate(now.getDate() - 6);
    startOfLast7Days.setHours(0, 0, 0, 0);
    const startOfLast30Days = new Date(now);
    startOfLast30Days.setDate(now.getDate() - 29);
    startOfLast30Days.setHours(0, 0, 0, 0);

    let cashbackToday = 0;
    let cashbackWeek = 0;
    let cashbackMonth = 0;

    orders.forEach((order) => {
      const hour = new Date(order.createdAt).getHours();
      hourCounts[hour] += 1;
      if (hour >= peakWindowStart && hour < peakWindowEnd) {
        peakWindowOrders += 1;
        peakWindowRevenue += Number(order.total) || 0;
      }
      order.items.forEach((item) => {
        const name = item.menuItem?.name || "Unknown";
        itemCounts.set(name, (itemCounts.get(name) || 0) + item.quantity);
      });
      if (order.userId) {
        customerCounts.set(
          order.userId,
          (customerCounts.get(order.userId) || 0) + 1,
        );
      }

      const created = new Date(order.createdAt);
      const cashback = Number(order.cashbackEarned) || 0;
      if (created >= startOfToday) {
        cashbackToday += cashback;
      }
      if (created >= startOfLast7Days) {
        cashbackWeek += cashback;
      }
      if (created >= startOfLast30Days) {
        cashbackMonth += cashback;
      }
      const weekday = created.getDay();
      weekdayCounts[weekday] += 1;
      weekdayRevenue[weekday] += Number(order.total) || 0;
      const dayKey = created.toISOString().slice(0, 10);
      if (dailyCounts.has(dayKey)) {
        dailyCounts.set(dayKey, dailyCounts.get(dayKey) + 1);
        dailyRevenue.set(
          dayKey,
          dailyRevenue.get(dayKey) + (Number(order.total) || 0),
        );
      }

      if (order.promoCode) {
        const key = order.promoCode;
        const current = promoCounts.get(key) || {
          orders: 0,
          revenue: 0,
          discount: 0,
        };
        promoCounts.set(key, {
          orders: current.orders + 1,
          revenue: current.revenue + (Number(order.total) || 0),
          discount: current.discount + (Number(order.promoDiscount) || 0),
        });
      }
    });

    const peakHourIndex = hourCounts.indexOf(Math.max(...hourCounts));
    const topItems = Array.from(itemCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const repeatCustomers = Array.from(customerCounts.values()).filter(
      (count) => count > 1,
    ).length;

    const promoPerformance = Array.from(promoCounts.entries()).map(
      ([code, data]) => ({
        code,
        orders: data.orders,
        revenue: data.revenue,
        discount: data.discount,
      }),
    );

    res.json({
      totalOrders,
      totalRevenue,
      peakHour: peakHourIndex,
      topItems,
      repeatCustomers,
      promoPerformance,
      hourlyOrders: hourCounts.map((count, hour) => ({ hour, count })),
      weekdayOrders: weekdayCounts.map((count, index) => ({
        day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][index],
        count,
        revenue: weekdayRevenue[index],
      })),
      dailyOrders: last7Keys.map((dateKey) => ({
        date: dateKey,
        count: dailyCounts.get(dateKey) || 0,
        revenue: dailyRevenue.get(dateKey) || 0,
      })),
      peakWindow: {
        label: "6-9 PM",
        orders: peakWindowOrders,
        revenue: peakWindowRevenue,
      },
      cashbackSummary: {
        today: cashbackToday,
        week: cashbackWeek,
        month: cashbackMonth,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load analytics" });
  }
});

app.get("/users/:uid", async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ uid: req.params.uid }).lean();
    if (!profile) {
      return res.json({
        uid: req.params.uid,
        email: "",
        fullName: "",
        phone: "",
        dateOfBirth: "",
        preferredContact: "email",
        addresses: [],
      });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: "Failed to load profile" });
  }
});

app.put("/users/:uid", async (req, res) => {
  try {
    const { email, addresses, fullName, phone, dateOfBirth, preferredContact } =
      req.body || {};

    const updateDoc = {
      uid: req.params.uid,
    };

    if (typeof email === "string") {
      updateDoc.email = email.trim();
    }

    if (Array.isArray(addresses)) {
      updateDoc.addresses = addresses;
    }

    if (typeof fullName === "string") {
      updateDoc.fullName = fullName.trim();
    }

    if (typeof phone === "string") {
      updateDoc.phone = phone.trim();
    }

    if (typeof dateOfBirth === "string") {
      updateDoc.dateOfBirth = dateOfBirth.trim();
    }

    if (
      typeof preferredContact === "string" &&
      ["email", "phone", ""].includes(preferredContact)
    ) {
      updateDoc.preferredContact = preferredContact;
    }

    const profile = await UserProfile.findOneAndUpdate(
      { uid: req.params.uid },
      { $set: updateDoc },
      { new: true, upsert: true },
    ).lean();
    res.json(profile);
  } catch (error) {
    res.status(400).json({ message: "Failed to update profile" });
  }
});

app.listen(PORT, () => {
  console.log(`API listening on ${PORT}`);
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    console.warn(
      "[WARN] ADMIN_EMAIL and ADMIN_PASSWORD are not set. " +
      "The header-based admin login will be disabled. " +
      "Set these environment variables to enable it.",
    );
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "dev-secret") {
    console.warn(
      "[WARN] JWT_SECRET is using the insecure default value. " +
      "Set a strong random JWT_SECRET in production.",
    );
  }
});
