// Business logic for equipment
import { pool } from '../db/initDB.js';
import { calculateEfficiency } from '../utils/index.js';
import { QUERY_LIMITS } from '../config/index.js';
import type { EquipmentAttribute } from '../models/index.js';

export interface EquipmentWithEfficiency {
  item_id: number;
  item_name: string;
  current_price: string;
  slot: string;
  stab_acc: { value: number | null; stab_acc_efficiency: number | null };
  slash_acc: { value: number | null; slash_acc_efficiency: number | null };
  crush_acc: { value: number | null; crush_acc_efficiency: number | null };
  magic_acc: { value: number | null; magic_acc_efficiency: number | null };
  ranged_acc: { value: number | null; ranged_acc_efficiency: number | null };
  stab_def: { value: number | null; stab_def_efficiency: number | null };
  slash_def: { value: number | null; slash_def_efficiency: number | null };
  crush_def: { value: number | null; crush_def_efficiency: number | null };
  magic_def: { value: number | null; magic_def_efficiency: number | null };
  ranged_def: { value: number | null; ranged_def_efficiency: number | null };
  melee_strength: { value: number | null; melee_strength_efficiency: number | null };
  ranged_strength: { value: number | null; ranged_strength_efficiency: number | null };
  magic_damage: { value: number | null; magic_damage_efficiency: number | null };
  prayer_bonus: { value: number | null; prayer_bonus_efficiency: number | null };
  weight?: { value: number | null; weight_efficiency: number | null };
  speed?: { value: number | null; speed_efficiency: number | null };
}

export interface OptimalEquipmentResult {
  item_id: number;
  item_name: string;
  current_price: string;
  slot: string;
  attribute_value: number;
  efficiency: number;
}

export class EquipmentService {
  /**
   * Get top equipment per slot for a specific attribute
   */
  static async getOptimalEquipmentByAttribute(
    attribute: EquipmentAttribute,
    topCount: number = QUERY_LIMITS.DEFAULT_EQUIPMENT_PER_SLOT
  ): Promise<OptimalEquipmentResult[]> {
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
      WHERE rank <= $1
      ORDER BY slot, efficiency DESC;
    `;

    const result = await pool.query(query, [topCount]);
    return result.rows;
  }

  /**
   * Transform equipment data to include efficiency calculations
   */
  private static transformEquipmentWithEfficiency(row: any, includeWeightAndSpeed = false): EquipmentWithEfficiency {
    const price = parseFloat(row.current_price) || 0;

    // Helper function to calculate efficiency with high precision
    const calculateAttributeEfficiency = (attributeValue: number | null): number | null => {
      if (attributeValue === null || attributeValue === 0 || price === 0) {
        return null;
      }
      const efficiency = attributeValue / price;
      return Math.round(efficiency * 1000000000) / 1000000000; // Round to 9 decimal places
    };

    // Helper for attributes where lower is better (speed, weight)
    const calculateInverseEfficiency = (attributeValue: number | null): number | null => {
      if (attributeValue === null || attributeValue === 0 || price === 0) {
        return null;
      }
      const efficiency = price / Math.abs(attributeValue);
      return Math.round(efficiency * 1000000) / 1000000;
    };

    const equipment: EquipmentWithEfficiency = {
      item_id: row.item_id,
      item_name: row.item_name,
      current_price: row.current_price,
      slot: row.slot,
      stab_acc: {
        value: row.stab_acc,
        stab_acc_efficiency: calculateAttributeEfficiency(row.stab_acc)
      },
      slash_acc: {
        value: row.slash_acc,
        slash_acc_efficiency: calculateAttributeEfficiency(row.slash_acc)
      },
      crush_acc: {
        value: row.crush_acc,
        crush_acc_efficiency: calculateAttributeEfficiency(row.crush_acc)
      },
      magic_acc: {
        value: row.magic_acc,
        magic_acc_efficiency: calculateAttributeEfficiency(row.magic_acc)
      },
      ranged_acc: {
        value: row.ranged_acc,
        ranged_acc_efficiency: calculateAttributeEfficiency(row.ranged_acc)
      },
      stab_def: {
        value: row.stab_def,
        stab_def_efficiency: calculateAttributeEfficiency(row.stab_def)
      },
      slash_def: {
        value: row.slash_def,
        slash_def_efficiency: calculateAttributeEfficiency(row.slash_def)
      },
      crush_def: {
        value: row.crush_def,
        crush_def_efficiency: calculateAttributeEfficiency(row.crush_def)
      },
      magic_def: {
        value: row.magic_def,
        magic_def_efficiency: calculateAttributeEfficiency(row.magic_def)
      },
      ranged_def: {
        value: row.ranged_def,
        ranged_def_efficiency: calculateAttributeEfficiency(row.ranged_def)
      },
      melee_strength: {
        value: row.melee_strength,
        melee_strength_efficiency: calculateAttributeEfficiency(row.melee_strength)
      },
      ranged_strength: {
        value: row.ranged_strength,
        ranged_strength_efficiency: calculateAttributeEfficiency(row.ranged_strength)
      },
      magic_damage: {
        value: row.magic_damage,
        magic_damage_efficiency: calculateAttributeEfficiency(row.magic_damage)
      },
      prayer_bonus: {
        value: row.prayer_bonus,
        prayer_bonus_efficiency: calculateAttributeEfficiency(row.prayer_bonus)
      }
    };

    if (includeWeightAndSpeed) {
      equipment.weight = {
        value: row.weight,
        weight_efficiency: calculateInverseEfficiency(row.weight)
      };
      equipment.speed = {
        value: row.speed,
        speed_efficiency: calculateInverseEfficiency(row.speed)
      };
    }

    return equipment;
  }

  /**
   * Get all equipment with efficiency calculations
   */
  static async getAllEquipment(): Promise<EquipmentWithEfficiency[]> {
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

    return result.rows.map(row => this.transformEquipmentWithEfficiency(row, false));
  }

  /**
   * Get sample equipment data for testing
   */
  static async getSampleEquipment(limit: number = 3): Promise<EquipmentWithEfficiency[]> {
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
      LIMIT $1
    `, [limit]);

    return result.rows.map(row => this.transformEquipmentWithEfficiency(row, true));
  }
}
