import { Router, Request, Response } from "express";
import prisma from "../models/prisma";

const router = Router();

// GET /api/field-definitions?entityType=SHIPMENT
router.get("/", async (req: Request, res: Response) => {
  const { entityType } = req.query;
  const where = entityType
    ? { entityType: String(entityType), active: true }
    : { active: true };
  const fields = await prisma.fieldDefinition.findMany({
    where,
    orderBy: [
      { entityType: "asc" },
      { sortOrder: "asc" },
      { createdAt: "asc" },
    ],
  });
  res.json(fields);
});

// POST /api/field-definitions
router.post("/", async (req: Request, res: Response) => {
  const { entityType, fieldName, fieldLabel, fieldType, required, sortOrder } =
    req.body;

  if (!entityType || !fieldName || !fieldLabel || !fieldType) {
    return res
      .status(400)
      .json({
        error: "entityType, fieldName, fieldLabel, fieldType are required",
      });
  }
  if (!["SHIPMENT", "EXPENSE"].includes(entityType)) {
    return res
      .status(400)
      .json({ error: "entityType must be SHIPMENT or EXPENSE" });
  }
  if (!["TEXT", "NUMBER", "DATE", "BOOLEAN"].includes(fieldType)) {
    return res
      .status(400)
      .json({ error: "fieldType must be TEXT, NUMBER, DATE, or BOOLEAN" });
  }

  // Sanitize fieldName to camelCase safe key
  const safeName = fieldName
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/^[0-9]/, "_");

  const field = await prisma.fieldDefinition.create({
    data: {
      entityType,
      fieldName: safeName,
      fieldLabel,
      fieldType,
      required: Boolean(required),
      sortOrder: Number(sortOrder) || 0,
    },
  });
  res.status(201).json(field);
});

// PATCH /api/field-definitions/:id
router.patch("/:id", async (req: Request, res: Response) => {
  const { fieldLabel, required, active, sortOrder } = req.body;
  const field = await prisma.fieldDefinition.update({
    where: { id: req.params.id },
    data: {
      ...(fieldLabel !== undefined && { fieldLabel }),
      ...(required !== undefined && { required: Boolean(required) }),
      ...(active !== undefined && { active: Boolean(active) }),
      ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
    },
  });
  res.json(field);
});

// DELETE /api/field-definitions/:id  (soft delete)
router.delete("/:id", async (req: Request, res: Response) => {
  await prisma.fieldDefinition.update({
    where: { id: req.params.id },
    data: { active: false },
  });
  res.json({ success: true });
});

export default router;
