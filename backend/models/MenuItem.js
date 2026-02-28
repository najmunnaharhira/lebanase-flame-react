import mongoose from "mongoose";

const CustomizationOptionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, default: 0 },
  },
  { _id: false },
);

const CustomizationSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    options: { type: [CustomizationOptionSchema], default: [] },
    required: { type: Boolean, default: false },
    maxSelections: { type: Number },
  },
  { _id: false },
);

const MenuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    image: { type: String, default: null },
    isAvailable: { type: Boolean, default: true },
    isPopular: { type: Boolean, default: false },
    isVegetarian: { type: Boolean, default: false },
    isVegan: { type: Boolean, default: false },
    isSpicy: { type: Boolean, default: false },
    customizations: { type: [CustomizationSchema], default: [] },
    addOns: [{ name: String, price: Number }],
  },
  { timestamps: true },
);

MenuItemSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const MenuItem = mongoose.model("MenuItem", MenuItemSchema);
