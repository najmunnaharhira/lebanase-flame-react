import express from "express";
import { getDashboard } from "../controllers/dashboardController.js";
import { getSettings, putSettings } from "../controllers/settingsController.js";
import { verifyAdminAuth } from "../middleware/adminAuth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { sanitizeInput } from "../middleware/sanitizeInput.js";
import { validateBody, validateParams } from "../middleware/validateRequest.js";

import {
  getOrders,
  getOrderById,
  removeOrder,
  updateOrderStatus,
} from "../controllers/adminOrdersController.js";
import {
  getCoupons,
  postCoupon,
  putCoupon,
  removeCoupon,
} from "../controllers/couponsController.js";

const router = express.Router();

router.use(verifyAdminAuth);
router.use(sanitizeInput);

router.get("/orders", asyncHandler(getOrders));
router.get(
  "/orders/:id",
  validateParams((params) => (!params.id ? "Order id is required" : "")),
  asyncHandler(getOrderById),
);
router.put(
  "/orders/:id/status",
  validateBody((body) => {
    const allowed = ["pending", "preparing", "ready", "delivered", "cancelled"];
    if (!body.orderStatus) return "orderStatus is required";
    if (!allowed.includes(body.orderStatus)) return "Invalid orderStatus";
    return "";
  }),
  asyncHandler(updateOrderStatus),
);
router.delete(
  "/orders/:id",
  validateParams((params) => (!params.id ? "Order id is required" : "")),
  asyncHandler(removeOrder),
);

router.get("/dashboard", asyncHandler(getDashboard));

router.post(
  "/coupons",
  validateBody((body) => {
    if (!body.code) return "code is required";
    if (!["percentage", "fixed"].includes(body.type))
      return "type must be percentage or fixed";
    if (Number(body.value) <= 0) return "value must be greater than 0";
    if (!body.expiryDate) return "expiryDate is required";
    return "";
  }),
  asyncHandler(postCoupon),
);
router.get("/coupons", asyncHandler(getCoupons));
router.put("/coupons/:id", asyncHandler(putCoupon));
router.delete("/coupons/:id", asyncHandler(removeCoupon));

router.get("/settings", asyncHandler(getSettings));
router.put("/settings", asyncHandler(putSettings));

export default router;
