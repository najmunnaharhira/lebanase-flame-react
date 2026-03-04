import dotenv from "dotenv";
import fs from "fs";
import mysql from "mysql2/promise";
import path from "path";
import { fileURLToPath } from "url";
import { mysqlPool, testMySqlConnection } from "./connection.js";

dotenv.config({ path: new URL("../../.env", import.meta.url) });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.join(__dirname, "schema.sql");

const postMigrationStatements = [
  "ALTER TABLE roles ADD COLUMN IF NOT EXISTS permissions JSON NULL",
  `CREATE TABLE IF NOT EXISTS reports (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    content_id INT UNSIGNED NOT NULL,
    reported_by INT UNSIGNED NULL,
    reason TEXT NOT NULL,
    status ENUM('open', 'reviewing', 'resolved', 'rejected') NOT NULL DEFAULT 'open',
    resolution TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_reports_content FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE,
    CONSTRAINT fk_reports_reported_by FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_reports_status (status),
    INDEX idx_reports_content_id (content_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  "CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_transaction_id ON payments(transaction_id)",
  "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
];

const ensureDatabaseExists = async () => {
  const {
    MYSQL_HOST = "localhost",
    MYSQL_PORT = "3306",
    MYSQL_USER = "root",
    MYSQL_PASSWORD = "",
    MYSQL_DATABASE = "lebanese_flames",
  } = process.env;

  const connection = await mysql.createConnection({
    host: MYSQL_HOST,
    port: Number(MYSQL_PORT),
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
  });

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
  } finally {
    await connection.end();
  }
};

const runMigrations = async () => {
  try {
    try {
      await testMySqlConnection();
    } catch (error) {
      if (String(error?.message || "").includes("Unknown database")) {
        await ensureDatabaseExists();
        await testMySqlConnection();
      } else {
        throw error;
      }
    }

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

      for (const statement of postMigrationStatements) {
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
