import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema(
  {
    menuItem: { type: Object, required: true },
    quantity: { type: Number, required: true },
    customizations: { type: Array, default: [] },
    totalPrice: { type: Number, required: true },
  },
  { _id: false }
);

const AddressSchema = new mongoose.Schema(
  {
    fullName: String,
    phone: String,
    line1: String,
    line2: String,
    city: String,
    postcode: String,
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    userId: { type: String },
    email: { type: String, required: true },
    deliveryMode: { type: String, enum: ["delivery", "collection"], required: true },
    address: { type: AddressSchema },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, required: true },
    loyaltyDiscount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["card", "cash"], required: true },
    loyaltyRewardApplied: { type: Boolean, default: false },
    invoiceNumber: { type: String, required: true },
    receiptEmailSent: { type: Boolean, default: false },
    promoCode: { type: String },
    promoDiscount: { type: Number, default: 0 },
    paymentIntentId: { type: String },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "cash_on_collection"],
      default: "pending",
    },
    notes: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Order Received", "Preparing", "Ready for Collection", "Out for Delivery", "Completed"],
      default: "Order Received",
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", OrderSchema);
