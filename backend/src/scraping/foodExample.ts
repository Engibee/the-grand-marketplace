// Simple food scraper example using the puppeteer helper
// This shows how to use the helper functions for a real scraping task

import { pool } from '../db/initDB.js';
import { 
  launchBrowser, 
  createPage, 
  goToPage, 
  waitForElement, 
  wait, 
  closeBrowser,
  parseNumber,
  getItemName
} from './puppeteerHelper.js';

// What we want to scrape from each food item
interface FoodItem {
  name: string;
  healing: number;
  bites?: number;
  delayedHeal?: number;
}

/**
 * Scrape food items from the OSRS wiki food page
 */
export async function scrapeFoodItems(): Promise<FoodItem[]> {
  console.log("🍎 Starting food scraping...");
  
  // Step 1: Start browser (set to true to see what's happening)
  const browser = await launchBrowser();
  
  try {
    // Step 2: Create a new page
    const page = await createPage(browser);
    
    // Step 3: Go to the food page
    await goToPage(page, "https://oldschool.runescape.wiki/w/Food/All_food");
    
    // Step 4: Wait for the food table to load
    await waitForElement(page, 'table.wikitable');

    // Step 4.5: Add delay to see the page (for debugging)
    console.log("⏸️ Pausing 5 seconds so you can see the browser...");
    await wait(5000);
    
    // Step 5: Extract food data from the page
    console.log("📊 Extracting food data...");
    const debugInfo = await page.evaluate(() => {
      // This code runs inside the browser
      const results: any[] = [];
      const debugLogs: string[] = [];

      // Find all wiki tables on the page
      const tables = document.querySelectorAll('table.wikitable');
      debugLogs.push(`Found ${tables.length} tables on the page`);

      // Look through each table
      tables.forEach((table, tableIndex) => {
        console.log(`Processing table ${tableIndex + 1}`);

        // Get table headers to understand structure
        const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent?.trim());
        console.log(`Table ${tableIndex + 1} headers:`, headers);
        // Get all rows in the table
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        console.log(`Table ${tableIndex + 1} has ${rows.length} rows`);

        // First, let's see what's in the first few rows
        for (let i = 0; i < Math.min(4, rows.length); i++) {
          const row = rows[i];
          if (!row) continue;
          const cells = Array.from(row.querySelectorAll('td, th'));
          const cellTexts = cells.map(cell => cell.textContent?.trim()?.substring(0, 30) || '');
          console.log(`Row ${i + 1} cells:`, cellTexts);
        }

        // Look through each row individually (not in pairs)
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (!row) continue;

          // Get all cells from this row
          const cells = Array.from(row.querySelectorAll('td, th'));

          // Skip if not enough cells
          if (cells.length < 2) continue;

          // Extract food name from Column 2
          const nameCell = cells[1]; // Column 2 has the food name
          const link = nameCell?.querySelector('a');
          const itemName = link?.getAttribute('title') || link?.textContent?.trim() || nameCell?.textContent?.trim();

          // Skip if no valid food name
          if (!itemName || itemName.includes('File:') || itemName.length < 2) {
            continue;
          }

          // Extract healing amount from Column 3
          const healingCell = cells[2]; // Column 3 has the healing amount
          const healingText = healingCell?.textContent?.trim();

          if (!healingText) continue;

          // Parse healing and bites from formats like:
          // "3" = 3 healing, 1 bite, 0 delayed
          // "4 × 3" = 4 healing, 3 bites, 0 delayed
          // "5×2" = 5 healing, 2 bites, 0 delayed
          // "12 + 9" = 12 healing, 1 bite, 9 delayed (delayed healing)
          // "(3 - 13) × 4" = 0 healing, 4 bites, 0 delayed (variable healing)
          // "3 - 7%" = 0 healing, 1 bite, 0 delayed (variable healing)
          let healing = 0;
          let bites = 1;
          let delayedHeal = 0;

          // Check for delayed healing format first "x + y"
          const delayedFormat = healingText.match(/(\d+)\s*\+\s*(\d+)/);
          if (delayedFormat) {
            // Format like "12 + 9" = 12 immediate, 9 delayed
            healing = parseInt(delayedFormat[1] || '0');
            delayedHeal = parseInt(delayedFormat[2] || '0');
            bites = 1; // Default to 1 bite for delayed healing
          } else {
            // Check for variable healing formats (set healing to 0)
            const variableHealing = healingText.match(/\(\d+\s*-\s*\d+\)|(\d+)\s*-\s*(\d+)|\d+%|Random|Up to \d+/i);
            if (variableHealing) {
              // Variable healing - set healing to 0, but still parse bites if present
              healing = 0;
              delayedHeal = 0;

              // Check if there are bites specified like "(3 - 13) × 4"
              const variableBites = healingText.match(/[×x]\s*(\d+)/);
              if (variableBites) {
                bites = parseInt(variableBites[1] || '1');
              } else {
                bites = 1;
              }
            } else {
              // Check for "number × number" format
              const multipleFormat = healingText.match(/(\d+)\s*[×x]\s*(\d+)/);
              if (multipleFormat) {
                // Format like "4 × 3" or "5×2"
                healing = parseInt(multipleFormat[1] || '0');
                bites = parseInt(multipleFormat[2] || '1');
                delayedHeal = 0;
              } else {
                // Simple number format like "3", "14", "20"
                const simpleMatch = healingText.match(/(\d+)/);
                if (!simpleMatch) continue; // Skip if no number found

                healing = parseInt(simpleMatch[1] || '0');
                bites = 1; // Default to 1 bite
                delayedHeal = 0;
              }
            }
          }

          // Add to results
          results.push({
            name: itemName,
            healing: healing,
            bites: bites,
            delayedHeal: delayedHeal
          });
        }
      });
      
      return { results, debugLogs };
    });

    // Print debug logs
    debugInfo.debugLogs.forEach(log => console.log(`🔍 ${log}`));

    console.log(`✅ Found ${debugInfo.results.length} food items`);
    return debugInfo.results;
    
  } finally {
    // Step 6: Always close the browser (even if something goes wrong)
    await closeBrowser(browser);
  }
}

/**
 * Match food items with items in our database
 */
async function matchFoodWithDatabase(foodItems: FoodItem[]): Promise<FoodItem[]> {
  console.log("🔍 Matching food items with database...");
  
  const client = await pool.connect();
  const matchedItems: FoodItem[] = [];
  
  try {
    for (const food of foodItems) {
      // Try to find this item in our items table
      let result = await client.query(
        'SELECT id FROM items WHERE LOWER(name) = LOWER($1)',
        [food.name]
      );

      // If not found, try adding dose numbers (4), (3), (2), (1) for potions/consumables
      if (result.rows.length === 0) {
        const doseVariations = ['(4)', '(3)', '(2)', '(1)'];

        for (const dose of doseVariations) {
          const nameWithDose = `${food.name}${dose}`;
          result = await client.query(
            'SELECT id FROM items WHERE LOWER(name) = LOWER($1)',
            [nameWithDose]
          );

          if (result.rows.length > 0) {
            console.log(`✅ Found "${food.name}" in database as "${nameWithDose}"`);
            // Update the food name to the matched version
            food.name = nameWithDose;

            // Force bites to match dose number for potions
            const doseNumber = parseInt(dose.replace(/[()]/g, ''));
            food.bites = doseNumber;
            console.log(`🧪 Potion detected: forcing bites to ${doseNumber} (dose amount)`);

            matchedItems.push(food);
            break;
          }
        }

        // If still not found after trying all dose variations
        if (result.rows.length === 0) {
          console.log(`⚠️ "${food.name}" not found in database (tried dose variations)`);
        }
      } else {
        // Found a direct match!
        matchedItems.push(food);
        console.log(`✅ Found "${food.name}" in database`);
      }
    }
  } finally {
    client.release();
  }
  
  console.log(`📊 Matched ${matchedItems.length} out of ${foodItems.length} food items`);
  return matchedItems;
}

/**
 * Insert matched food items into the consumable_attributes table
 */
async function insertFoodIntoDatabase(matchedItems: FoodItem[]): Promise<void> {
  if (matchedItems.length === 0) {
    console.log("📭 No matched items to insert into database");
    return;
  }

  const client = await pool.connect();
  let insertedCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  try {
    console.log(`\n💾 Inserting ${matchedItems.length} matched food items into database...`);
    console.log("=".repeat(60));

    for (const food of matchedItems) {
      try {
        // First, get the item_id from the items table
        const itemResult = await client.query(
          'SELECT id FROM items WHERE LOWER(name) = LOWER($1)',
          [food.name]
        );

        if (itemResult.rows.length === 0) {
          console.log(`⚠️ Item "${food.name}" not found in items table, skipping...`);
          errorCount++;
          continue;
        }

        const itemId = itemResult.rows[0].id;

        // Check if healing effect already exists
        const existingHeal = await client.query(`
          SELECT * FROM consumable_attributes
          WHERE item_id = $1 AND effect_type = $2 AND skill = $3
        `, [itemId, 'heal', 'hitpoints']);

        if (existingHeal.rows.length > 0) {
          // Update existing record
          await client.query(`
            UPDATE consumable_attributes
            SET amount = $4, bites = $5
            WHERE item_id = $1 AND effect_type = $2 AND skill = $3
          `, [
            itemId,
            'heal',
            'hitpoints',
            food.healing,
            food.bites || 1
          ]);
          updatedCount++;
          console.log(`🔄 Updated "${food.name}" (ID: ${itemId}) - ${food.healing} HP healing`);
        } else {
          // Insert new record
          await client.query(`
            INSERT INTO consumable_attributes (
              item_id, effect_type, skill, amount, bites
            ) VALUES ($1, $2, $3, $4, $5)
          `, [
            itemId,
            'heal',
            'hitpoints',
            food.healing,
            food.bites || 1
          ]);
          insertedCount++;
          console.log(`✅ Inserted "${food.name}" (ID: ${itemId}) - ${food.healing} HP healing`);
        }

        // If there's delayed healing, insert that as a separate effect
        if (food.delayedHeal && food.delayedHeal > 0) {
          const existingDelayed = await client.query(`
            SELECT * FROM consumable_attributes
            WHERE item_id = $1 AND effect_type = $2 AND skill = $3
          `, [itemId, 'delayed_heal', 'hitpoints']);

          if (existingDelayed.rows.length > 0) {
            // Update existing delayed heal record
            await client.query(`
              UPDATE consumable_attributes
              SET amount = $4, bites = $5
              WHERE item_id = $1 AND effect_type = $2 AND skill = $3
            `, [
              itemId,
              'delayed_heal',
              'hitpoints',
              food.delayedHeal,
              food.bites || 1
            ]);
          } else {
            // Insert new delayed heal record
            await client.query(`
              INSERT INTO consumable_attributes (
                item_id, effect_type, skill, amount, bites
              ) VALUES ($1, $2, $3, $4, $5)
            `, [
              itemId,
              'delayed_heal',
              'hitpoints',
              food.delayedHeal,
              food.bites || 1
            ]);
          }
          console.log(`  ⏰ Added delayed healing: +${food.delayedHeal} HP`);
        }

      } catch (error) {
        console.error(`❌ Error inserting "${food.name}":`, error);
        errorCount++;
      }
    }

  } finally {
    client.release();
  }

  console.log("\n📊 Database insertion summary:");
  console.log(`✅ Inserted: ${insertedCount} items`);
  console.log(`🔄 Updated: ${updatedCount} items`);
  console.log(`❌ Errors: ${errorCount} items`);
  console.log("=".repeat(60));
}

/**
 * Main function to scrape and process food items
 */
export async function scrapeAndProcessFood(): Promise<void> {
  try {
    // Step 1: Scrape food data from wiki
    const foodItems = await scrapeFoodItems();
    
    // Step 2: Wait a bit to be nice to the wiki
    await wait(1000);
    
    // Step 3: Match with our database
    const matchedItems = await matchFoodWithDatabase(foodItems);
    
    // Step 4: Insert matched items into database
    await insertFoodIntoDatabase(matchedItems);

    // Step 5: Show results
    console.log("\n📋 Results:");
    matchedItems.forEach(item => {
      const delayedText = item.delayedHeal && item.delayedHeal > 0 ? ` + ${item.delayedHeal} delayed` : '';
      console.log(`- ${item.name}: ${item.healing} HP (${item.bites} bites)${delayedText}`);
    });

    console.log("\n🎉 Food scraping completed!");
    
  } catch (error) {
    console.error("❌ Error scraping food:", error);
  }
}

// Uncomment this line to test the scraper:
await scrapeAndProcessFood();
