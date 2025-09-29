import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the project root (3 levels up from backend/src/db/)
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

// Determine if we're connecting to a cloud database (like Render)
const isCloudDatabase = process.env.PG_HOST?.includes('.render.com') ||
                       process.env.PG_HOST?.includes('.amazonaws.com') ||
                       process.env.PG_HOST?.includes('.digitalocean.com') ||
                       (process.env.NODE_ENV === 'production' && process.env.PG_HOST !== 'db');

// Database connection configuration
const dbConfig = {
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: Number(process.env.PG_PORT),
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
  statement_timeout: 30000, // 30 seconds for query timeout
  query_timeout: 30000, // 30 seconds for query timeout
  // SSL configuration for cloud databases
  ssl: isCloudDatabase ? {
    rejectUnauthorized: false, // Required for Render and most cloud providers
  } : false,
};

console.log(`🔗 Connecting to database: ${process.env.PG_HOST} (SSL: ${isCloudDatabase ? 'enabled' : 'disabled'})`);

export const pool = new Pool(dbConfig);

export async function initDB() {
  try {
    // Test the connection first
    console.log("🔍 Testing database connection...");
    await pool.query('SELECT NOW()');
    console.log("✅ Database connection successful!");

    console.log("📋 Creating tables...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS items (
        id INT PRIMARY KEY,
        name TEXT NOT NULL,
        members BOOLEAN NOT NULL,
        max_limit INT,
        value NUMERIC NOT NULL,
        highalch NUMERIC,
        lowalch NUMERIC,
        icon TEXT
      );
    `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS item_prices (
      item_id INT REFERENCES items(id),
      current_price NUMERIC,
      current_trend TEXT,
      today_price NUMERIC,
      today_trend TEXT,
      volume BIGINT,
      fetched_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY(item_id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS equipment_attributes (
    item_id INT PRIMARY KEY REFERENCES items(id),
    stab_acc INT,
    slash_acc INT,
    crush_acc INT,
    magic_acc INT,
    ranged_acc INT,
    stab_def INT,
    slash_def INT,
    crush_def INT,
    magic_def INT,
    ranged_def INT,
    melee_strength INT,
    ranged_strength INT,
    magic_damage FLOAT,
    prayer_bonus INT,
    weight FLOAT,
    speed INT,
    slot VARCHAR(50)
);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS consumable_attributes (
      item_id INT REFERENCES items(id),
      effect_type VARCHAR(50) NOT NULL,
      skill VARCHAR(50),
      amount NUMERIC NOT NULL,
      bites INT DEFAULT 1
    );
  `);

  console.log("✅ All tables created or already exist!");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
}


