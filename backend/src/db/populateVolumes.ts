import fetch from "node-fetch";
import { pool } from "./initDB.js";

export async function populateVolumes() {
  try {
    console.log("⏳ Buscando volumes dos itens...");

    const response = await fetch("https://grandexchange.tools/api/volumes");
    if (!response.ok) {
      throw new Error(`Erro na API externa: ${response.status}`);
    }

    const data = await response.json();

    const client = await pool.connect();

    interface VolumeItem {
      id: number;
      name: string;
      volume: number;
    }

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

    console.log("✅ Volumes dos itens atualizados com sucesso.");
  } catch (error) {
    console.error("❌ Erro ao popular volumes:", error);
  }
}


