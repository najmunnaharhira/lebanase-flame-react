import { Coupon } from "../models/Coupon.js";

export const createCoupon = async (payload) => {
  return Coupon.create({
    code: payload.code?.toUpperCase().trim(),
    type: payload.type,
    value: Number(payload.value || 0),
    expiryDate: payload.expiryDate,
    usageLimit: Number(payload.usageLimit || 0),
    usageCount: Number(payload.usageCount || 0),
    isActive: payload.isActive !== false,
  });
};

export const listCoupons = async () =>
  Coupon.find({}).sort({ createdAt: -1 }).lean();

export const updateCoupon = async (id, payload) => {
  const next = { ...payload };
  if (typeof next.code === "string") next.code = next.code.toUpperCase().trim();
  if (typeof next.value !== "undefined") next.value = Number(next.value);
  if (typeof next.usageLimit !== "undefined")
    next.usageLimit = Number(next.usageLimit);
  if (typeof next.usageCount !== "undefined")
    next.usageCount = Number(next.usageCount);
  return Coupon.findByIdAndUpdate(id, next, { new: true }).lean();
};

export const deleteCoupon = async (id) => {
  const deleted = await Coupon.findByIdAndDelete(id).lean();
  return Boolean(deleted);
};

export const validateCoupon = async ({ code, subtotal }) => {
  if (!code) {
    return { isValid: false, message: "Coupon code is required" };
  }

  const coupon = await Coupon.findOne({
    code: code.toUpperCase().trim(),
    isActive: true,
  }).lean();
  if (!coupon) {
    return { isValid: false, message: "Invalid coupon code" };
  }

  const now = new Date();
  if (
    coupon.expiryDate &&
    new Date(coupon.expiryDate).getTime() < now.getTime()
  ) {
    return { isValid: false, message: "Coupon has expired" };
  }

  if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) {
    return { isValid: false, message: "Coupon usage limit reached" };
  }

  const numericSubtotal = Number(subtotal || 0);
  let discount = 0;
  if (coupon.type === "percentage") {
    discount = (numericSubtotal * Number(coupon.value || 0)) / 100;
  } else {
    discount = Number(coupon.value || 0);
  }

  discount = Math.max(0, Math.min(numericSubtotal, discount));

  return {
    isValid: true,
    coupon,
    discount: Number(discount.toFixed(2)),
  };
};

export const incrementCouponUsage = async (code) => {
  if (!code) return;
  await Coupon.findOneAndUpdate(
    { code: code.toUpperCase().trim() },
    { $inc: { usageCount: 1 } },
    { new: true },
  );
};
