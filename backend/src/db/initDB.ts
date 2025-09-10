import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the project root (3 levels up from backend/src/db/)
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

export const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: Number(process.env.PG_PORT),
});

export async function initDB() {
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

  console.log("Table created or already exists!");
}


