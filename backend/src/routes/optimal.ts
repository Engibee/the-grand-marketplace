import express from "express";
const router = express.Router();
import { pool } from "../db/initDB.js";
import { VALID_EQUIPMENT_ATTRIBUTES } from "../models/index.js";

// Get top 5 equipment per slot for specific attribute (optimized)
router.get("/equipments/:attribute", async (req: express.Request, res: express.Response) => {
  try {
    const { attribute } = req.params;

    // Validate attribute
    if (!attribute || !VALID_EQUIPMENT_ATTRIBUTES.includes(attribute as any)) {
      return res.status(400).json({ error: "Invalid attribute" });
    }

    const query = `
      WITH ranked_equipment AS (
        SELECT
          i.id as item_id,
          i.name as item_name,
          ip.current_price,
          ea.slot,
          ea.${attribute},
          CASE
            WHEN ip.current_price > 0 AND ea.${attribute} IS NOT NULL AND ea.${attribute} > 0
            THEN ea.${attribute}::float / ip.current_price
            ELSE 0
          END as efficiency,
          ROW_NUMBER() OVER (
            PARTITION BY ea.slot
            ORDER BY
              CASE
                WHEN ip.current_price > 0 AND ea.${attribute} IS NOT NULL AND ea.${attribute} > 0
                THEN ea.${attribute}::float / ip.current_price
                ELSE 0
              END DESC
          ) as rank
        FROM equipment_attributes ea
        JOIN items i ON ea.item_id = i.id
        LEFT JOIN item_prices ip ON i.id = ip.item_id
        WHERE ea.${attribute} IS NOT NULL AND ea.${attribute} > 0
          AND ip.current_price IS NOT NULL AND ip.current_price > 0
      )
      SELECT
        item_id, item_name, current_price, slot, ${attribute} as attribute_value, efficiency
      FROM ranked_equipment
      WHERE rank <= 5
      ORDER BY slot, efficiency DESC;
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching optimized equipment data:", error);
    res.status(500).json({ error: "Failed to fetch equipment data" });
  }
});

router.get("/equipments", async (req: express.Request, res: express.Response) => {
  try {
    const result = await pool.query(`
      SELECT
        ea.item_id,
        i.name as item_name,
        p.current_price,
        ea.stab_acc,
        ea.slash_acc,
        ea.crush_acc,
        ea.magic_acc,
        ea.ranged_acc,
        ea.stab_def,
        ea.slash_def,
        ea.crush_def,
        ea.magic_def,
        ea.ranged_def,
        ea.melee_strength,
        ea.ranged_strength,
        ea.magic_damage,
        ea.prayer_bonus,
        ea.weight,
        ea.speed,
        ea.slot
      FROM equipment_attributes ea
      JOIN items i ON ea.item_id = i.id
      LEFT JOIN item_prices p ON ea.item_id = p.item_id
      WHERE p.current_price IS NOT NULL AND p.current_price > 0
      ORDER BY ea.slot, i.name
    `);

    // Transform the data to include efficiency calculations
    const equipments = result.rows.map(row => {
      const price = row.current_price;

      // Helper function to calculate efficiency (attribute per gp)
      const calculateEfficiency = (attributeValue: number | null): number | null => {
        if (attributeValue === null || attributeValue === 0 || price === null || price === 0) {
          return null;
        }
        // Use more precision for very small efficiency values
        const efficiency = attributeValue / price;
        return Math.round(efficiency * 1000000000) / 1000000000; // Round to 9 decimal places
      };

      return {
        item_id: row.item_id,
        item_name: row.item_name,
        current_price: row.current_price,
        slot: row.slot,
        stab_acc: {
          value: row.stab_acc,
          stab_acc_efficiency: calculateEfficiency(row.stab_acc)
        },
        slash_acc: {
          value: row.slash_acc,
          slash_acc_efficiency: calculateEfficiency(row.slash_acc)
        },
        crush_acc: {
          value: row.crush_acc,
          crush_acc_efficiency: calculateEfficiency(row.crush_acc)
        },
        magic_acc: {
          value: row.magic_acc,
          magic_acc_efficiency: calculateEfficiency(row.magic_acc)
        },
        ranged_acc: {
          value: row.ranged_acc,
          ranged_acc_efficiency: calculateEfficiency(row.ranged_acc)
        },
        stab_def: {
          value: row.stab_def,
          stab_def_efficiency: calculateEfficiency(row.stab_def)
        },
        slash_def: {
          value: row.slash_def,
          slash_def_efficiency: calculateEfficiency(row.slash_def)
        },
        crush_def: {
          value: row.crush_def,
          crush_def_efficiency: calculateEfficiency(row.crush_def)
        },
        magic_def: {
          value: row.magic_def,
          magic_def_efficiency: calculateEfficiency(row.magic_def)
        },
        ranged_def: {
          value: row.ranged_def,
          ranged_def_efficiency: calculateEfficiency(row.ranged_def)
        },
        melee_strength: {
          value: row.melee_strength,
          melee_strength_efficiency: calculateEfficiency(row.melee_strength)
        },
        ranged_strength: {
          value: row.ranged_strength,
          ranged_strength_efficiency: calculateEfficiency(row.ranged_strength)
        },
        magic_damage: {
          value: row.magic_damage,
          magic_damage_efficiency: calculateEfficiency(row.magic_damage)
        },
        prayer_bonus: {
          value: row.prayer_bonus,
          prayer_bonus_efficiency: calculateEfficiency(row.prayer_bonus)
        },
        speed: {
          value: row.speed,
          speed_efficiency: row.speed !== null && row.speed !== 0 && price !== null && price !== 0
            ? Math.round((price / row.speed) * 1000000) / 1000000 // For speed, lower is better, so price per speed unit
            : null
        }
      };
    });

    res.json(equipments);
  } catch (err) {
    console.error("Error fetching equipments:", err);
    res.status(500).json({ error: "Error fetching equipments." });
  }
});

// Test endpoint to show a sample of the equipment data structure
router.get("/equipments/sample", async (req: express.Request, res: express.Response) => {
  try {
    const result = await pool.query(`
      SELECT
        ea.item_id,
        i.name as item_name,
        p.current_price,
        ea.stab_acc,
        ea.slash_acc,
        ea.crush_acc,
        ea.magic_acc,
        ea.ranged_acc,
        ea.stab_def,
        ea.slash_def,
        ea.crush_def,
        ea.magic_def,
        ea.ranged_def,
        ea.melee_strength,
        ea.ranged_strength,
        ea.magic_damage,
        ea.prayer_bonus,
        ea.weight,
        ea.speed,
        ea.slot
      FROM equipment_attributes ea
      JOIN items i ON ea.item_id = i.id
      LEFT JOIN item_prices p ON ea.item_id = p.item_id
      WHERE p.current_price IS NOT NULL AND p.current_price > 0
      ORDER BY ea.slot, i.name
      LIMIT 3
    `);

    // Transform the data to include efficiency calculations
    const equipments = result.rows.map(row => {
      const price = row.current_price;

      // Helper function to calculate efficiency (attribute per gp)
      const calculateEfficiency = (attributeValue: number | null): number | null => {
        if (attributeValue === null || attributeValue === 0 || price === null || price === 0) {
          return null;
        }
        // Use more precision for very small efficiency values
        const efficiency = attributeValue / price;
        return Math.round(efficiency * 1000000000) / 1000000000; // Round to 9 decimal places
      };

      return {
        item_id: row.item_id,
        item_name: row.item_name,
        current_price: row.current_price,
        slot: row.slot,
        stab_acc: {
          value: row.stab_acc,
          stab_acc_efficiency: calculateEfficiency(row.stab_acc)
        },
        slash_acc: {
          value: row.slash_acc,
          slash_acc_efficiency: calculateEfficiency(row.slash_acc)
        },
        crush_acc: {
          value: row.crush_acc,
          crush_acc_efficiency: calculateEfficiency(row.crush_acc)
        },
        magic_acc: {
          value: row.magic_acc,
          magic_acc_efficiency: calculateEfficiency(row.magic_acc)
        },
        ranged_acc: {
          value: row.ranged_acc,
          ranged_acc_efficiency: calculateEfficiency(row.ranged_acc)
        },
        stab_def: {
          value: row.stab_def,
          stab_def_efficiency: calculateEfficiency(row.stab_def)
        },
        slash_def: {
          value: row.slash_def,
          slash_def_efficiency: calculateEfficiency(row.slash_def)
        },
        crush_def: {
          value: row.crush_def,
          crush_def_efficiency: calculateEfficiency(row.crush_def)
        },
        magic_def: {
          value: row.magic_def,
          magic_def_efficiency: calculateEfficiency(row.magic_def)
        },
        ranged_def: {
          value: row.ranged_def,
          ranged_def_efficiency: calculateEfficiency(row.ranged_def)
        },
        melee_strength: {
          value: row.melee_strength,
          melee_strength_efficiency: calculateEfficiency(row.melee_strength)
        },
        ranged_strength: {
          value: row.ranged_strength,
          ranged_strength_efficiency: calculateEfficiency(row.ranged_strength)
        },
        magic_damage: {
          value: row.magic_damage,
          magic_damage_efficiency: calculateEfficiency(row.magic_damage)
        },
        prayer_bonus: {
          value: row.prayer_bonus,
          prayer_bonus_efficiency: calculateEfficiency(row.prayer_bonus)
        },
        weight: {
          value: row.weight,
          weight_efficiency: row.weight !== null && row.weight !== 0 && price !== null && price !== 0
            ? Math.round((price / Math.abs(row.weight)) * 1000000) / 1000000 // For weight, lower is better, so price per weight unit
            : null
        },
        speed: {
          value: row.speed,
          speed_efficiency: row.speed !== null && row.speed !== 0 && price !== null && price !== 0
            ? Math.round((price / row.speed) * 1000000) / 1000000 // For speed, lower is better, so price per speed unit
            : null
        }
      };
    });

    res.json(equipments);
  } catch (err) {
    console.error("Error fetching sample equipments:", err);
    res.status(500).json({ error: "Error fetching sample equipments." });
  }
});

export default router;