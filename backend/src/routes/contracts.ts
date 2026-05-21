import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../models/prisma';
import { AuthRequest } from '../middleware/auth';
import { ocrExtractContract } from '../services/ocr';
import { validateContractAgainstBL } from '../services/validation';

const router = Router();

// List all contracts
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = status ? { status: status as any } : {};
    const [contracts, total] = await Promise.all([
      prisma.importContract.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: { createdBy: { select: { name: true, email: true } } },
      }),
      prisma.importContract.count({ where }),
    ]);

    res.json({ contracts, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
});

// Get single contract
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const contract = await prisma.importContract.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: { select: { name: true, email: true } },
        shipments: true,
        expenses: true,
        inventoryItems: true,
        approvals: true,
      },
    });
    if (!contract) {
      res.status(404).json({ error: 'Contract not found' });
      return;
    }
    res.json(contract);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contract' });
  }
});

// Create new contract (Phase 1)
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { material, supplier, quantity, unit, price, currency, incoterms, cargoType, loadingPort, destinationPort } = req.body;

    // Auto-generate Import Reference Number and Contract ID
    const importRefNumber = `IMP-${new Date().getFullYear()}-${uuidv4().substring(0, 8).toUpperCase()}`;
    const contractId = `CTR-${new Date().getFullYear()}-${uuidv4().substring(0, 8).toUpperCase()}`;

    const contract = await prisma.importContract.create({
      data: {
        importRefNumber,
        contractId,
        material,
        supplier,
        quantity: Number(quantity),
        unit: unit || 'MT',
        price: Number(price),
        currency: currency || 'USD',
        incoterms,
        cargoType,
        loadingPort,
        destinationPort,
        status: 'DRAFT_VALIDATION',
        createdById: req.userId!,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'ImportContract',
        entityId: contract.id,
        action: 'CREATE',
        newData: contract as any,
        description: 'Import contract created',
        contractId: contract.id,
        performedById: req.userId!,
      },
    });

    res.status(201).json(contract);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create contract' });
  }
});

// Upload BL and validate (Phase 1)
router.post('/:id/validate-bl', async (req: AuthRequest, res: Response) => {
  try {
    const contract = await prisma.importContract.findUnique({ where: { id: req.params.id } });
    if (!contract) {
      res.status(404).json({ error: 'Contract not found' });
      return;
    }

    const { blNumber, blQuantity, blMaterial, blPrice } = req.body;

    // Validate BL against contract
    const validation = validateContractAgainstBL(contract, { blQuantity, blMaterial, blPrice });

    const updatedContract = await prisma.importContract.update({
      where: { id: req.params.id },
      data: {
        blNumber,
        blQuantity: Number(blQuantity),
        blMaterial,
        blPrice: Number(blPrice),
        blValidated: !validation.hasMismatch,
        blMismatch: validation.hasMismatch,
      },
    });

    // If mismatch, create approval workflow
    if (validation.hasMismatch) {
      await prisma.approvalWorkflow.create({
        data: {
          contractId: contract.id,
          reason: 'BL Mismatch detected',
          details: validation.mismatches as any,
          status: 'PENDING',
        },
      });
    } else {
      // Auto-approve and move to IMPORT PLANNING
      await prisma.importContract.update({
        where: { id: req.params.id },
        data: { status: 'IMPORT_PLANNING' },
      });
    }

    res.json({ contract: updatedContract, validation });
  } catch (error) {
    res.status(500).json({ error: 'BL validation failed' });
  }
});

// OCR extract from uploaded document
router.post('/:id/ocr-extract', async (req: AuthRequest, res: Response) => {
  try {
    const { filePath, documentType } = req.body;
    const extracted = await ocrExtractContract(filePath, documentType);

    await prisma.importContract.update({
      where: { id: req.params.id },
      data: {
        ocrExtracted: true,
        ocrRawData: extracted as any,
      },
    });

    res.json({ extracted });
  } catch (error) {
    res.status(500).json({ error: 'OCR extraction failed' });
  }
});

// Update contract status
router.patch('/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const contract = await prisma.importContract.findUnique({ where: { id: req.params.id } });
    if (!contract) {
      res.status(404).json({ error: 'Contract not found' });
      return;
    }

    const updated = await prisma.importContract.update({
      where: { id: req.params.id },
      data: { status },
    });

    await prisma.auditLog.create({
      data: {
        entityType: 'ImportContract',
        entityId: contract.id,
        action: 'STATUS_CHANGE',
        previousData: { status: contract.status } as any,
        newData: { status } as any,
        description: `Status changed from ${contract.status} to ${status}`,
        contractId: contract.id,
        performedById: req.userId!,
      },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

export { router as contractRoutes };
