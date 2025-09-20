// Simple Puppeteer helper for scraping OSRS Wiki
// This file contains basic functions to launch browser and create pages
// Keep it simple and reusable!

import puppeteer, { Browser, Page } from "puppeteer";

/**
 * Launch a Puppeteer browser with good default settings
 * @param showBrowser - Set to true to see the browser window (useful for debugging)
 * @returns Browser instance
 */
export async function launchBrowser(showBrowser: boolean = false): Promise<Browser> {
  console.log("🚀 Starting browser...");
  
  // Launch browser with settings that work well in Docker and locally
  const browser = await puppeteer.launch({
    // headless: true = no browser window (faster, works in Docker)
    // headless: false = shows browser window (good for debugging)
    headless: !showBrowser,
    
    // These args help the browser work in different environments
    args: [
      '--no-sandbox',              // Required for Docker
      '--disable-setuid-sandbox',  // Required for Docker
      '--disable-dev-shm-usage',   // Prevents crashes in low-memory environments
      '--disable-gpu',             // Not needed for scraping
      '--no-first-run',           // Skip first-run setup
    ]
  });

  console.log(`✅ Browser started (headless: ${!showBrowser})`);
  return browser;
}

/**
 * Create a new page with good default settings
 * @param browser - The browser instance
 * @param customUserAgent - Optional custom user agent string
 * @returns Page instance ready for scraping
 */
export async function createPage(browser: Browser, customUserAgent?: string): Promise<Page> {
  // Create a new tab/page
  const page = await browser.newPage();
  
  // Set user agent (what the website thinks we are)
  // Default: pretend to be a normal Chrome browser
  const userAgent = customUserAgent || 
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  await page.setUserAgent(userAgent);
  
  // Set viewport size (like browser window size)
  await page.setViewport({ 
    width: 1920,   // Width in pixels
    height: 1080   // Height in pixels
  });
  
  // Set timeouts (how long to wait before giving up)
  page.setDefaultTimeout(30000);           // 30 seconds for most operations
  page.setDefaultNavigationTimeout(30000); // 30 seconds for page loads
  
  console.log("📄 New page created with default settings");
  return page;
}

/**
 * Navigate to a URL and wait for it to load completely
 * @param page - The page instance
 * @param url - The URL to visit
 */
export async function goToPage(page: Page, url: string): Promise<void> {
  console.log(`🌐 Going to: ${url}`);
  
  // Navigate to the URL and wait for network to be idle
  // 'networkidle2' means wait until there are no more than 2 network requests for 500ms
  await page.goto(url, { 
    waitUntil: 'networkidle2',  // Wait for page to fully load
    timeout: 30000              // Give up after 30 seconds
  });
  
  console.log("✅ Page loaded successfully");
}

/**
 * Wait for a specific element to appear on the page
 * @param page - The page instance
 * @param selector - CSS selector for the element to wait for
 * @param timeoutMs - How long to wait (default: 10 seconds)
 */
export async function waitForElement(page: Page, selector: string, timeoutMs: number = 10000): Promise<void> {
  console.log(`⏳ Waiting for element: ${selector}`);
  
  try {
    // Wait for the element to appear in the DOM
    await page.waitForSelector(selector, { timeout: timeoutMs });
    console.log(`✅ Element found: ${selector}`);
  } catch (error) {
    console.error(`❌ Element not found after ${timeoutMs}ms: ${selector}`);
    throw error;
  }
}

/**
 * Add a delay between operations (be nice to the website)
 * @param milliseconds - How long to wait
 */
export async function wait(milliseconds: number): Promise<void> {
  console.log(`⏸️ Waiting ${milliseconds}ms...`);
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

/**
 * Close the browser and clean up
 * @param browser - The browser instance to close
 */
export async function closeBrowser(browser: Browser): Promise<void> {
  console.log("🔒 Closing browser...");
  await browser.close();
  console.log("✅ Browser closed");
}

/**
 * Helper function to parse numbers from table cells
 * Handles common wiki formatting like "1,234", "N/A", "−", etc.
 * @param text - The text content from a table cell
 * @returns Number or null if not a valid number
 */
export function parseNumber(text: string | null | undefined): number | null {
  // Return null if no text
  if (!text) return null;
  
  // Clean up the text
  const cleaned = text.trim();
  
  // Return null for common "empty" values
  if (cleaned === '' || cleaned === 'N/A' || cleaned === '−' || cleaned === '-' || cleaned === '?') {
    return null;
  }
  
  // Remove commas and spaces, then try to parse as number
  const numberText = cleaned.replace(/[,\s]/g, '');
  const number = parseFloat(numberText);
  
  // Return null if not a valid number
  return isNaN(number) ? null : number;
}

/**
 * Helper function to extract item name from a table cell
 * Handles links and plain text
 * @param cell - The table cell element
 * @returns Item name or null
 */
export function getItemName(cell: Element | null): string | null {
  if (!cell) return null;
  
  // Try to find a link first (most wiki items are linked)
  const link = cell.querySelector('a');
  if (link && link.textContent) {
    return link.textContent.trim();
  }
  
  // Fallback to cell text content
  const text = cell.textContent?.trim();
  return text || null;
}

// Example usage (commented out):
/*
async function exampleUsage() {
  // 1. Start browser
  const browser = await launchBrowser(false); // true = show browser window
  
  // 2. Create page
  const page = await createPage(browser);
  
  // 3. Go to website
  await goToPage(page, "https://oldschool.runescape.wiki/w/Food");
  
  // 4. Wait for table to load
  await waitForElement(page, 'table.wikitable');
  
  // 5. Extract data (your scraping logic here)
  const data = await page.evaluate(() => {
    // This code runs in the browser
    const tables = document.querySelectorAll('table.wikitable');
    // ... your scraping logic
    return [];
  });
  
  // 6. Be nice - wait between requests
  await wait(2000); // Wait 2 seconds
  
  // 7. Close browser
  await closeBrowser(browser);
}
*/
