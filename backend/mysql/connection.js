import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config({ path: new URL("../.env", import.meta.url) });

const {
  MYSQL_HOST = "localhost",
  MYSQL_PORT = "3306",
  MYSQL_USER = "root",
  MYSQL_PASSWORD = "",
  MYSQL_DATABASE = "lebanese_flames",
} = process.env;

export const mysqlPool = mysql.createPool({
  host: MYSQL_HOST,
  port: Number(MYSQL_PORT),
  user: MYSQL_USER,
  password: MYSQL_PASSWORD,
  database: MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const testMySqlConnection = async () => {
  try {
    const connection = await mysqlPool.getConnection();
    await connection.ping();
    connection.release();
    console.log("MySQL connected");
  } catch (error) {
    console.error("MySQL connection error:", error.message || error);
    throw error;
  }
};

