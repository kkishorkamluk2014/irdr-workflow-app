import { Router, Response } from "express";
import prisma from "../models/prisma";
import { AuthRequest } from "../middleware/auth";

const router = Router();

// List warehouses
router.get("/", async (_req: AuthRequest, res: Response) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      include: { _count: { select: { inventoryItems: true } } },
    });
    res.json(warehouses);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch warehouses" });
  }
});

// List plants
router.get("/plants", async (_req: AuthRequest, res: Response) => {
  try {
    const plants = await prisma.plant.findMany({
      orderBy: { name: "asc" },
    });
    res.json(plants);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch plants" });
  }
});

// Create warehouse
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { name, code, address, city, state, capacity, capacityUnit } =
      req.body;
    const warehouse = await prisma.warehouse.create({
      data: {
        name,
        code,
        address,
        city,
        state,
        capacity: capacity ? Number(capacity) : null,
        capacityUnit,
      },
    });
    res.status(201).json(warehouse);
  } catch (error) {
    res.status(500).json({ error: "Failed to create warehouse" });
  }
});

// Warehouse inward confirmation (Phase 6)
router.post("/:id/inward", async (req: AuthRequest, res: Response) => {
  try {
    const { inventoryItemId, quantity, blNumber, batchNumber } = req.body;

    // Update inventory item status
    await prisma.inventoryItem.update({
      where: { id: inventoryItemId },
      data: { status: "DELIVERED", warehouseId: req.params.id },
    });

    // Record warehouse activity
    const activity = await prisma.warehouseActivity.create({
      data: {
        warehouseId: req.params.id,
        inventoryItemId,
        activityType: "INWARD",
        description: "Warehouse inward confirmation",
        quantity: Number(quantity),
        blNumber,
        batchNumber,
      },
    });

    res.status(201).json(activity);
  } catch (error) {
    res.status(500).json({ error: "Failed to record inward" });
  }
});

// Generate delivery order (Phase 6)
router.post("/:id/delivery-order", async (req: AuthRequest, res: Response) => {
  try {
    const { material, quantity, unit, customerName, deliveryDate } = req.body;
    const orderNumber = `DO-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;

    const order = await prisma.deliveryOrder.create({
      data: {
        orderNumber,
        warehouseId: req.params.id,
        material,
        quantity: Number(quantity),
        unit: unit || "MT",
        customerName,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      },
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: "Failed to create delivery order" });
  }
});

// Record warehouse activity
router.post("/:id/activity", async (req: AuthRequest, res: Response) => {
  try {
    const {
      inventoryItemId,
      activityType,
      description,
      quantity,
      expenseAmount,
      blNumber,
      batchNumber,
    } = req.body;

    const activity = await prisma.warehouseActivity.create({
      data: {
        warehouseId: req.params.id,
        inventoryItemId,
        activityType,
        description,
        quantity: quantity ? Number(quantity) : null,
        expenseAmount: Number(expenseAmount || 0),
        blNumber,
        batchNumber,
      },
    });

    res.status(201).json(activity);
  } catch (error) {
    res.status(500).json({ error: "Failed to record activity" });
  }
});

// List plants
router.get("/plants", async (_req: AuthRequest, res: Response) => {
  try {
    const plants = await prisma.plant.findMany({
      include: { _count: { select: { inventoryItems: true } } },
    });
    res.json(plants);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch plants" });
  }
});

// Create plant
router.post("/plants", async (req: AuthRequest, res: Response) => {
  try {
    const { name, code, address, city, state } = req.body;
    const plant = await prisma.plant.create({
      data: { name, code, address, city, state },
    });
    res.status(201).json(plant);
  } catch (error) {
    res.status(500).json({ error: "Failed to create plant" });
  }
});

export { router as warehouseRoutes };
