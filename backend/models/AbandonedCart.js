import mongoose from "mongoose";

const AbandonedItemSchema = new mongoose.Schema(
  {
    name: String,
    quantity: Number,
    totalPrice: Number,
  },
  { _id: false }
);

const AbandonedCartSchema = new mongoose.Schema(
  {
    email: { type: String },
    phone: { type: String },
    items: { type: [AbandonedItemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    source: { type: String, default: "checkout" },
    promoLink: { type: String, default: "" },
    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const AbandonedCart = mongoose.model("AbandonedCart", AbandonedCartSchema);
