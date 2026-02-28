import express from "express";
import { postValidateCoupon } from "../controllers/couponsController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { sanitizeInput } from "../middleware/sanitizeInput.js";

const router = express.Router();

router.use(sanitizeInput);
router.post("/validate", asyncHandler(postValidateCoupon));

export default router;
