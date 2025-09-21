import fetch from "node-fetch";
import { pool } from "./initDB.js";

export async function populatePrices() {
  try {
    console.log("⏳ Searching for items prices...");

    // 🔹 1. Buscar dados da API externa
    const response = await fetch("https://grandexchange.tools/api/prices");
    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const data: any[] = await response.json();
    const items = Object.values(data).filter((item: any) => typeof item.id === "number");
    
    // 🔹 2. Inserir/atualizar no banco
    const client = await pool.connect();
    try {
      for (const item of items) {
        const query = `
          INSERT INTO item_prices (item_id, current_price, current_trend, today_price, today_trend, fetched_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
          ON CONFLICT (item_id) DO UPDATE SET
            current_price = EXCLUDED.current_price,
            current_trend = EXCLUDED.current_trend,
            today_price = EXCLUDED.today_price,
            today_trend = EXCLUDED.today_trend,
            fetched_at = NOW();
        `;

        await client.query(query, [
          item.id,
          item.current.price,
          item.current.trend,
          item.today.price,
          item.today.trend,
        ]);
      }
    } finally {
      client.release();
    }

    console.log("✅ Items prices populated/updated successfully.");
  } catch (error) {
    console.error("❌ Error populating prices:", error);
  }
}   


