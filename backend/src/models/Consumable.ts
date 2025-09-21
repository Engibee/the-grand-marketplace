// Consumable-related types and interfaces

// Food item structure for scraping
export interface FoodItem {
  name: string;
  healing: number;
  bites?: number;
  delayedHeal?: number;
}

// Consumable effect types
export const VALID_EFFECT_TYPES = [
  'heal', 
  'delayed_heal', 
  'boost', 
  'restore'
] as const;

// Type for effect type names
export type EffectType = typeof VALID_EFFECT_TYPES[number];

// Consumable attribute structure (matches database schema)
export interface ConsumableAttribute {
  item_id: number;
  effect_type: EffectType;
  skill: string;
  amount: number;
  bites: number;
}

// Consumable with efficiency calculations (API response)
export interface ConsumableWithEfficiency {
  item_id: number;
  item_name: string;
  current_price: string;
  effects: {
    [effect_type: string]: {
      skill: string;
      amount: number;
      efficiency: number | null;
      amount_per_bite: number;
    };
  };
  bites: number;
}
