import fetch from "node-fetch";
import { pool } from "./initDB.js";

export async function populateItems() {
  try {
    console.log("📡 Buscando itens da API externa...");

    const response = await fetch("https://grandexchange.tools/api/items");
    const data = await response.json();

    if (!data.items || !Array.isArray(data.items)) {
      throw new Error("Formato inesperado da API externa");
    }

    const client = await pool.connect();

    for (const item of data.items) {
      await client.query(
        `
        INSERT INTO items (id, name, members, max_limit, value, highalch, lowalch, icon)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          members = EXCLUDED.members,
          max_limit = EXCLUDED.max_limit,
          value = EXCLUDED.value,
          highalch = EXCLUDED.highalch,
          lowalch = EXCLUDED.lowalch,
          icon = EXCLUDED.icon
      `,
        [
          item.id,
          item.name,
          item.members,
          item.limit,
          item.value,
          item.highalch,
          item.lowalch,
          item.icon || null,
        ]
      );
    }

    client.release();
    console.log("✅ Itens estáticos populados/atualizados no banco!");
  } catch (err) {
    console.error("❌ Erro ao popular itens:", err);
  }
}

