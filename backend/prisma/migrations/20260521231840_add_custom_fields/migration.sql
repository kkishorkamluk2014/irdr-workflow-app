-- AlterTable
ALTER TABLE "Expense" ADD COLUMN "customFields" TEXT;

-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN "customFields" TEXT;

-- CreateTable
CREATE TABLE "FieldDefinition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "fieldLabel" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "FieldDefinition_entityType_idx" ON "FieldDefinition"("entityType");

-- CreateIndex
CREATE UNIQUE INDEX "FieldDefinition_entityType_fieldName_key" ON "FieldDefinition"("entityType", "fieldName");
