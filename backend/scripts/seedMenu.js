import dotenv from "dotenv";
import categories from "../data/categorySeed.js";
import menuItems from "../data/menuSeed.js";
import { mysqlPool, testMySqlConnection } from "../mysql/connection.js";

dotenv.config({ path: new URL("../../.env", import.meta.url) });

const seed = async () => {
  const connection = await mysqlPool.getConnection();

  try {
    await testMySqlConnection();
    await connection.beginTransaction();

    await connection.query("DELETE FROM menu_items");
    await connection.query("DELETE FROM categories");

    for (const category of categories) {
      await connection.query(
        `INSERT INTO categories (name, slug, icon, sort_order, is_active)
         VALUES (?, ?, ?, ?, 1)`,
        [
          String(category.name || "").trim(),
          String(category.slug || "").trim(),
          String(category.icon || "🍽️").trim(),
          Number(category.sortOrder || 0),
        ],
      );
    }

    for (const item of menuItems) {
      await connection.query(
        `INSERT INTO menu_items (
           name, description, price, category, image,
           is_available, is_popular, is_vegetarian, is_vegan, is_spicy,
           customizations, add_ons
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          String(item.name || "").trim(),
          String(item.description || ""),
          Number(item.price || 0),
          String(item.category || "").trim(),
          item.image ? String(item.image) : null,
          item.isAvailable === false ? 0 : 1,
          item.isPopular ? 1 : 0,
          item.isVegetarian ? 1 : 0,
          item.isVegan ? 1 : 0,
          item.isSpicy ? 1 : 0,
          JSON.stringify(Array.isArray(item.customizations) ? item.customizations : []),
          JSON.stringify(Array.isArray(item.addOns) ? item.addOns : []),
        ],
      );
    }

    await connection.commit();
    console.log(`Seeded ${categories.length} categories and ${menuItems.length} menu items`);
  } catch (error) {
    await connection.rollback();
    console.error("Seed failed:", error.message || error);
    process.exitCode = 1;
  } finally {
    connection.release();
    await mysqlPool.end();
  }
};

seed();
