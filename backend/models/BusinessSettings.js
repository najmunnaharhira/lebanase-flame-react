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

const HolidayClosureSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    note: { type: String, default: "" },
  },
  { _id: false }
);

const BusinessSettingsSchema = new mongoose.Schema(
  {
    openingHours: { type: [OpeningHourSchema], default: [] },
    holidayClosures: { type: [HolidayClosureSchema], default: [] },
  },
  { timestamps: true }
);

export const BusinessSettings = mongoose.model("BusinessSettings", BusinessSettingsSchema);
