import { Router, Response } from "express";
import prisma from "../models/prisma";
import { AuthRequest } from "../middleware/auth";

const router = Router();

// Global fast search across all entities
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q || q.length < 2) {
      return res.json({ results: [], total: 0 });
    }

    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const category = req.query.category as string | undefined;

    // Run searches in parallel for speed
    const searches = [];

    if (!category || category === "contracts") {
      searches.push(
        prisma.importContract
          .findMany({
            where: {
              OR: [
                { importRefNumber: { contains: q } },
                { contractId: { contains: q } },
                { material: { contains: q } },
                { supplier: { contains: q } },
                { blNumber: { contains: q } },
                { sellerContractNo: { contains: q } },
                { invoiceNo: { contains: q } },
                { origin: { contains: q } },
                { entityName: { contains: q } },
                { destinationPort: { contains: q } },
                { loadingPort: { contains: q } },
                { vesselName: { contains: q } },
                { shippingLine: { contains: q } },
              ],
            },
            select: {
              id: true,
              importRefNumber: true,
              contractId: true,
              material: true,
              supplier: true,
              blNumber: true,
              quantity: true,
              status: true,
              origin: true,
              destinationPort: true,
            },
            take: limit,
            orderBy: { updatedAt: "desc" },
          })
          .then((items: any[]) =>
            items.map((i: any) => ({ ...i, _type: "contract" })),
          ),
      );
    }

    if (!category || category === "exports") {
      searches.push(
        prisma.exportContract
          .findMany({
            where: {
              OR: [
                { contractNo: { contains: q } },
                { buyer: { contains: q } },
                { commodity: { contains: q } },
                { blNumber: { contains: q } },
                { proformaInvoice: { contains: q } },
                { finalDestination: { contains: q } },
                { shippingLine: { contains: q } },
                { fromLocation: { contains: q } },
                { destinationCountry: { contains: q } },
              ],
            },
            select: {
              id: true,
              contractNo: true,
              buyer: true,
              commodity: true,
              blNumber: true,
              quantity: true,
              status: true,
              finalDestination: true,
              destinationCountry: true,
            },
            take: limit,
            orderBy: { updatedAt: "desc" },
          })
          .then((items: any[]) =>
            items.map((i: any) => ({ ...i, _type: "export" })),
          ),
      );
    }

    if (!category || category === "warehouses") {
      searches.push(
        prisma.warehouse
          .findMany({
            where: {
              OR: [
                { name: { contains: q } },
                { code: { contains: q } },
                { address: { contains: q } },
                { city: { contains: q } },
                { location: { contains: q } },
                { serviceProvider: { contains: q } },
                { entity: { contains: q } },
              ],
            },
            select: {
              id: true,
              name: true,
              code: true,
              city: true,
              location: true,
              agreementStatus: true,
              serviceProvider: true,
            },
            take: limit,
            orderBy: { name: "asc" },
          })
          .then((items: any[]) =>
            items.map((i: any) => ({ ...i, _type: "warehouse" })),
          ),
      );
    }

    if (!category || category === "expenses") {
      searches.push(
        prisma.expense
          .findMany({
            where: {
              OR: [
                { vendor: { contains: q } },
                { description: { contains: q } },
                { invoiceNumber: { contains: q } },
                { blNumber: { contains: q } },
                { batchNumber: { contains: q } },
                { expenseType: { contains: q } },
              ],
            },
            select: {
              id: true,
              vendor: true,
              description: true,
              amount: true,
              expenseType: true,
              blNumber: true,
              invoiceNumber: true,
              contractId: true,
            },
            take: limit,
            orderBy: { createdAt: "desc" },
          })
          .then((items: any[]) =>
            items.map((i: any) => ({ ...i, _type: "expense" })),
          ),
      );
    }

    if (!category || category === "shipments") {
      searches.push(
        prisma.shipment
          .findMany({
            where: {
              OR: [
                { blNumber: { contains: q } },
                { vesselName: { contains: q } },
                { loadingPort: { contains: q } },
                { destinationPort: { contains: q } },
              ],
            },
            select: {
              id: true,
              blNumber: true,
              vesselName: true,
              loadingPort: true,
              destinationPort: true,
              status: true,
              contractId: true,
            },
            take: limit,
            orderBy: { updatedAt: "desc" },
          })
          .then((items: any[]) =>
            items.map((i: any) => ({ ...i, _type: "shipment" })),
          ),
      );
    }

    const results = await Promise.all(searches);
    const flat = results.flat();

    res.json({
      results: flat.slice(0, limit),
      total: flat.length,
      query: q,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Search failed" });
  }
});

// Quick count to show available results per category
router.get("/counts", async (req: AuthRequest, res: Response) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q || q.length < 2) {
      return res.json({
        contracts: 0,
        exports: 0,
        warehouses: 0,
        expenses: 0,
        shipments: 0,
      });
    }

    const [contracts, exports, warehouses, expenses, shipments] =
      await Promise.all([
        prisma.importContract.count({
          where: {
            OR: [
              { material: { contains: q } },
              { supplier: { contains: q } },
              { blNumber: { contains: q } },
              { contractId: { contains: q } },
            ],
          },
        }),
        prisma.exportContract.count({
          where: {
            OR: [
              { buyer: { contains: q } },
              { commodity: { contains: q } },
              { blNumber: { contains: q } },
              { contractNo: { contains: q } },
            ],
          },
        }),
        prisma.warehouse.count({
          where: {
            OR: [
              { name: { contains: q } },
              { city: { contains: q } },
              { location: { contains: q } },
            ],
          },
        }),
        prisma.expense.count({
          where: {
            OR: [
              { vendor: { contains: q } },
              { description: { contains: q } },
              { blNumber: { contains: q } },
            ],
          },
        }),
        prisma.shipment.count({
          where: {
            OR: [
              { blNumber: { contains: q } },
              { vesselName: { contains: q } },
              { destinationPort: { contains: q } },
            ],
          },
        }),
      ]);

    res.json({ contracts, exports, warehouses, expenses, shipments });
  } catch (error) {
    res.status(500).json({ error: "Count failed" });
  }
});

export const searchRoutes = router;
