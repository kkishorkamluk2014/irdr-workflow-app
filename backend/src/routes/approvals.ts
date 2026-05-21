import { Router, Response } from 'express';
import prisma from '../models/prisma';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// List pending approvals
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status = 'PENDING' } = req.query;
    const approvals = await prisma.approvalWorkflow.findMany({
      where: { status: status as any },
      include: {
        contract: { select: { importRefNumber: true, material: true, supplier: true } },
        approvedBy: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(approvals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch approvals' });
  }
});

// Approve or reject
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { status, remarks } = req.body;

    const approval = await prisma.approvalWorkflow.update({
      where: { id: req.params.id },
      data: {
        status,
        remarks,
        approvedById: req.userId!,
        approvedAt: new Date(),
      },
    });

    // If approved, move contract to IMPORT_PLANNING
    if (status === 'APPROVED') {
      await prisma.importContract.update({
        where: { id: approval.contractId },
        data: { status: 'IMPORT_PLANNING' },
      });
    }

    res.json(approval);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update approval' });
  }
});

export { router as approvalRoutes };
