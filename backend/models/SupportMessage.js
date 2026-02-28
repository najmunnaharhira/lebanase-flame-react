import mongoose from "mongoose";

const SupportMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: "" },
    orderId: { type: String, default: "" },
    message: { type: String, required: true },
    source: { type: String, default: "web" },
  },
  { timestamps: true }
);

export const SupportMessage = mongoose.model("SupportMessage", SupportMessageSchema);
