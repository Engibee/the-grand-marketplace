import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import cron from "node-cron";
import { fileURLToPath } from "url";
import itemsRouter from "./routes/items.js";
import optimalRouter from "./routes/optimal.js";
import consumablesRouter from "./routes/consumables.js";
import { initDB } from "./db/initDB.js";
import { populateItems } from "./db/populateItems.js";
import { populatePrices } from "./db/populatePrices.js";
import { populateVolumes } from "./db/populateVolumes.js";
import { scrapeAllSlots } from "./scraping/scrapeEquipment.js";
import { scrapeAndProcessFood } from "./scraping/scrapeConsumable.js";
import type { Application } from "express";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the project root (2 levels up from backend/src/)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const app: Application = express();
const PORTDB = process.env.PORT || 3000;
const PORT = 3001;

// Middlewares
app.use(cors());
app.use(express.json());

(async () => {
  try {
    await initDB();

    //INITIAL POPULATE/SCRAPE
    await populateItems();
    await populatePrices();
    await populateVolumes();

    // Only run scraping if not disabled by environment variable
    const disableScraping = process.env.DISABLE_SCRAPING === 'true';
    if (!disableScraping) {
      console.log("🕷️ Starting initial scraping process...");
      await scrapeAllSlots().catch((error) => {
        console.error("❌ Initial scraping failed, but continuing with server startup:", error);
      });
      await scrapeAndProcessFood().catch((error) => {
        console.error("❌ Initial food scraping failed, but continuing with server startup:", error);
      });
    } else {
      console.log("⏭️ Scraping disabled by DISABLE_SCRAPING environment variable");
    }

    //SCHEDULE FOR WEEKLY UPDATE
    if (!disableScraping) {
      cron.schedule("59 23 * * 3", async () => {
        await populateItems().catch((error) => {
          console.error("❌ Critical error in populating items:", error);
        });
        await scrapeAllSlots().catch((error) => {
          console.error("❌ Critical error in scraping process:", error);
        });
        await scrapeAndProcessFood().catch((error) => {
          console.error("❌ Critical error in food scraping process:", error);
        });
        console.log("✅ Weekly update completed!");
      });
    }

    //SCHEDULE FOR HOURLY UPDATE
    cron.schedule("0 */3 * * *", async () => {
      await populatePrices();
      await populateVolumes();
      console.log("✅ Hourly update completed!");
    });

    app.use(express.json());
    app.use("/items", itemsRouter);

    app.listen(PORT, () => {
      console.log(`Database running on port: ${PORTDB}`);
    });
  } catch (err) {
    console.error("Error starting database:", err);
    process.exit(1);
  }
})();

//Routes
app.use("/items", itemsRouter);

app.use("/optimal", optimalRouter);

app.use("/consumables", consumablesRouter);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
