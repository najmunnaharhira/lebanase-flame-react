import {
  createCoupon,
  deleteCoupon,
  listCoupons,
  updateCoupon,
  validateCoupon,
} from "../services/couponService.js";

export const postCoupon = async (req, res) => {
  const coupon = await createCoupon(req.body);
  res.status(201).json(coupon);
};

export const getCoupons = async (_req, res) => {
  const coupons = await listCoupons();
  res.json(coupons);
};

export const putCoupon = async (req, res) => {
  const coupon = await updateCoupon(req.params.id, req.body);
  if (!coupon) {
    return res.status(404).json({ message: "Coupon not found" });
  }
  return res.json(coupon);
};

export const removeCoupon = async (req, res) => {
  const deleted = await deleteCoupon(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: "Coupon not found" });
  }
  return res.status(204).send();
};

export const postValidateCoupon = async (req, res) => {
  const result = await validateCoupon({
    code: req.body.code,
    subtotal: req.body.subtotal,
  });
  if (!result.isValid) {
    return res
      .status(400)
      .json({ message: result.message || "Invalid coupon" });
  }
  return res.json({
    code: result.coupon.code,
    discount: result.discount,
    type: result.coupon.type,
    value: result.coupon.value,
  });
};
