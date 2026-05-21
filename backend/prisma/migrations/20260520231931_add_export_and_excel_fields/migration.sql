-- AlterTable
ALTER TABLE "ImportContract" ADD COLUMN "bagSize" REAL;
ALTER TABLE "ImportContract" ADD COLUMN "boeExcRate" REAL;
ALTER TABLE "ImportContract" ADD COLUMN "broker" TEXT;
ALTER TABLE "ImportContract" ADD COLUMN "cargoValueINR" REAL;
ALTER TABLE "ImportContract" ADD COLUMN "clearanceDate" DATETIME;
ALTER TABLE "ImportContract" ADD COLUMN "entityName" TEXT;
ALTER TABLE "ImportContract" ADD COLUMN "fcl" INTEGER;
ALTER TABLE "ImportContract" ADD COLUMN "freeDaysUpto" DATETIME;
ALTER TABLE "ImportContract" ADD COLUMN "grade" TEXT;
ALTER TABLE "ImportContract" ADD COLUMN "invoiceAmount" REAL;
ALTER TABLE "ImportContract" ADD COLUMN "invoiceDate" DATETIME;
ALTER TABLE "ImportContract" ADD COLUMN "invoiceNo" TEXT;
ALTER TABLE "ImportContract" ADD COLUMN "invoicingParty" TEXT;
ALTER TABLE "ImportContract" ADD COLUMN "numberOfBags" INTEGER;
ALTER TABLE "ImportContract" ADD COLUMN "origin" TEXT;
ALTER TABLE "ImportContract" ADD COLUMN "packing" TEXT;
ALTER TABLE "ImportContract" ADD COLUMN "paymentTerm" TEXT;
ALTER TABLE "ImportContract" ADD COLUMN "periodFrom" DATETIME;
ALTER TABLE "ImportContract" ADD COLUMN "periodTo" DATETIME;
ALTER TABLE "ImportContract" ADD COLUMN "sellerContractDate" DATETIME;
ALTER TABLE "ImportContract" ADD COLUMN "sellerContractNo" TEXT;
ALTER TABLE "ImportContract" ADD COLUMN "shippingLine" TEXT;
ALTER TABLE "ImportContract" ADD COLUMN "targetDelivery" DATETIME;

-- AlterTable
ALTER TABLE "Warehouse" ADD COLUMN "agreementStatus" TEXT;
ALTER TABLE "Warehouse" ADD COLUMN "commencementDate" DATETIME;
ALTER TABLE "Warehouse" ADD COLUMN "entity" TEXT;
ALTER TABLE "Warehouse" ADD COLUMN "executionDate" DATETIME;
ALTER TABLE "Warehouse" ADD COLUMN "expiryDate" DATETIME;
ALTER TABLE "Warehouse" ADD COLUMN "labourCharges" TEXT;
ALTER TABLE "Warehouse" ADD COLUMN "location" TEXT;
ALTER TABLE "Warehouse" ADD COLUMN "notary" TEXT;
ALTER TABLE "Warehouse" ADD COLUMN "plantCode" TEXT;
ALTER TABLE "Warehouse" ADD COLUMN "serviceProvider" TEXT;
ALTER TABLE "Warehouse" ADD COLUMN "storageCharges" TEXT;

-- CreateTable
CREATE TABLE "ExportContract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractNo" TEXT,
    "contractDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "type" TEXT,
    "lcNo" TEXT,
    "lcDate" DATETIME,
    "lcShipmentDate" DATETIME,
    "piNo" TEXT,
    "proformaInvoice" TEXT,
    "sapInvoiceNo" TEXT,
    "sapInvoiceDate" DATETIME,
    "buyer" TEXT,
    "notifyParty" TEXT,
    "commodity" TEXT,
    "commodityGroup" TEXT,
    "grade" TEXT,
    "hsnCode" TEXT,
    "incoTerms" TEXT,
    "lot" TEXT,
    "soNo" TEXT,
    "batch" TEXT,
    "materialCode" TEXT,
    "plantCode" TEXT,
    "fcl" INTEGER,
    "packingSize" TEXT,
    "numberOfBags" INTEGER,
    "quantity" REAL,
    "unitPrice" REAL,
    "unitPriceINR" REAL,
    "invoiceValueUSD" REAL,
    "invoiceValueINR" REAL,
    "paymentTerm" TEXT,
    "blNumber" TEXT,
    "blDate" DATETIME,
    "vesselDetails" TEXT,
    "shippingLine" TEXT,
    "fromLocation" TEXT,
    "loadingPort" TEXT,
    "finalDestination" TEXT,
    "destinationCountry" TEXT,
    "sbNo" TEXT,
    "sbDate" DATETIME,
    "leoDate" DATETIME,
    "sbExchangeRate" REAL,
    "freightInsuranceINR" REAL,
    "freightInsuranceUSD" REAL,
    "insuranceUSD" REAL,
    "sbFobValueUSD" REAL,
    "sbFobValueINR" REAL,
    "rodtepAmountINR" REAL,
    "drawbackAmountINR" REAL,
    "bankRealizationNo" TEXT,
    "brcIssueDate" DATETIME,
    "realizedAmount" REAL,
    "fobRealizedForeign" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ExportExpense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "exportContractId" TEXT NOT NULL,
    "proformaInvoice" TEXT,
    "category" TEXT NOT NULL,
    "vendorName" TEXT,
    "billNo" TEXT,
    "billDate" DATETIME,
    "amount" REAL NOT NULL DEFAULT 0,
    "gstAmount" REAL NOT NULL DEFAULT 0,
    "remark" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExportExpense_exportContractId_fkey" FOREIGN KEY ("exportContractId") REFERENCES "ExportContract" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ExportContract_contractNo_idx" ON "ExportContract"("contractNo");

-- CreateIndex
CREATE INDEX "ExportContract_blNumber_idx" ON "ExportContract"("blNumber");

-- CreateIndex
CREATE INDEX "ExportContract_status_idx" ON "ExportContract"("status");

-- CreateIndex
CREATE INDEX "ExportExpense_exportContractId_idx" ON "ExportExpense"("exportContractId");

-- CreateIndex
CREATE INDEX "ExportExpense_category_idx" ON "ExportExpense"("category");
