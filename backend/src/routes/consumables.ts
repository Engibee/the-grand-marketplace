import express from "express";
const router = express.Router();
import { pool } from "../db/initDB.js";

// Get all consumables with their attributes and efficiency calculations
router.get("/", async (req: express.Request, res: express.Response) => {
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
    `);

    // Group by item and calculate efficiency
    const consumablesMap = new Map();

    result.rows.forEach(row => {
      const itemId = row.item_id;
      const price = parseFloat(row.current_price) || 0;

      if (!consumablesMap.has(itemId)) {
        consumablesMap.set(itemId, {
          item_id: itemId,
          item_name: row.item_name,
          current_price: row.current_price,
          effects: {},
          bites: row.bites
        });
      }

      const item = consumablesMap.get(itemId);
      const amount = parseFloat(row.amount) || 0;

      // Calculate efficiency (healing per gp)
      const calculateEfficiency = (value: number) => {
        return price > 0 && value > 0 
          ? Math.round((value / price) * 1000000) / 1000000 
          : null;
      };

      // Add effect with efficiency calculation
      item.effects[row.effect_type] = {
        skill: row.skill,
        amount: amount,
        efficiency: calculateEfficiency(amount),
        amount_per_bite: row.bites > 0 ? Math.round((amount / row.bites) * 100) / 100 : amount
      };
    });

    const consumables = Array.from(consumablesMap.values());
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

    const validEffectTypes = ['heal', 'delayed_heal', 'boost', 'restore'];
    
    if (!effectType || !validEffectTypes.includes(effectType)) {
      return res.status(400).json({ error: "Invalid effect type" });
    }

    const result = await pool.query(`
      SELECT
        ca.item_id,
        i.name as item_name,
        p.current_price,
        ca.effect_type,
        ca.skill,
        ca.amount,
        ca.bites,
        CASE
          WHEN p.current_price > 0 AND ca.amount > 0
          THEN ca.amount::float / p.current_price
          ELSE 0
        END as efficiency
      FROM consumable_attributes ca
      JOIN items i ON ca.item_id = i.id
      LEFT JOIN item_prices p ON ca.item_id = p.item_id
      WHERE ca.effect_type = $1
        AND p.current_price IS NOT NULL AND p.current_price > 0
        AND ca.amount > 0
      ORDER BY efficiency DESC
    `, [effectType]);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching consumables by effect type:", error);
    res.status(500).json({ error: "Failed to fetch consumables data" });
  }
});

// Get top healing foods (most efficient healing per gp)
router.get("/healing/top", async (req: express.Request, res: express.Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await pool.query(`
      SELECT
        ca.item_id,
        i.name as item_name,
        p.current_price,
        ca.amount as healing,
        ca.bites,
        CASE
          WHEN p.current_price > 0 AND ca.amount > 0
          THEN ca.amount::float / p.current_price
          ELSE 0
        END as healing_per_gp,
        CASE
          WHEN ca.bites > 0
          THEN ca.amount::float / ca.bites
          ELSE ca.amount
        END as healing_per_bite
      FROM consumable_attributes ca
      JOIN items i ON ca.item_id = i.id
      LEFT JOIN item_prices p ON ca.item_id = p.item_id
      WHERE ca.effect_type = 'heal'
        AND p.current_price IS NOT NULL AND p.current_price > 0
        AND ca.amount > 0
      ORDER BY healing_per_gp DESC
      LIMIT $1
    `, [limit]);

    res.json(result.rows);
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
