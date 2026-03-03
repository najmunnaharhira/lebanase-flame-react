import mongoose from "mongoose";

const OpeningHourSchema = new mongoose.Schema(
  {
    day: { type: String, required: true },
    open: { type: String, required: true },
    close: { type: String, required: true },
    closed: { type: Boolean, default: false },
  },
  { _id: false }
);

const HolidayClosureSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    note: { type: String, default: "" },
  },
  { _id: false }
);

const PaymentSettingsSchema = new mongoose.Schema(
  {
    stripePublishableKey: { type: String, default: "" },
    stripeSecretKey: { type: String, default: "" },
    stripeWebhookSecret: { type: String, default: "" },
    cloverEnabled: { type: Boolean, default: false },
    cloverAccessToken: { type: String, default: "" },
    cloverPrivateKey: { type: String, default: "" },
    cloverMerchantId: { type: String, default: "" },
    cloverApiBaseUrl: {
      type: String,
      default: "https://scl-sandbox.dev.clover.com",
    },
    cloverDefaultCurrency: { type: String, default: "gbp" },
  },
  { _id: false }
);

const AboutChefSchema = new mongoose.Schema(
  {
    sectionTitle: { type: String, default: "Meet Our Chef" },
    chefName: { type: String, default: "Chef Ahmad Khoury" },
    bio: {
      type: String,
      default:
        "Born in Beirut and trained in the finest Lebanese kitchens, Chef Ahmad brings over two decades of culinary expertise to Eltham. Every dish is crafted with love, using traditional family recipes passed down through generations.",
    },
    imageUrl: { type: String, default: "" },
    experienceText: { type: String, default: "20+ Years Experience" },
  },
  { _id: false }
);

const ContactInfoSchema = new mongoose.Schema(
  {
    phone: { type: String, default: "07466 305 669" },
    email: { type: String, default: "hello@lebaneseflames.co.uk" },
    address: {
      type: String,
      default: "381 Footscray Road, New Eltham, London SE9 2DR",
    },
    whatsapp: { type: String, default: "447466305669" },
  },
  { _id: false }
);

const OfferPopupSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: true },
    title: { type: String, default: "Welcome Offer 🔥" },
    description: {
      type: String,
      default: "Get 10% OFF your first order with code WELCOME10.",
    },
    promoCode: { type: String, default: "WELCOME10" },
    ctaText: { type: String, default: "Order now" },
    ctaLink: { type: String, default: "/menu" },
    cashbackAmount: { type: Number, default: 0 },
  },
  { _id: false }
);

const BusinessSettingsSchema = new mongoose.Schema(
  {
    openingHours: { type: [OpeningHourSchema], default: [] },
    holidayClosures: { type: [HolidayClosureSchema], default: [] },
    paymentSettings: { type: PaymentSettingsSchema, default: () => ({}) },
    aboutChef: { type: AboutChefSchema, default: () => ({}) },
    contactInfo: { type: ContactInfoSchema, default: () => ({}) },
    offerPopup: { type: OfferPopupSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export const BusinessSettings = mongoose.model("BusinessSettings", BusinessSettingsSchema);
