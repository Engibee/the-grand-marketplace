import express from "express";
const router = express.Router();
import { pool } from "../db/initDB.js";
import { isValidEffectType, validateRequiredParam } from "../utils/index.js";
import { ConsumableService } from "../services/index.js";

// Get all consumables with their attributes and efficiency calculations
router.get("/", async (req: express.Request, res: express.Response) => {
  try {
    const consumables = await ConsumableService.getAllConsumables();
    res.json(consumables);
  } catch (err) {
    console.error("Error fetching consumables:", err);
    res.status(500).json({ error: "Error fetching consumables." });
  }
});

// Get consumables by effect type (e.g., heal, delayed_heal)
router.get("/effect/:effectType", async (req: express.Request, res: express.Response) => {
  try {
    const { effectType } = req.params;

    if (!effectType || !isValidEffectType(effectType)) {
      return res.status(400).json({ error: "Invalid effect type" });
    }

    const consumables = await ConsumableService.getConsumablesByEffectType(effectType);
    res.json(consumables);
  } catch (error) {
    console.error("Error fetching consumables by effect type:", error);
    res.status(500).json({ error: "Failed to fetch consumables data" });
  }
});

// Get top healing foods (most efficient healing per gp)
router.get("/healing/top", async (req: express.Request, res: express.Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const healingFoods = await ConsumableService.getTopHealingFoods(limit);
    res.json(healingFoods);
  } catch (error) {
    console.error("Error fetching top healing foods:", error);
    res.status(500).json({ error: "Failed to fetch top healing foods" });
  }
});

// Search consumables by name
router.get("/search", async (req: express.Request, res: express.Response) => {
  try {
    const { name } = req.query;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Query param 'name' is required" });
    }

    const result = await pool.query(`
      SELECT DISTINCT
        ca.item_id,
        i.name as item_name,
        p.current_price,
        p.current_trend,
        p.volume,
        p.today_price,
        p.today_trend,
        p.fetched_at
      FROM consumable_attributes ca
      JOIN items i ON ca.item_id = i.id
      LEFT JOIN item_prices p ON ca.item_id = p.item_id
      WHERE LOWER(i.name) LIKE LOWER($1)
      ORDER BY i.name ASC
    `, [`%${name}%`]);

    // For each item, get all its effects
    const itemsWithEffects = await Promise.all(
      result.rows.map(async (item) => {
        const effectsResult = await pool.query(`
          SELECT effect_type, skill, amount, bites
          FROM consumable_attributes
          WHERE item_id = $1
        `, [item.item_id]);

        return {
          ...item,
          effects: effectsResult.rows
        };
      })
    );

    res.json(itemsWithEffects);
  } catch (err) {
    console.error("Error searching consumables:", err);
    res.status(500).json({ error: "Error searching consumables" });
  }
});

// Get sample consumables data for testing
router.get("/sample", async (req: express.Request, res: express.Response) => {
  try {
    const result = await pool.query(`
      SELECT
        ca.item_id,
        i.name as item_name,
        p.current_price,
        ca.effect_type,
        ca.skill,
        ca.amount,
        ca.bites
      FROM consumable_attributes ca
      JOIN items i ON ca.item_id = i.id
      LEFT JOIN item_prices p ON ca.item_id = p.item_id
      WHERE p.current_price IS NOT NULL AND p.current_price > 0
      ORDER BY i.name, ca.effect_type
      LIMIT 6
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching sample consumables:", err);
    res.status(500).json({ error: "Error fetching sample consumables." });
  }
});

export default router;
