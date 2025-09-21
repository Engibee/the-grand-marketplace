console.log("📦 Loading scraping modules...");
import puppeteer from 'puppeteer';
import { pool } from '../db/initDB.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from "url";

console.log("🔧 Configuring environment...");
// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the project root (3 levels up from backend/src/scraping/)
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
console.log("✅ Modules loaded successfully!");

import type { SlotConfig, ScrapedEquipmentData } from '../models/index.js';

const SLOT_CONFIGS: Record<string, SlotConfig> = {
  ammunition: {
    name: "Ammunition",
    url: "https://oldschool.runescape.wiki/w/Ammunition_slot_table"
  },
  body: {
    name: "Body",
    url: "https://oldschool.runescape.wiki/w/Body_slot_table"
  },
  cape: {
    name: "Cape",
    url: "https://oldschool.runescape.wiki/w/Cape_slot_table"
  },
  feet: {
    name: "Feet",
    url: "https://oldschool.runescape.wiki/w/Feet_slot_table"
  },
  hands: {
    name: "Hands",
    url: "https://oldschool.runescape.wiki/w/Hands_slot_table"
  },
  head: {
    name: "Head",
    url: "https://oldschool.runescape.wiki/w/Head_slot_table"
  },
  legs: {
    name: "Legs",
    url: "https://oldschool.runescape.wiki/w/Legs_slot_table"
  },
  neck: {
    name: "Neck",
    url: "https://oldschool.runescape.wiki/w/Neck_slot_table"
  },
  ring: {
    name: "Ring",
    url: "https://oldschool.runescape.wiki/w/Ring_slot_table"
  },
  shield: {
    name: "Shield",
    url: "https://oldschool.runescape.wiki/w/Shield_slot_table"
  },
  two_handed: {
    name: "Two-handed",
    url: "https://oldschool.runescape.wiki/w/Two-handed_slot_table"
  },
  weapon: {
    name: "Weapon",
    url: "https://oldschool.runescape.wiki/w/Weapon_slot_table"
  }
};

async function scrapeWithPuppeteer(slotConfig: SlotConfig): Promise<ScrapedEquipmentData[]> {
  console.log(`🚀 Starting scrapeWithPuppeteer function for ${slotConfig.name} slot...`);
  console.log("Launching Chrome browser...");

  // Detect if running in Docker/Linux container vs local development
  const isDocker = process.env.NODE_ENV === 'production' || process.platform === 'linux';

  const browserOptions = {
    headless: true,
    args: isDocker ? [
      // Linux/Docker specific args
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ] : [
      // Windows/macOS development args
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run'
    ]
  };

  console.log(`🔧 Browser config: ${isDocker ? 'Docker/Linux' : 'Local development'}`);
  const browser = await puppeteer.launch(browserOptions);

  const page = await browser.newPage();

  // Set a realistic Chrome user agent
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  console.log("Navigating to:", slotConfig.url);
  await page.goto(slotConfig.url, { waitUntil: 'networkidle2' });

  console.log("Page loaded, extracting table data...");

  // Debug: Check what's on the page
  const pageTitle = await page.title();
  console.log("Page title:", pageTitle);

  // Check if tables exist
  const tableCount = await page.evaluate(() => {
    return {
      totalTables: document.querySelectorAll('table').length,
      wikitables: document.querySelectorAll('table.wikitable').length,
      tbodyRows: document.querySelectorAll('table.wikitable tbody tr').length,
      allRows: document.querySelectorAll('table.wikitable tr').length
    };
  });

  console.log("Table analysis:", tableCount);

  // Extract data using string evaluation to avoid transpilation issues
  const scrapedData = await page.evaluate(`
    (function() {
      var results = [];
      var rows = document.querySelectorAll('table.wikitable tbody tr');
      var slotName = "${slotConfig.name}";

      for (var i = 0; i < rows.length; i++) {
        var cells = rows[i].querySelectorAll('td');
        if (cells.length < 18) continue; // Need at least 18 columns for basic stats

        var secondCell = cells[1];
        if (!secondCell) continue;

        var itemName = '';
        var link = secondCell.querySelector('a[title]');
        if (link && link.getAttribute('title')) {
          itemName = link.getAttribute('title').trim();
        } else if (secondCell.textContent) {
          itemName = secondCell.textContent.trim();
        }

        if (itemName.length === 0) continue;

        function parseValue(index) {
          var cell = cells[index];
          if (!cell || !cell.textContent) return null;
          var text = cell.textContent.trim();
          if (text === '' || text === '−' || text === '-' || text === 'N/A') return null;
          var num = parseFloat(text);

          // Debug logging for magic_damage issues
          if (index === 15 && !isNaN(num)) {
            console.log('🔍 DEBUG: magic_damage parsing - text: "' + text + '", parsed: ' + num + ', type: ' + typeof num);
          }

          return isNaN(num) ? null : num;
        }

        var equipmentData = {
          itemName: itemName,
          stab_acc: parseValue(3),
          slash_acc: parseValue(4),
          crush_acc: parseValue(5),
          magic_acc: parseValue(6),
          ranged_acc: parseValue(7),
          stab_def: parseValue(8),
          slash_def: parseValue(9),
          crush_def: parseValue(10),
          magic_def: parseValue(11),
          ranged_def: parseValue(12),
          melee_strength: parseValue(13),
          ranged_strength: parseValue(14),
          magic_damage: parseValue(15),
          prayer_bonus: parseValue(16),
          weight: parseValue(17),
          slot: slotName
        };

        // Auto-detect if 19th column (speed) exists
        if (cells.length >= 19) {
          equipmentData.speed = parseValue(18);
        } else {
          equipmentData.speed = null;
        }

        results.push(equipmentData);
      }

      return results;
    })()
  `);

  await browser.close();
  return scrapedData as ScrapedEquipmentData[];
}





async function matchItemsWithDatabase(scrapedData: ScrapedEquipmentData[]): Promise<ScrapedEquipmentData[]> {
  const client = await pool.connect();
  const matchedItems: ScrapedEquipmentData[] = [];
  const insertedCount = { success: 0, failed: 0 };

  try {
    console.log(`\nMatching ${scrapedData.length} scraped items with database...`);
    console.log("=".repeat(60));

    for (const item of scrapedData) {
      // Query the database for exact match first
      let result = await client.query(
        'SELECT id, name FROM items WHERE LOWER(name) = LOWER($1)',
        [item.itemName]
      );

      let matchedId: number | null = null;

      if (result.rows.length > 0) {
        const match = result.rows[0];
        matchedId = match.id;
        console.log(`✅ EXACT MATCH: "${item.itemName}" → ID: ${match.id} (DB: "${match.name}")`);
      } else {
        // Try partial match if exact match fails
        result = await client.query(
          'SELECT id, name FROM items WHERE LOWER(name) LIKE LOWER($1) LIMIT 1',
          [`%${item.itemName}%`]
        );

        if (result.rows.length > 0) {
          const match = result.rows[0];
          matchedId = match.id;
          console.log(`🔍 PARTIAL MATCH: "${item.itemName}" → ID: ${match.id} (DB: "${match.name}")`);
        } else {
          console.log(`❌ NO MATCH: "${item.itemName}"`);
        }
      }

      // If we found a match, add the matched ID to the item and include it in results
      if (matchedId !== null) {
        item.matchedId = matchedId;
        matchedItems.push(item);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log(`Summary: ${matchedItems.length} matches found out of ${scrapedData.length} scraped items`);

    // Insert equipment attributes for matched items
    if (matchedItems.length > 0) {
      console.log("\n" + "=".repeat(60));
      console.log("Inserting equipment attributes into database...");

      for (const item of matchedItems) {
        try {
          // Debug logging for magic_damage before database insert
          if (item.magic_damage !== null && item.magic_damage !== undefined) {
            console.log('🔍 DEBUG: Before DB insert - magic_damage value: ' + item.magic_damage + ', type: ' + typeof item.magic_damage);
          }

          // Insert or update equipment attributes using the matched ID
          // Always include speed column, but it will be null for non-weapons
          await client.query(`
            INSERT INTO equipment_attributes (
              item_id, stab_acc, slash_acc, crush_acc, magic_acc, ranged_acc,
              stab_def, slash_def, crush_def, magic_def, ranged_def,
              melee_strength, ranged_strength, magic_damage, prayer_bonus,
              weight, speed, slot
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
            ON CONFLICT (item_id) DO UPDATE SET
              stab_acc = EXCLUDED.stab_acc,
              slash_acc = EXCLUDED.slash_acc,
              crush_acc = EXCLUDED.crush_acc,
              magic_acc = EXCLUDED.magic_acc,
              ranged_acc = EXCLUDED.ranged_acc,
              stab_def = EXCLUDED.stab_def,
              slash_def = EXCLUDED.slash_def,
              crush_def = EXCLUDED.crush_def,
              magic_def = EXCLUDED.magic_def,
              ranged_def = EXCLUDED.ranged_def,
              melee_strength = EXCLUDED.melee_strength,
              ranged_strength = EXCLUDED.ranged_strength,
              magic_damage = EXCLUDED.magic_damage,
              prayer_bonus = EXCLUDED.prayer_bonus,
              weight = EXCLUDED.weight,
              speed = EXCLUDED.speed,
              slot = EXCLUDED.slot
          `, [
            item.matchedId!, // Use the matched ID from the items table
            item.stab_acc,
            item.slash_acc,
            item.crush_acc,
            item.magic_acc,
            item.ranged_acc,
            item.stab_def,
            item.slash_def,
            item.crush_def,
            item.magic_def,
            item.ranged_def,
            item.melee_strength,
            item.ranged_strength,
            item.magic_damage,
            item.prayer_bonus,
            item.weight,
            item.speed, // Will be null for non-weapons, actual value for weapons
            item.slot
          ]);

          insertedCount.success++;
          console.log(`✅ Inserted equipment data for "${item.itemName}" (ID: ${item.matchedId})`);

        } catch (error) {
          insertedCount.failed++;
          console.error(`❌ Failed to insert equipment data for "${item.itemName}" (ID: ${item.matchedId}):`, error);
        }
      }

      console.log("\n" + "=".repeat(60));
      console.log(`Equipment insertion summary:`);
      console.log(`✅ Successfully inserted: ${insertedCount.success}`);
      console.log(`❌ Failed to insert: ${insertedCount.failed}`);
    }

  } finally {
    client.release();
  }

  return matchedItems;
}

export async function scrapeSlots(slotType: string): Promise<number[]> {
  const slotConfig = SLOT_CONFIGS[slotType];
  if (!slotConfig) {
    console.error(`❌ Unknown slot type: ${slotType}`);
    console.log(`Available slots: ${Object.keys(SLOT_CONFIGS).join(', ')}`);
    return [];
  }

  try {
    console.log(`🎯 Starting ${slotConfig.name} slot scraping process...`);
    const scrapedData = await scrapeWithPuppeteer(slotConfig);

    if (scrapedData.length > 0) {
      console.log(`Successfully scraped ${scrapedData.length} ${slotConfig.name.toLowerCase()} items from the wiki.`);

      // Match with database and insert equipment attributes
      const matchedItems = await matchItemsWithDatabase(scrapedData);

      // Return the matched IDs
      return matchedItems.map(item => item.matchedId!).filter(id => id !== undefined);
    } else {
      console.log(`No ${slotConfig.name.toLowerCase()} items found. The page structure might have changed.`);
      return [];
    }
  } catch (error) {
    console.error(`Error scraping ${slotConfig.name.toLowerCase()} data:`, error);
    console.log("You might need to check the page structure or try a different approach.");
    return [];
  }
}

// Helper functions for specific slots (optional - can use scrapeSlots() directly)
// async function scrapeAmmunitionSlots(): Promise<number[]> {
//   return scrapeSlots('ammunition');
// }
// async function scrapeBodySlots(): Promise<number[]> {
//   return scrapeSlots('body');
// }

// Main execution - scrape all equipment slots
export async function scrapeAllSlots() {
  console.log("🎯 Starting equipment scraping process for ALL slots...");

  const slotTypes = Object.keys(SLOT_CONFIGS);
  console.log(`📋 Will scrape ${slotTypes.length} slot types: ${slotTypes.join(', ')}`);

  for (const slotType of slotTypes) {
    try {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🔄 Processing slot: ${slotType.toUpperCase()}`);
      console.log(`${'='.repeat(80)}`);

      await scrapeSlots(slotType);
      console.log(`✅ Completed scraping for ${slotType} slot!`);

      // Add a small delay between slots to be respectful to the wiki
      console.log("⏳ Waiting 2 seconds before next slot...");
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`❌ Failed to scrape ${slotType} slot:`, error);
      console.log("🔄 Continuing with next slot...");
    }
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log("🎉 ALL SLOT SCRAPING COMPLETED!");
  console.log(`${'='.repeat(80)}`);
}