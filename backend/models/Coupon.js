import mongoose from "mongoose";

const CouponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ["percentage", "fixed"], required: true },
    value: { type: Number, required: true, min: 0 },
    expiryDate: { type: Date, required: true },
    usageLimit: { type: Number, default: 0, min: 0 },
    usageCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

CouponSchema.index({ code: 1 }, { unique: true });

export const Coupon = mongoose.model("Coupon", CouponSchema);
