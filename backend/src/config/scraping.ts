// Scraping configuration constants
import type { SlotConfig } from '../models/index.js';

// Equipment slot configurations for scraping
export const SLOT_CONFIGS: Record<string, SlotConfig> = {
  ammunition: {
    name: "Ammunition",
    url: "https://oldschool.runescape.wiki/w/Ammunition"
  },
  body: {
    name: "Body",
    url: "https://oldschool.runescape.wiki/w/Body_armour"
  },
  cape: {
    name: "Cape",
    url: "https://oldschool.runescape.wiki/w/Cape"
  },
  feet: {
    name: "Feet",
    url: "https://oldschool.runescape.wiki/w/Boots"
  },
  hands: {
    name: "Hands",
    url: "https://oldschool.runescape.wiki/w/Gloves"
  },
  head: {
    name: "Head",
    url: "https://oldschool.runescape.wiki/w/Helmet"
  },
  legs: {
    name: "Legs",
    url: "https://oldschool.runescape.wiki/w/Leg_armour"
  },
  neck: {
    name: "Neck",
    url: "https://oldschool.runescape.wiki/w/Amulet"
  },
  ring: {
    name: "Ring",
    url: "https://oldschool.runescape.wiki/w/Ring"
  },
  shield: {
    name: "Shield",
    url: "https://oldschool.runescape.wiki/w/Shield"
  },
  weapon: {
    name: "Weapon",
    url: "https://oldschool.runescape.wiki/w/Weapon"
  }
};

// Scraping delays and timeouts
export const SCRAPING_CONFIG = {
  DELAY_BETWEEN_SLOTS: 2000, // 2 seconds
  PAGE_TIMEOUT: 30000, // 30 seconds
  NETWORK_IDLE_TIMEOUT: 'networkidle2' as const,
  BROWSER_ARGS: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--no-first-run',
  ]
} as const;
