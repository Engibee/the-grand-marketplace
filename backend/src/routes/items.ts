import express from "express";
const router = express.Router();
import { ItemService } from "../services/index.js";

router.get("/", async (req: express.Request, res: express.Response) => {
  try {
    const items = await ItemService.getAllItems();
    res.json(items);
  } catch (err) {
    console.error("Erro ao buscar items:", err);
    res.status(500).json({ error: "Erro ao buscar items" });
  }
});

router.get("/prices", async (req, res) => {
  try {
    const itemsWithPrices = await ItemService.getAllItemsWithPrices();
    res.json(itemsWithPrices);
  } catch (err) {
    console.error("Error while fetching prices:", err);
    res.status(500).json({ error: "Error while fetching prices." });
  }
});

router.get("/search", async (req: express.Request, res: express.Response) => {
   try {
    const { name } = req.query;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Query param 'name' é obrigatório" });
    }

    const items = await ItemService.searchItemsByName(name);
    return res.json(items);
  } catch (err) {
    console.error("❌ Error while fetching items:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// Get item by ID
router.get("/:id", async (req: express.Request, res: express.Response) => {
  try {
    const itemId = parseInt(req.params.id || "");

    if (isNaN(itemId)) {
      return res.status(400).json({ error: "Invalid item ID" });
    }

    const item = await ItemService.getItemById(itemId);

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json(item);
  } catch (err) {
    console.error("Error fetching item:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Get most expensive items
router.get("/analytics/expensive", async (req: express.Request, res: express.Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const items = await ItemService.getMostExpensiveItems(limit);
    res.json(items);
  } catch (err) {
    console.error("Error fetching expensive items:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Get most traded items
router.get("/analytics/traded", async (req: express.Request, res: express.Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const items = await ItemService.getMostTradedItems(limit);
    res.json(items);
  } catch (err) {
    console.error("Error fetching most traded items:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
