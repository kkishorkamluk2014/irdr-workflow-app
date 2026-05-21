import { Router, Response } from 'express';
import prisma from '../models/prisma';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// List shipments
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { contractId, status } = req.query;
    const where: any = {};
    if (contractId) where.contractId = contractId;
    if (status) where.status = status;

    const shipments = await prisma.shipment.findMany({
      where,
      include: { contract: { select: { importRefNumber: true, material: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(shipments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch shipments' });
  }
});

// Create shipment
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { contractId, blNumber, vesselName, cargoType, loadingPort, destinationPort, departureDate } = req.body;

    const shipment = await prisma.shipment.create({
      data: {
        contractId,
        blNumber,
        vesselName,
        cargoType,
        loadingPort,
        destinationPort,
        departureDate: departureDate ? new Date(departureDate) : null,
        status: 'IMPORT_IN_TRANSIT',
      },
    });

    // Update contract status
    await prisma.importContract.update({
      where: { id: contractId },
      data: { status: 'IMPORT_IN_TRANSIT' },
    });

    res.status(201).json(shipment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create shipment' });
  }
});

// Update shipment - arrival / BOE filing
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { arrivalDate, boeFilingDate, clearanceDate, status } = req.body;
    const data: any = {};

    if (arrivalDate) data.arrivalDate = new Date(arrivalDate);
    if (boeFilingDate) data.boeFilingDate = new Date(boeFilingDate);
    if (clearanceDate) data.clearanceDate = new Date(clearanceDate);
    if (status) data.status = status;

    const shipment = await prisma.shipment.update({
      where: { id: req.params.id },
      data,
    });

    // Also update contract status
    if (status) {
      await prisma.importContract.update({
        where: { id: shipment.contractId },
        data: { status },
      });
    }

    res.json(shipment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update shipment' });
  }
});

export { router as shipmentRoutes };
