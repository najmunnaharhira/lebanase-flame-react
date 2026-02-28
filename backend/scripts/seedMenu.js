import dotenv from "dotenv";
import mongoose from "mongoose";
import { MenuItem } from "../models/MenuItem.js";
import { Category } from "../models/Category.js";
import categories from "../data/categorySeed.js";
import menuItems from "../data/menuSeed.js";

dotenv.config({ path: new URL("../.env", import.meta.url) });

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  throw new Error("MONGODB_URI is missing in environment variables");
}

const seed = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    await Category.deleteMany({});
    const createdCategories = await Category.insertMany(categories);

    await MenuItem.deleteMany({});
    const created = await MenuItem.insertMany(menuItems);
    console.log(`Seeded ${createdCategories.length} categories`);
    console.log(`Seeded ${created.length} menu items`);
  } finally {
    await mongoose.disconnect();
  }
};

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
