// Equipment-related types and interfaces

// Equipment slot configuration for scraping
export interface SlotConfig {
  name: string;
  url: string;
}

// Scraped equipment data structure
export interface ScrapedEquipmentData {
  itemName: string; // Used for matching with items table
  matchedId?: number; // The ID from items table after matching
  stab_acc: number | null;
  slash_acc: number | null;
  crush_acc: number | null;
  magic_acc: number | null;
  ranged_acc: number | null;
  stab_def: number | null;
  slash_def: number | null;
  crush_def: number | null;
  magic_def: number | null;
  ranged_def: number | null;
  melee_strength: number | null;
  ranged_strength: number | null;
  magic_damage: number | null;
  prayer_bonus: number | null;
  weight: number | null;
  speed?: number | null; // Optional for weapons
  slot: string;
}

// Valid equipment attributes for API validation
export const VALID_EQUIPMENT_ATTRIBUTES = [
  'melee_strength', 
  'ranged_strength', 
  'magic_damage', 
  'stab_acc', 
  'slash_acc',
  'crush_acc', 
  'magic_acc', 
  'ranged_acc', 
  'stab_def', 
  'slash_def', 
  'crush_def',
  'magic_def', 
  'ranged_def', 
  'prayer_bonus'
] as const;

// Type for equipment attribute names
export type EquipmentAttribute = typeof VALID_EQUIPMENT_ATTRIBUTES[number];
