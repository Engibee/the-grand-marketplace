// Validation utilities
import { VALID_EQUIPMENT_ATTRIBUTES, VALID_EFFECT_TYPES } from '../models/index.js';
import type { EquipmentAttribute, EffectType } from '../models/index.js';

/**
 * Validates if an equipment attribute is valid
 */
export function isValidEquipmentAttribute(attribute: string): attribute is EquipmentAttribute {
  return VALID_EQUIPMENT_ATTRIBUTES.includes(attribute as EquipmentAttribute);
}

/**
 * Validates if an effect type is valid
 */
export function isValidEffectType(effectType: string): effectType is EffectType {
  return VALID_EFFECT_TYPES.includes(effectType as EffectType);
}

/**
 * Validates required query parameters
 */
export function validateRequiredParam(param: unknown, paramName: string): string {
  if (!param || typeof param !== "string") {
    throw new Error(`Query param '${paramName}' is required and must be a string`);
  }
  return param;
}
