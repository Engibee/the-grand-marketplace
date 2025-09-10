import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import itemsRouter from "./routes/items.js";
import optimalRouter from "./routes/optimal.js";
import { initDB } from "./db/initDB.js";
import { populateItems } from "./db/populateItems.js";
import { populatePrices } from "./db/populatePrices.js";
import { populateVolumes } from "./db/populateVolumes.js";
import { scrapeAllSlots, scrapeSlots } from "./scraping/scrapeEquipment.js";
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
    await populateItems();
    await populatePrices();
    await populateVolumes();
    await scrapeAllSlots().catch((error) => {
      console.error("❌ Critical error in scraping process:", error);
    });
    app.use(express.json());
    app.use("/items", itemsRouter);

    app.listen(PORT, () => {
      console.log(`Database running on port: ${PORTDB}`);
    });
  } catch (err) {
    console.error("Erro ao iniciar o DB:", err);
    process.exit(1);
  }
})();

// Routes
app.use("/items", itemsRouter);

app.use("/optimal", optimalRouter);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
