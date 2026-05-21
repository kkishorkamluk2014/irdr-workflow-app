-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ImportContract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "importRefNumber" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT_VALIDATION',
    "material" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'MT',
    "price" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "incoterms" TEXT NOT NULL,
    "ocrExtracted" BOOLEAN NOT NULL DEFAULT false,
    "ocrRawData" TEXT,
    "contractFileUrl" TEXT,
    "blFileUrl" TEXT,
    "blNumber" TEXT,
    "blQuantity" REAL,
    "blMaterial" TEXT,
    "blPrice" REAL,
    "blValidated" BOOLEAN NOT NULL DEFAULT false,
    "blMismatch" BOOLEAN NOT NULL DEFAULT false,
    "cargoType" TEXT,
    "loadingPort" TEXT,
    "destinationPort" TEXT,
    "vesselName" TEXT,
    "etd" DATETIME,
    "eta" DATETIME,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ImportContract_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "blNumber" TEXT NOT NULL,
    "vesselName" TEXT,
    "cargoType" TEXT NOT NULL,
    "departureDate" DATETIME,
    "arrivalDate" DATETIME,
    "boeFilingDate" DATETIME,
    "clearanceDate" DATETIME,
    "loadingPort" TEXT NOT NULL,
    "destinationPort" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IMPORT_IN_TRANSIT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Shipment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "ImportContract" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "blNumber" TEXT,
    "batchNumber" TEXT,
    "inventoryItemId" TEXT,
    "category" TEXT NOT NULL,
    "expenseType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "vendor" TEXT,
    "invoiceNumber" TEXT,
    "invoiceDate" DATETIME,
    "cargoType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Expense_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "ImportContract" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Expense_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT,
    "inventoryType" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'MT',
    "blNumber" TEXT,
    "batchNumber" TEXT,
    "warehouseId" TEXT,
    "plantId" TEXT,
    "isFunded" BOOLEAN NOT NULL DEFAULT false,
    "isDeadInventory" BOOLEAN NOT NULL DEFAULT false,
    "fundingAgency" TEXT,
    "fundingStartDate" DATETIME,
    "fundingReleaseDate" DATETIME,
    "fundingAmount" REAL,
    "interestAccrued" REAL NOT NULL DEFAULT 0,
    "storageCost" REAL NOT NULL DEFAULT 0,
    "labourCost" REAL NOT NULL DEFAULT 0,
    "ownershipTransferred" BOOLEAN NOT NULL DEFAULT false,
    "blockedForSale" BOOLEAN NOT NULL DEFAULT false,
    "blockedForTransfer" BOOLEAN NOT NULL DEFAULT false,
    "blockedForConsumption" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE_INVENTORY',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InventoryItem_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "ImportContract" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InventoryItem_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InventoryItem_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inventoryItemId" TEXT NOT NULL,
    "fromLocation" TEXT NOT NULL,
    "toLocation" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "movementDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transportCost" REAL NOT NULL DEFAULT 0,
    "loadingCost" REAL NOT NULL DEFAULT 0,
    "unloadingCost" REAL NOT NULL DEFAULT 0,
    "labourCost" REAL NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockMovement_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "capacity" REAL,
    "capacityUnit" TEXT NOT NULL DEFAULT 'MT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Plant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WarehouseActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "warehouseId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "description" TEXT,
    "quantity" REAL,
    "expenseAmount" REAL NOT NULL DEFAULT 0,
    "blNumber" TEXT,
    "batchNumber" TEXT,
    "activityDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WarehouseActivity_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WarehouseActivity_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeliveryOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "warehouseId" TEXT,
    "plantId" TEXT,
    "material" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'MT',
    "customerName" TEXT,
    "deliveryDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DeliveryOrder_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DeliveryOrder_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApprovalWorkflow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" DATETIME,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ApprovalWorkflow_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "ImportContract" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ApprovalWorkflow_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "previousData" TEXT,
    "newData" TEXT,
    "description" TEXT,
    "contractId" TEXT,
    "inventoryItemId" TEXT,
    "performedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "ImportContract" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ImportContract_importRefNumber_key" ON "ImportContract"("importRefNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ImportContract_contractId_key" ON "ImportContract"("contractId");

-- CreateIndex
CREATE INDEX "ImportContract_status_idx" ON "ImportContract"("status");

-- CreateIndex
CREATE INDEX "ImportContract_blNumber_idx" ON "ImportContract"("blNumber");

-- CreateIndex
CREATE INDEX "ImportContract_importRefNumber_idx" ON "ImportContract"("importRefNumber");

-- CreateIndex
CREATE INDEX "Shipment_blNumber_idx" ON "Shipment"("blNumber");

-- CreateIndex
CREATE INDEX "Shipment_status_idx" ON "Shipment"("status");

-- CreateIndex
CREATE INDEX "Expense_contractId_idx" ON "Expense"("contractId");

-- CreateIndex
CREATE INDEX "Expense_blNumber_idx" ON "Expense"("blNumber");

-- CreateIndex
CREATE INDEX "Expense_batchNumber_idx" ON "Expense"("batchNumber");

-- CreateIndex
CREATE INDEX "InventoryItem_blNumber_idx" ON "InventoryItem"("blNumber");

-- CreateIndex
CREATE INDEX "InventoryItem_batchNumber_idx" ON "InventoryItem"("batchNumber");

-- CreateIndex
CREATE INDEX "InventoryItem_isFunded_idx" ON "InventoryItem"("isFunded");

-- CreateIndex
CREATE INDEX "InventoryItem_status_idx" ON "InventoryItem"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_code_key" ON "Warehouse"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Plant_code_key" ON "Plant"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryOrder_orderNumber_key" ON "DeliveryOrder"("orderNumber");

-- CreateIndex
CREATE INDEX "ApprovalWorkflow_status_idx" ON "ApprovalWorkflow"("status");

-- CreateIndex
CREATE INDEX "ApprovalWorkflow_contractId_idx" ON "ApprovalWorkflow"("contractId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_contractId_idx" ON "AuditLog"("contractId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
