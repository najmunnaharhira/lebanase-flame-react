import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema(
  {
    fullName: String,
    phone: String,
    line1: String,
    line2: String,
    city: String,
    postcode: String,
  },
  { _id: false }
);

const UserProfileSchema = new mongoose.Schema(
  {
    uid: { type: String, unique: true, required: true },
    email: { type: String, required: true },
    addresses: { type: [AddressSchema], default: [] },
    completedOrders: { type: Number, default: 0 },
    loyaltyStamps: { type: Number, default: 0 },
    loyaltyRewardAvailable: { type: Boolean, default: false },
    rewardPoints: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const UserProfile = mongoose.model("UserProfile", UserProfileSchema);
