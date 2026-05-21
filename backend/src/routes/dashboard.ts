import { Router, Response } from "express";
import prisma from "../models/prisma";
import { AuthRequest } from "../middleware/auth";

const router = Router();

// Phase 7 - Real-time dashboard data
router.get("/summary", async (_req: AuthRequest, res: Response) => {
  try {
    const [
      totalContracts,
      contractsByStatus,
      totalInventory,
      fundedInventory,
      pendingApprovals,
      recentActivity,
      totalExportContracts,
      totalShipments,
      shipmentsByStatus,
      totalExpenses,
      totalExpenseAmount,
      totalWarehouses,
      warehousesByStatus,
      totalPlants,
      exportExpenseTotal,
      totalDeliveryOrders,
    ] = await Promise.all([
      prisma.importContract.count(),
      prisma.importContract.groupBy({ by: ["status"], _count: true }),
      prisma.inventoryItem.count(),
      prisma.inventoryItem.count({ where: { isFunded: true } }),
      prisma.approvalWorkflow.count({ where: { status: "PENDING" } }),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { performedBy: { select: { name: true } } },
      }),
      prisma.exportContract.count(),
      prisma.shipment.count(),
      prisma.shipment.groupBy({ by: ["status"], _count: true }),
      prisma.expense.count(),
      prisma.expense.aggregate({ _sum: { amount: true } }),
      prisma.warehouse.count(),
      prisma.warehouse.groupBy({
        by: ["agreementStatus"],
        _count: true,
        where: { agreementStatus: { not: null } },
      }),
      prisma.plant.count(),
      prisma.exportExpense.aggregate({ _sum: { amount: true } }),
      prisma.deliveryOrder.count(),
    ]);

    res.json({
      totalContracts,
      contractsByStatus,
      totalInventory,
      fundedInventory,
      activeInventory: totalInventory - fundedInventory,
      pendingApprovals,
      recentActivity,
      totalExportContracts,
      totalShipments,
      shipmentsByStatus,
      totalExpenses,
      totalExpenseAmount: totalExpenseAmount._sum.amount || 0,
      totalWarehouses,
      warehousesByStatus,
      totalPlants,
      totalExportExpenseAmount: exportExpenseTotal._sum.amount || 0,
      totalDeliveryOrders,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

// BL-wise inventory report
router.get("/inventory-by-bl", async (_req: AuthRequest, res: Response) => {
  try {
    const inventory = await prisma.inventoryItem.groupBy({
      by: ["blNumber"],
      _sum: { quantity: true },
      _count: true,
      where: { blNumber: { not: null } },
    });
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch BL inventory report" });
  }
});

// Funded inventory report
router.get("/funded-inventory", async (_req: AuthRequest, res: Response) => {
  try {
    const funded = await prisma.inventoryItem.findMany({
      where: { isFunded: true },
      include: {
        warehouse: { select: { name: true } },
        contract: { select: { importRefNumber: true, material: true } },
      },
    });

    const totalFundingAmount = funded.reduce(
      (sum: number, i: any) => sum + (i.fundingAmount || 0),
      0,
    );
    const totalInterest = funded.reduce(
      (sum: number, i: any) => sum + i.interestAccrued,
      0,
    );
    const totalStorage = funded.reduce(
      (sum: number, i: any) => sum + i.storageCost,
      0,
    );

    res.json({
      items: funded,
      summary: {
        totalItems: funded.length,
        totalFundingAmount,
        totalInterest,
        totalStorage,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch funded inventory report" });
  }
});

// Lifecycle status report
router.get("/lifecycle", async (_req: AuthRequest, res: Response) => {
  try {
    const contracts = await prisma.importContract.findMany({
      select: {
        id: true,
        importRefNumber: true,
        material: true,
        supplier: true,
        status: true,
        blNumber: true,
        quantity: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch lifecycle report" });
  }
});

export { router as dashboardRoutes };
