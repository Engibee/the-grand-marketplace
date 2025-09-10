import express from "express";
const router = express.Router();
import { pool } from "../db/initDB.js";

router.get("/", async (req: express.Request, res: express.Response) => {
  try {
    const result = await pool.query("SELECT * FROM items");
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar items:", err);
    res.status(500).json({ error: "Erro ao buscar items" });
  }
});

router.get("/prices", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.id, i.name, p.current_price, p.current_trend, p.volume, p.today_price, p.today_trend, p.fetched_at
      FROM item_prices p
      JOIN items i ON i.id = p.item_id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error while fetching prices:", err);
    res.status(500).json({ error: "Error while fetching prices." });
  }
});

router.get("/search", async (req: express.Request, res: express.Response) => {
   try {
    const { name } = req.query;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Query param 'name' é obrigatório" });
    }

    // Busca com case-insensitive
    const result = await pool.query(
      `
      SELECT 
        i.id,
        i.name,
        i.members,
        i.max_limit,
        i.value,
        i.highalch,
        i.lowalch,
        i.icon,
        p.current_price,
        p.current_trend,
        p.volume,
        p.today_price,
        p.today_trend,
        p.fetched_at
      FROM items i
      LEFT JOIN item_prices p ON i.id = p.item_id
      WHERE LOWER(i.name) LIKE LOWER($1)
      ORDER BY i.name ASC
      `,
      [`%${name}%`]
    );

    return res.json(result.rows);
  } catch (err) {
    console.error("❌ Error while fetching items:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
