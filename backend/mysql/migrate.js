import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { mysqlPool, testMySqlConnection } from "./connection.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.join(__dirname, "schema.sql");

const runMigrations = async () => {
  try {
    await testMySqlConnection();

    const schemaSql = fs.readFileSync(schemaPath, "utf8");
    const statements = schemaSql
      .split(/;\s*$/m)
      .map((statement) => statement.trim())
      .filter(Boolean);

    const connection = await mysqlPool.getConnection();
    try {
      for (const statement of statements) {
        await connection.query(statement);
      }
    } finally {
      connection.release();
    }

    console.log("MySQL migrations applied successfully");
    process.exit(0);
  } catch (error) {
    console.error("Failed to run MySQL migrations:", error.message || error);
    process.exit(1);
  }
};

runMigrations();

