import mongoose from "mongoose";

const PromotionSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    discountType: { type: String, enum: ["percent", "amount"], required: true },
    value: { type: Number, required: true },
    minSubtotal: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: 0 },
    startsAt: { type: Date },
    endsAt: { type: Date },
    firstOrderOnly: { type: Boolean, default: false },
    minCompletedOrders: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Promotion = mongoose.model("Promotion", PromotionSchema);
