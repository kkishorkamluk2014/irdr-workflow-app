import { Router, Response } from "express";
import prisma from "../models/prisma";
import { AuthRequest } from "../middleware/auth";

const router = Router();

// List expenses
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { contractId, blNumber, batchNumber, category } = req.query;
    const where: any = {};
    if (contractId) where.contractId = contractId;
    if (blNumber) where.blNumber = blNumber;
    if (batchNumber) where.batchNumber = batchNumber;
    if (category) where.category = category;

    const expenses = await prisma.expense.findMany({
      where,
      include: { contract: { select: { importRefNumber: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

// Create expense (Phase 3)
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const {
      contractId,
      blNumber,
      batchNumber,
      inventoryItemId,
      category,
      expenseType,
      description,
      amount,
      currency,
      vendor,
      invoiceNumber,
      invoiceDate,
      cargoType,
    } = req.body;

    const expense = await prisma.expense.create({
      data: {
        contractId,
        blNumber,
        batchNumber,
        inventoryItemId,
        category,
        expenseType,
        description,
        amount: Number(amount),
        currency: currency || "INR",
        vendor,
        invoiceNumber,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : null,
        cargoType,
      },
    });

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ error: "Failed to create expense" });
  }
});

// Get landed cost for a contract
router.get(
  "/landed-cost/:contractId",
  async (req: AuthRequest, res: Response) => {
    try {
      const expenses = await prisma.expense.findMany({
        where: { contractId: req.params.contractId },
      });

      const contract = await prisma.importContract.findUnique({
        where: { id: req.params.contractId },
      });

      const totalExpenses = expenses.reduce(
        (sum: number, e: any) => sum + e.amount,
        0,
      );
      const materialCost = contract ? contract.price * contract.quantity : 0;
      const landedCost = materialCost + totalExpenses;

      const breakdown = {
        materialCost,
        serviceCharges: expenses
          .filter((e: any) => e.category === "SERVICE_CHARGE")
          .reduce((s: number, e: any) => s + e.amount, 0),
        governmentCharges: expenses
          .filter((e: any) => e.category === "GOVERNMENT_CHARGE")
          .reduce((s: number, e: any) => s + e.amount, 0),
        shippingLineCharges: expenses
          .filter((e: any) => e.category === "SHIPPING_LINE_CHARGE")
          .reduce((s: number, e: any) => s + e.amount, 0),
        totalExpenses,
        landedCost,
        perUnitLandedCost:
          contract && contract.quantity > 0
            ? landedCost / contract.quantity
            : 0,
      };

      res.json(breakdown);
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate landed cost" });
    }
  },
);

export { router as expenseRoutes };
