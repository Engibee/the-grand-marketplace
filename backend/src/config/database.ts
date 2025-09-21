// Database configuration and connection settings

// Cache configuration
export const CACHE_CONFIG = {
  DURATION: 5 * 60 * 1000, // 5 minutes
} as const;

// API endpoints
export const API_ENDPOINTS = {
  GRAND_EXCHANGE_PRICES: "https://grandexchange.tools/api/prices",
  GRAND_EXCHANGE_VOLUMES: "https://grandexchange.tools/api/volumes",
  OSRS_ITEMS: "https://grandexchange.tools/api/items"
} as const;

// Query limits
export const QUERY_LIMITS = {
  DEFAULT_HEALING_FOODS: 20,
  MAX_HEALING_FOODS: 100,
  DEFAULT_EQUIPMENT_PER_SLOT: 5,
  MAX_SEARCH_RESULTS: 1000
} as const;
