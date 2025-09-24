// Business logic for items
import { pool } from '../db/initDB.js';
import { QUERY_LIMITS } from '../config/index.js';

export interface ItemWithPrice {
  id: number;
  name: string;
  members: boolean;
  max_limit: number | null;
  value: number | null;
  highalch: number | null;
  lowalch: number | null;
  icon: string | null;
  current_price: string | null;
  current_trend: string | null;
  volume: number | null;
  today_price: string | null;
  today_trend: string | null;
  fetched_at: string | null;
}

export interface ItemPrice {
  id: number;
  name: string;
  current_price: string;
  current_trend: string;
  volume: number;
  today_price: string;
  today_trend: string;
  fetched_at: string;
}

export class ItemService {
  /**
   * Get all items
   */
  static async getAllItems() {
    const result = await pool.query("SELECT * FROM items");
    return result.rows;
  }

  /**
   * Get all items with their current prices
   */
  static async getAllItemsWithPrices(): Promise<ItemPrice[]> {
    const result = await pool.query(`
      SELECT i.id, i.name, p.current_price, p.current_trend, p.volume, p.today_price, p.today_trend, p.fetched_at
      FROM item_prices p
      JOIN items i ON i.id = p.item_id
      ORDER BY i.name
    `);
    return result.rows;
  }

  /**
   * Search items by name with optional price information
   */
  static async searchItemsByName(
    searchTerm: string,
    limit: number = QUERY_LIMITS.MAX_SEARCH_RESULTS
  ): Promise<ItemWithPrice[]> {
    if (!searchTerm || typeof searchTerm !== "string") {
      throw new Error("Search term is required and must be a string");
    }

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
      LIMIT $2
      `,
      [`%${searchTerm}%`, limit]
    );

    return result.rows;
  }

  /**
   * Get item by ID with price information
   */
  static async getItemById(itemId: number): Promise<ItemWithPrice | null> {
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
      WHERE i.id = $1
      `,
      [itemId]
    );

    return result.rows[0] || null;
  }

  /**
   * Get items by price range
   */
  static async getItemsByPriceRange(
    minPrice: number,
    maxPrice: number,
    limit: number = QUERY_LIMITS.MAX_SEARCH_RESULTS
  ): Promise<ItemWithPrice[]> {
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
      JOIN item_prices p ON i.id = p.item_id
      WHERE p.current_price::numeric BETWEEN $1 AND $2
        AND p.current_price IS NOT NULL
      ORDER BY p.current_price::numeric ASC
      LIMIT $3
      `,
      [minPrice, maxPrice, limit]
    );

    return result.rows;
  }

  /**
   * Get most expensive items
   */
  static async getMostExpensiveItems(limit: number = 10): Promise<ItemWithPrice[]> {
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
      JOIN item_prices p ON i.id = p.item_id
      WHERE p.current_price IS NOT NULL
      ORDER BY p.current_price::numeric DESC
      LIMIT $1
      `,
      [limit]
    );

    return result.rows;
  }

  /**
   * Get items with highest volume (most traded)
   */
  static async getMostTradedItems(limit: number = 10): Promise<ItemWithPrice[]> {
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
      JOIN item_prices p ON i.id = p.item_id
      WHERE p.volume IS NOT NULL AND p.volume > 0
      ORDER BY p.volume DESC
      LIMIT $1
      `,
      [limit]
    );

    return result.rows;
  }
}
