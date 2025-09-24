import express from "express";
const router = express.Router();
import { isValidEquipmentAttribute } from "../utils/index.js";
import { EquipmentService } from "../services/index.js";

// Get top 5 equipment per slot for specific attribute (optimized)
router.get("/equipments/:attribute", async (req: express.Request, res: express.Response) => {
  try {
    const { attribute } = req.params;

    // Validate attribute
    if (!attribute || !isValidEquipmentAttribute(attribute)) {
      return res.status(400).json({ error: "Invalid attribute" });
    }

    const topCount = parseInt(req.query.limit as string) || 5;
    const equipment = await EquipmentService.getOptimalEquipmentByAttribute(attribute, topCount);
    res.json(equipment);
  } catch (error) {
    console.error("Error fetching optimized equipment data:", error);
    res.status(500).json({ error: "Failed to fetch equipment data" });
  }
});

router.get("/equipments", async (req: express.Request, res: express.Response) => {
  try {
    const equipments = await EquipmentService.getAllEquipment();
    res.json(equipments);
  } catch (err) {
    console.error("Error fetching equipments:", err);
    res.status(500).json({ error: "Error fetching equipments." });
  }
});

// Test endpoint to show a sample of the equipment data structure
router.get("/equipments/sample", async (req: express.Request, res: express.Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 3;
    const equipments = await EquipmentService.getSampleEquipment(limit);
    res.json(equipments);
  } catch (err) {
    console.error("Error fetching sample equipments:", err);
    res.status(500).json({ error: "Error fetching sample equipments." });
  }
});

export default router;