// Shared type definitions for API responses

export interface ApiItem {
  id: number;
  name: string;
  members: boolean;
  max_limit: number;
  value: number;
  highalch: number;
  lowalch: number;
  icon: string;
  current_price: number;
  current_trend: string;
  volume: number;
  today_price: number;
  today_trend: string;
  fetched_at: string;
}

// Equipment attribute with efficiency calculation
export interface EquipmentAttribute {
  value: number | null;
  [key: string]: number | null; // For efficiency properties like "stab_acc_efficiency"
}

// Equipment item from the /optimal/equipments endpoint
export interface EquipmentItem {
  item_id: number;
  item_name: string;
  current_price: string;
  slot: string;
  stab_acc: EquipmentAttribute;
  slash_acc: EquipmentAttribute;
  crush_acc: EquipmentAttribute;
  magic_acc: EquipmentAttribute;
  ranged_acc: EquipmentAttribute;
  stab_def: EquipmentAttribute;
  slash_def: EquipmentAttribute;
  crush_def: EquipmentAttribute;
  magic_def: EquipmentAttribute;
  ranged_def: EquipmentAttribute;
  melee_strength: EquipmentAttribute;
  ranged_strength: EquipmentAttribute;
  magic_damage: EquipmentAttribute;
  prayer_bonus: EquipmentAttribute;
  weight: EquipmentAttribute;
  speed: EquipmentAttribute;
}

// Grouped equipment by slot
export interface SlotEquipment {
  slot: string;
  items: EquipmentItem[];
}

// Consumable effect with efficiency calculation
export interface ConsumableEffect {
  skill: string;
  amount: number;
  efficiency: number | null;
  amount_per_bite: number;
}

// Consumable item from the /consumables endpoint
export interface Consumable {
  item_id: number;
  item_name: string;
  current_price: string;
  effects: {
    [effect_type: string]: ConsumableEffect;
  };
  bites: number;
}

// Top healing food from /consumables/healing/top endpoint
export interface TopHealingFood {
  item_id: number;
  item_name: string;
  current_price: string;
  healing: number;
  bites: number;
  healing_per_gp: number;
  healing_per_bite: number;
}
