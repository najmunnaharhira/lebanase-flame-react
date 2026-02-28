import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    menuId: { type: String, default: "" },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    customizations: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
);

export const OrderItem = mongoose.model("OrderItem", OrderItemSchema);
