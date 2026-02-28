import mongoose from "mongoose";

const OpeningHourSchema = new mongoose.Schema(
  {
    day: { type: String, required: true },
    open: { type: String, required: true },
    close: { type: String, required: true },
    closed: { type: Boolean, default: false },
  },
  { _id: false }
);

const AppSettingsSchema = new mongoose.Schema(
  {
    deliveryFee: { type: Number, default: 2.5 },
    minimumOrder: { type: Number, default: 12 },
    freeDeliveryThreshold: { type: Number, default: 25 },
    collectionEnabled: { type: Boolean, default: true },
    deliveryEnabled: { type: Boolean, default: true },
    estimatedDeliveryTime: { type: String, default: "25-35 min" },
    restaurantOpen: { type: Boolean, default: true },
    openingHours: { type: [OpeningHourSchema], default: [] },
  },
  { timestamps: true }
);

export const AppSettings = mongoose.model("AppSettings", AppSettingsSchema);
