import Stripe from "stripe";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import mongoose from "mongoose";
import multer from "multer";
import nodemailer from "nodemailer";
import path from "path";
import sharp from "sharp";
import twilio from "twilio";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";
import { AbandonedCart } from "./models/AbandonedCart.js";
import { BusinessSettings } from "./models/BusinessSettings.js";
import { Category } from "./models/Category.js";
import { MenuItem } from "./models/MenuItem.js";
import { Order } from "./models/Order.js";
import { Promotion } from "./models/Promotion.js";
import { SupportMessage } from "./models/SupportMessage.js";
import { UserProfile } from "./models/UserProfile.js";

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

app.use(
  cors({
    origin: corsOrigin.length > 0 ? corsOrigin : true,
  }),
);

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
const allowLocalOnly = allowedIps.length === 0;
const adminEmail = process.env.ADMIN_EMAIL || "admin@gmail.com";
const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";

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

  const requestIp = normalizeIp(getRequestIp(req));
  if (allowLocalOnly) {
    const isLocal =
      requestIp === "127.0.0.1" ||
      requestIp === "::1" ||
      requestIp.startsWith("192.168.") ||
      requestIp.startsWith("10.") ||
      requestIp.startsWith("172.16.");
    if (isLocal) {
      return next();
    }
  }

  if (allowedIps.length > 0 && allowedIps.includes(requestIp)) {
    return next();
  }

  return res.status(403).json({ message: "API access is restricted" });
});

const requireAdmin = (req, res, next) => {
  const email =
    typeof req.headers["x-admin-email"] === "string"
      ? req.headers["x-admin-email"]
      : "";
  const password =
    typeof req.headers["x-admin-password"] === "string"
      ? req.headers["x-admin-password"]
      : "";

  if (email === adminEmail && password === adminPassword) {
    return next();
  }

  return res.status(401).json({ message: "Unauthorized" });
};

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  throw new Error("MONGODB_URI is missing in environment variables");
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" })
  : null;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

app.post(
  "/payments/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    if (!stripe || !stripeWebhookSecret) {
      return res.status(500).json({ message: "Stripe is not configured" });
    }

    const signature = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        stripeWebhookSecret,
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

const getBusinessSettings = async () => {
  let settings = await BusinessSettings.findOne().lean();
  if (!settings) {
    settings = await BusinessSettings.create({
      openingHours: defaultOpeningHours,
      holidayClosures: [],
    });
  }
  return settings;
};

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

app.post("/payments/intent", async (req, res) => {
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
      total,
      promoCode,
      paymentMethod,
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

    const order = await Order.create({
      userId,
      email,
      deliveryMode,
      address: deliveryMode === "delivery" ? address : undefined,
      items: orderItems,
      subtotal,
      deliveryFee,
      loyaltyDiscount: sanitizedLoyaltyDiscount,
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

    if (normalizedStatus === "Delivered" && previousStatus !== "Delivered" && order.userId) {
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
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: "Failed to load business settings" });
  }
});

app.put("/settings/business", requireAdmin, async (req, res) => {
  try {
    const { openingHours, holidayClosures } = req.body || {};
    const settings = await getBusinessSettings();
    const updated = await BusinessSettings.findByIdAndUpdate(
      settings._id,
      {
        openingHours: openingHours || settings.openingHours,
        holidayClosures: holidayClosures || settings.holidayClosures,
      },
      { new: true },
    ).lean();
    res.json(updated);
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
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load analytics" });
  }
});

app.get("/users/:uid", async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ uid: req.params.uid }).lean();
    if (!profile) {
      return res.json({ uid: req.params.uid, email: "", addresses: [] });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: "Failed to load profile" });
  }
});

app.put("/users/:uid", async (req, res) => {
  try {
    const { email, addresses } = req.body;
    const profile = await UserProfile.findOneAndUpdate(
      { uid: req.params.uid },
      { uid: req.params.uid, email: email || "", addresses: addresses || [] },
      { new: true, upsert: true },
    ).lean();
    res.json(profile);
  } catch (error) {
    res.status(400).json({ message: "Failed to update profile" });
  }
});

app.listen(PORT, () => {
  console.log(`API listening on ${PORT}`);
});
