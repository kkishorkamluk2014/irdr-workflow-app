import { Router, Response } from 'express';
import prisma from '../models/prisma';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// List inventory items
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { blNumber, batchNumber, isFunded, status, inventoryType } = req.query;
    const where: any = {};
    if (blNumber) where.blNumber = blNumber;
    if (batchNumber) where.batchNumber = batchNumber;
    if (isFunded !== undefined) where.isFunded = isFunded === 'true';
    if (status) where.status = status;
    if (inventoryType) where.inventoryType = inventoryType;

    const items = await prisma.inventoryItem.findMany({
      where,
      include: {
        warehouse: { select: { name: true, code: true } },
        plant: { select: { name: true, code: true } },
        contract: { select: { importRefNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// Create inventory item (Phase 4)
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      contractId, inventoryType, material, quantity, unit,
      blNumber, batchNumber, warehouseId, plantId,
    } = req.body;

    // BL or Batch mandatory for import
    if (inventoryType === 'IMPORT' && !blNumber && !batchNumber) {
      res.status(400).json({ error: 'BL Number or Batch Number is mandatory for import inventory' });
      return;
    }

    const item = await prisma.inventoryItem.create({
      data: {
        contractId,
        inventoryType,
        material,
        quantity: Number(quantity),
        unit: unit || 'MT',
        blNumber,
        batchNumber,
        warehouseId,
        plantId,
        status: 'ACTIVE_INVENTORY',
      },
    });

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create inventory item' });
  }
});

// Stock transfer (Phase 4)
router.post('/:id/transfer', async (req: AuthRequest, res: Response) => {
  try {
    const { toWarehouseId, toPlantId, quantity, transportCost, loadingCost, unloadingCost, labourCost } = req.body;
    const item = await prisma.inventoryItem.findUnique({ where: { id: req.params.id } });

    if (!item) {
      res.status(404).json({ error: 'Inventory item not found' });
      return;
    }

    if (item.blockedForTransfer) {
      res.status(403).json({ error: 'Item is blocked for transfer (funded inventory)' });
      return;
    }

    const fromLocation = item.warehouseId || item.plantId || 'Port';
    const toLocation = toWarehouseId || toPlantId || 'Unknown';

    // Create movement record
    await prisma.stockMovement.create({
      data: {
        inventoryItemId: item.id,
        fromLocation,
        toLocation,
        quantity: Number(quantity),
        transportCost: Number(transportCost || 0),
        loadingCost: Number(loadingCost || 0),
        unloadingCost: Number(unloadingCost || 0),
        labourCost: Number(labourCost || 0),
      },
    });

    // Update item location
    const updateData: any = {};
    if (toWarehouseId) {
      updateData.warehouseId = toWarehouseId;
      updateData.plantId = null;
      updateData.status = 'WAREHOUSE_INWARD_PENDING';
    }
    if (toPlantId) {
      updateData.plantId = toPlantId;
      updateData.warehouseId = null;
    }

    const updated = await prisma.inventoryItem.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Stock transfer failed' });
  }
});

// Mark as funded inventory (Phase 5)
router.post('/:id/fund', async (req: AuthRequest, res: Response) => {
  try {
    const { fundingAgency, fundingAmount } = req.body;

    const updated = await prisma.inventoryItem.update({
      where: { id: req.params.id },
      data: {
        isFunded: true,
        isDeadInventory: true,
        fundingAgency,
        fundingAmount: Number(fundingAmount),
        fundingStartDate: new Date(),
        blockedForSale: true,
        blockedForTransfer: true,
        blockedForConsumption: true,
        status: 'FUNDED_INVENTORY',
      },
    });

    await prisma.auditLog.create({
      data: {
        entityType: 'InventoryItem',
        entityId: updated.id,
        action: 'FUNDED',
        description: `Inventory marked as funded. Agency: ${fundingAgency}`,
        inventoryItemId: updated.id,
        contractId: updated.contractId,
        performedById: req.userId!,
      },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark as funded' });
  }
});

// Release funded inventory (Phase 5)
router.post('/:id/release-funding', async (req: AuthRequest, res: Response) => {
  try {
    const item = await prisma.inventoryItem.findUnique({ where: { id: req.params.id } });
    if (!item || !item.isFunded) {
      res.status(400).json({ error: 'Item is not under funding' });
      return;
    }

    const updated = await prisma.inventoryItem.update({
      where: { id: req.params.id },
      data: {
        isFunded: false,
        isDeadInventory: false,
        fundingReleaseDate: new Date(),
        ownershipTransferred: true,
        blockedForSale: false,
        blockedForTransfer: false,
        blockedForConsumption: false,
        status: 'ACTIVE_INVENTORY',
      },
    });

    await prisma.auditLog.create({
      data: {
        entityType: 'InventoryItem',
        entityId: updated.id,
        action: 'FUNDING_RELEASED',
        description: `Funding released. Ownership transferred. Agency: ${item.fundingAgency}`,
        inventoryItemId: updated.id,
        contractId: updated.contractId,
        performedById: req.userId!,
      },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to release funding' });
  }
});

// Update funding costs (interest, storage, labour)
router.patch('/:id/funding-costs', async (req: AuthRequest, res: Response) => {
  try {
    const { interestAccrued, storageCost, labourCost } = req.body;
    const updated = await prisma.inventoryItem.update({
      where: { id: req.params.id },
      data: {
        interestAccrued: interestAccrued !== undefined ? Number(interestAccrued) : undefined,
        storageCost: storageCost !== undefined ? Number(storageCost) : undefined,
        labourCost: labourCost !== undefined ? Number(labourCost) : undefined,
      },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update funding costs' });
  }
});

export { router as inventoryRoutes };
