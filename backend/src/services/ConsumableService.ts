// Business logic for consumables
import { pool } from '../db/initDB.js';
import { calculateEfficiency } from '../utils/index.js';
import { QUERY_LIMITS } from '../config/index.js';
import type { ConsumableWithEfficiency, EffectType } from '../models/index.js';

export class ConsumableService {
  /**
   * Get all consumables with efficiency calculations
   */
  static async getAllConsumables(): Promise<ConsumableWithEfficiency[]> {
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

      // Add effect with efficiency calculation
      item.effects[row.effect_type] = {
        skill: row.skill,
        amount: amount,
        efficiency: calculateEfficiency(amount, price),
        amount_per_bite: row.bites > 0 ? Math.round((amount / row.bites) * 100) / 100 : amount
      };
    });

    return Array.from(consumablesMap.values());
  }

  /**
   * Get top healing foods by efficiency
   */
  static async getTopHealingFoods(limit: number = QUERY_LIMITS.DEFAULT_HEALING_FOODS) {
    const safeLimit = Math.min(limit, QUERY_LIMITS.MAX_HEALING_FOODS);
    
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
    `, [safeLimit]);

    return result.rows;
  }

  /**
   * Get consumables by effect type
   */
  static async getConsumablesByEffectType(effectType: EffectType) {
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

    return result.rows;
  }
}
