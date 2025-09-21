import fetch from "node-fetch";
import { pool } from "./initDB.js";
import type { VolumeItem } from '../models/index.js';

export async function populateVolumes() {
  try {
    console.log("⏳ Searching for items volumes...");

    const response = await fetch("https://grandexchange.tools/api/volumes");
    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const data = await response.json();

    const client = await pool.connect();



    // transforma em array e filtra itens válidos
    const items = Object.values(data).filter(
      (item: any): item is VolumeItem =>
        item &&
        typeof item === "object" &&
        typeof item.id === "number" &&
        typeof item.volume === "number"
    );
    
    try {
      for (const item of items) {
        const query = `
          UPDATE item_prices
          SET volume = $2
          WHERE item_id = $1
        `;
        await client.query(query, [item.id, item.volume]);
      }
    } finally {
      client.release();
    }

    console.log("✅ Items volumes populated/updated successfully.");
  } catch (error) {
    console.error("❌ Error populating volumes:", error);
  }
}


