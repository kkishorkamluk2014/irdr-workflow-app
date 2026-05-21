import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as XLSX from "xlsx";
import * as path from "path";

const prisma = new PrismaClient();

const EXCEL_DIR = path.join(__dirname, "../../frontend/public");

function parseExcelDate(serial: any): Date | null {
  if (!serial) return null;
  if (typeof serial === "number") {
    // Excel serial date number
    const utc_days = Math.floor(serial - 25569);
    const date = new Date(utc_days * 86400 * 1000);
    return date;
  }
  if (typeof serial === "string") {
    const d = new Date(serial);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function safeFloat(val: any): number | null {
  if (val === "" || val === null || val === undefined || val === "#N/A")
    return null;
  const str = String(val).replace(/[₹$,\s]/g, "");
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

function safeInt(val: any): number | null {
  if (val === "" || val === null || val === undefined) return null;
  const str = String(val).replace(/[,\s]/g, "");
  const num = parseInt(str, 10);
  return isNaN(num) ? null : num;
}

function safeStr(val: any): string | null {
  if (val === "" || val === null || val === undefined || val === "#N/A")
    return null;
  return String(val).trim();
}

async function main() {
  console.log("🌱 Starting Excel data seed...\n");

  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.approvalWorkflow.deleteMany();
  await prisma.warehouseActivity.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.deliveryOrder.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.exportExpense.deleteMany();
  await prisma.exportContract.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.importContract.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.plant.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const adminHash = await bcrypt.hash("admin123", 10);
  const cmtHash = await bcrypt.hash("cmt123", 10);
  const admin = await prisma.user.create({
    data: {
      email: "admin@irdr.com",
      passwordHash: adminHash,
      name: "Admin User",
      role: "ADMIN",
    },
  });
  const cmtUser = await prisma.user.create({
    data: {
      email: "cmt@irdr.com",
      passwordHash: cmtHash,
      name: "CMT User",
      role: "CMT_TEAM",
    },
  });
  console.log("✓ Users created");

  // ──────────────────────────────────────────────────────────────────────────────
  // WAREHOUSE AGREEMENTS
  // ──────────────────────────────────────────────────────────────────────────────
  const whFile = path.join(
    EXCEL_DIR,
    "Warehouse Agreement list details  2.xlsx",
  );
  const whWb = XLSX.readFile(whFile);
  const whData = XLSX.utils.sheet_to_json(whWb.Sheets["Agreement detail"], {
    defval: "",
  });

  let whCount = 0;
  const warehouseMap: Record<string, string> = {}; // plantCode -> warehouseId

  for (const row of whData as any[]) {
    if (!row["Name"] || !row["Plant"]) continue;
    const plantCode = String(row["Plant"]);
    const name = String(row["Name"]).trim();
    const code = `WH-${plantCode}`;

    try {
      const wh = await prisma.warehouse.create({
        data: {
          name,
          code,
          address: safeStr(row["Address"]),
          city: safeStr(row["Location"]),
          state: null,
          plantCode,
          entity: safeStr(row["Entity"]),
          location: safeStr(row["Location"]),
          executionDate: parseExcelDate(row["Execution Date"]),
          expiryDate: parseExcelDate(row["Expiry Date"]),
          commencementDate: parseExcelDate(row["Commencement Date"]),
          storageCharges: safeStr(row["Storage charges"]),
          labourCharges: safeStr(row["Labour Charges"]),
          serviceProvider: safeStr(row["Service Provider"]),
          notary: safeStr(row["Notary"]),
          agreementStatus: safeStr(row["Status"]),
        },
      });
      warehouseMap[plantCode] = wh.id;
      whCount++;
    } catch (e: any) {
      // Skip duplicates
      if (!e.message?.includes("Unique constraint")) {
        console.error(`  Warehouse error (${name}):`, e.message);
      }
    }
  }
  console.log(`✓ ${whCount} warehouses created`);

  // Create plants from warehouse data
  const plantCodes = [
    ...new Set(
      (whData as any[])
        .filter((r) => r["Plant"])
        .map((r) => String(r["Plant"])),
    ),
  ];
  let plantCount = 0;
  const plantMap: Record<string, string> = {};

  for (const code of plantCodes) {
    try {
      const plant = await prisma.plant.create({
        data: { name: `Plant ${code}`, code, city: null },
      });
      plantMap[code] = plant.id;
      plantCount++;
    } catch (e: any) {
      if (!e.message?.includes("Unique constraint")) {
        console.error(`  Plant error (${code}):`, e.message);
      }
    }
  }
  console.log(`✓ ${plantCount} plants created`);

  // ──────────────────────────────────────────────────────────────────────────────
  // IMPORT CONTRACTS (from IMPORT sheet)
  // ──────────────────────────────────────────────────────────────────────────────
  const impFile = path.join(EXCEL_DIR, "IMPORT_TRACKING_SHEET.xlsx");
  const impWb = XLSX.readFile(impFile);

  // Main IMPORT sheet
  const impData = XLSX.utils.sheet_to_json(impWb.Sheets["IMPORT"], {
    defval: "",
  });
  let impCount = 0;
  const contractMap: Record<string, string> = {}; // blNumber -> contractId

  for (let i = 0; i < (impData as any[]).length; i++) {
    const row = (impData as any[])[i];
    const sellerContract = safeStr(row["SELLER'S CONTRACT NO."]);
    const blNumber = safeStr(row["B/L NO."]);
    if (!sellerContract && !blNumber) continue;

    const refNum = `IMP-ETC-${String(i + 1).padStart(4, "0")}`;
    const contractIdField = sellerContract || refNum;

    try {
      const contract = await prisma.importContract.create({
        data: {
          importRefNumber: refNum,
          contractId: contractIdField,
          status:
            row["STATUS"] === "ID"
              ? "IMPORT_IN_TRANSIT"
              : row["STATUS"] === "ED"
                ? "DELIVERED"
                : row["STATUS"] === "IU"
                  ? "IMPORT_UNDER_CLEARANCE"
                  : row["STATUS"] === "IT"
                    ? "IMPORT_IN_TRANSIT"
                    : "DRAFT_VALIDATION",
          material: safeStr(row["ITEM/ DISCRIPTION"]) || "Unknown",
          supplier: safeStr(row["SHIPPER"]) || "Unknown",
          quantity:
            safeFloat(row[" REC.QTY MTS "]) ||
            safeFloat(row["CONTRACT QTY"]) ||
            0,
          price: safeFloat(row["RATE ($)"]) || 0,
          currency: "USD",
          incoterms: safeStr(row["INCOTERMS"]) || "CFR",
          entityName: safeStr(row["ENTITY NAME"]),
          broker: safeStr(row["BROKER"]),
          invoicingParty: safeStr(row["INVOICING PARTY"]),
          grade: safeStr(row["GRADE"]),
          origin: safeStr(row["ORIGIN"]),
          sellerContractNo: sellerContract,
          sellerContractDate: parseExcelDate(row["SELLER CONTRACT DATE"]),
          paymentTerm: safeStr(row["PAYMENT TERM"]),
          periodFrom: parseExcelDate(row[" PERIOD FROM"]),
          periodTo: parseExcelDate(row[" PERIOD TO"]),
          invoiceNo: safeStr(row["INVOICE NO"]),
          invoiceDate: parseExcelDate(row["INVOICE DATE"]),
          invoiceAmount: safeFloat(row["INVOICE AMOUNT ($)"]),
          boeExcRate: safeFloat(row["BOE Exc. RATE"]),
          cargoValueINR: safeFloat(row["CARGO VALUE IN INR"]),
          packing: safeStr(row["PACKING"]),
          bagSize: safeFloat(row["BAG SIZE (Kg)"]),
          numberOfBags: safeInt(row["NO OF BAGS"]),
          fcl: safeInt(row["FCL"]),
          blNumber: blNumber,
          blQuantity: safeFloat(row[" REC.QTY MTS "]),
          loadingPort: safeStr(row["PORT OF LOADING"]),
          destinationPort: safeStr(row["PORT OF DISCHARGE"]),
          vesselName: safeStr(row["MOTHER VESSEL NAME"]),
          shippingLine: safeStr(row["SHIPPING LINE"]),
          eta: parseExcelDate(row["ETA"]),
          freeDaysUpto: parseExcelDate(row["FREE DAYS UPTO"]),
          targetDelivery: parseExcelDate(row["TRAGET DELIVERY WITH IN"]),
          clearanceDate: parseExcelDate(row["DATE OF CLEARANCE"]),
          createdById: admin.id,
        },
      });
      if (blNumber) contractMap[blNumber] = contract.id;
      impCount++;
    } catch (e: any) {
      console.error(
        `  Import contract error (row ${i}):`,
        e.message?.slice(0, 100),
      );
    }
  }

  // Sheet1 - more import data (LP entity)
  const sheet1Data = XLSX.utils.sheet_to_json(impWb.Sheets["Sheet1"], {
    defval: "",
  });
  for (let i = 0; i < (sheet1Data as any[]).length; i++) {
    const row = (sheet1Data as any[])[i];
    const sellerContract = safeStr(row["SELLER'S CONTRACT NO."]);
    const blNumber = safeStr(row["B/L NO."]);
    if (!sellerContract && !blNumber) continue;

    const refNum = `IMP-LP-${String(i + 1).padStart(4, "0")}`;
    const contractIdField = sellerContract || refNum;

    try {
      const contract = await prisma.importContract.create({
        data: {
          importRefNumber: refNum,
          contractId: contractIdField,
          status:
            row["Status"] === "ID"
              ? "IMPORT_IN_TRANSIT"
              : row["Status"] === "ED"
                ? "DELIVERED"
                : row["Status"] === "IU"
                  ? "IMPORT_UNDER_CLEARANCE"
                  : row["Status"] === "IT"
                    ? "IMPORT_IN_TRANSIT"
                    : "DRAFT_VALIDATION",
          material: safeStr(row["ITEM/ DISCRIPTION"]) || "Unknown",
          supplier: safeStr(row["SHIPPER"]) || "Unknown",
          quantity:
            safeFloat(row["SHIPPED QTY MTS"]) ||
            safeFloat(row["CONTRACT QTY"]) ||
            0,
          price: safeFloat(row["RATE ($)"]) || 0,
          currency: "USD",
          incoterms: safeStr(row["INCOTERMS"]) || "CIF",
          entityName: safeStr(row["ENTITY NAME"]),
          broker: null,
          invoicingParty: safeStr(row["INVOICING PARTY"]),
          grade: safeStr(row["GRADE-QUALITY"]),
          origin: safeStr(row["ORIGIN"]),
          sellerContractNo: sellerContract,
          sellerContractDate: parseExcelDate(row["SELLER CONTRACT DATE"]),
          paymentTerm: safeStr(row["PAYMENT TERM"]),
          periodFrom: parseExcelDate(row[" PERIOD FROM"]),
          periodTo: parseExcelDate(row[" PERIOD TO"]),
          invoiceNo: safeStr(row["INVOICE NO"]),
          invoiceDate: parseExcelDate(row["INVOICE DATE"]),
          invoiceAmount: safeFloat(row["INVOICE AMOUNT ($)"]),
          boeExcRate: safeFloat(row["BOE Exc. RATE"]),
          cargoValueINR: safeFloat(row["CARGO VALUE IN INR"]),
          packing: safeStr(row["PACKING"]),
          bagSize: safeFloat(row["BAG SIZE (Kg)"]),
          numberOfBags: safeInt(row["NO OF BAGS"]),
          fcl: safeInt(row["FCL"]),
          blNumber: blNumber,
          blQuantity: safeFloat(row["SHIPPED QTY MTS"]),
          loadingPort: safeStr(row["POL"]),
          destinationPort: safeStr(row["POD"]),
          vesselName: safeStr(row["MOTHER VESSEL NAME"]),
          shippingLine: safeStr(row["SHIPPING LINE"]),
          eta: parseExcelDate(row["ETA"]),
          freeDaysUpto: parseExcelDate(row["FREE DAYS UPTO"]),
          targetDelivery: parseExcelDate(row["TRAGET DELIVERY WITH IN"]),
          clearanceDate: parseExcelDate(row["DATE OF CLEARANCE"]),
          createdById: admin.id,
        },
      });
      if (blNumber) contractMap[blNumber] = contract.id;
      impCount++;
    } catch (e: any) {
      if (!e.message?.includes("Unique constraint")) {
        console.error(
          `  Import LP error (row ${i}):`,
          e.message?.slice(0, 100),
        );
      }
    }
  }
  console.log(`✓ ${impCount} import contracts created`);

  // ──────────────────────────────────────────────────────────────────────────────
  // SHIPMENTS (from import contracts with BL numbers)
  // ──────────────────────────────────────────────────────────────────────────────
  let shipCount = 0;
  for (const [blNum, contractId] of Object.entries(contractMap)) {
    try {
      const contract = await prisma.importContract.findUnique({
        where: { id: contractId },
      });
      if (!contract) continue;
      await prisma.shipment.create({
        data: {
          contractId,
          blNumber: blNum,
          vesselName: contract.vesselName,
          cargoType: "CONTAINER",
          loadingPort: contract.loadingPort || "Unknown",
          destinationPort: contract.destinationPort || "Unknown",
          arrivalDate: contract.eta,
          clearanceDate: contract.clearanceDate,
          status:
            contract.status === "DELIVERED"
              ? "CLEARANCE_COMPLETED"
              : contract.status === "IMPORT_UNDER_CLEARANCE"
                ? "IMPORT_UNDER_CLEARANCE"
                : "IMPORT_IN_TRANSIT",
        },
      });
      shipCount++;
    } catch (e: any) {
      // skip
    }
  }
  console.log(`✓ ${shipCount} shipments created`);

  // ──────────────────────────────────────────────────────────────────────────────
  // EXPORT CONTRACTS (from EX sheet)
  // ──────────────────────────────────────────────────────────────────────────────
  const exFile = path.join(EXCEL_DIR, "EXPORT_TRACKING_SHEET.xlsx");
  const exWb = XLSX.readFile(exFile);
  const exData = XLSX.utils.sheet_to_json(exWb.Sheets["EX"], { defval: "" });

  let exCount = 0;
  const exportMap: Record<string, string> = {}; // proformaInvoice -> exportContractId

  for (let i = 0; i < (exData as any[]).length; i++) {
    const row = (exData as any[])[i];
    const contractNo = safeStr(row["CONTRACT NO"]);
    const blNumber = safeStr(row["BL NO./ LR NO"]);
    if (!contractNo && !blNumber) continue;

    try {
      const ex = await prisma.exportContract.create({
        data: {
          contractNo,
          contractDate: parseExcelDate(row["CONTRACT DATE"]),
          status:
            row["STATUS OF SHIPMENT"] === "ED" ? "COMPLETED" : "IN_PROGRESS",
          type: safeStr(row["TYPE (EX OR RE-EX)"]),
          lcNo: safeStr(row["LC NO."]),
          lcDate: parseExcelDate(row["LC DATE"]),
          lcShipmentDate: parseExcelDate(row["LC LATEST SHIPEMENT DATE"]),
          piNo: safeStr(row["MANUAL PI NO."]),
          proformaInvoice: safeStr(row["PROFORMA INVOICE"]),
          buyer: safeStr(row["BUYER"]),
          notifyParty: safeStr(row["NOTIFY PARTY-02"]),
          commodity: safeStr(row["COMMODITY NAME AS PER SAP"]),
          commodityGroup: safeStr(row["COMMODITY GROUP"]),
          grade: safeStr(row["GRADE"]),
          hsnCode: safeStr(row["HSN CODE"]),
          incoTerms: safeStr(row["INCO TERM"]),
          lot: safeStr(row["LOT"]),
          soNo: safeStr(row["SO NO"]),
          sapInvoiceNo: safeStr(row["SAP COMMERCIAL INV NO"]),
          sapInvoiceDate: parseExcelDate(row["SAP COMMERCIAL INV DATE"]),
          batch: safeStr(row["BATCH"]),
          materialCode: safeStr(row["MATERIAL CODE"]),
          plantCode: safeStr(row["PLANT CODE"]),
          fcl: safeInt(row["FCL"]),
          packingSize: safeStr(row["PAKING SIZE"]),
          numberOfBags: safeInt(row["NO. Of  BAGS"]),
          quantity: safeFloat(row["QTY (MT)"]),
          unitPrice: safeFloat(row["UNIT PRICE "]),
          unitPriceINR: safeFloat(row["UNIT PRICE (INR)"]),
          invoiceValueUSD: safeFloat(row["INVOICE VALUE ($)"]),
          invoiceValueINR: safeFloat(row["INVOIVE VALUE (INR)"]),
          paymentTerm: safeStr(row["PAYMENT TERM"]),
          blNumber,
          blDate: parseExcelDate(row["BL/LR DATE"]),
          vesselDetails: safeStr(row["VESSEL DETAILS"]),
          shippingLine: safeStr(row["SHIPPING LINE"]),
          fromLocation: safeStr(row["FROM LOCATION"]),
          loadingPort: safeStr(row["LOADING PORT"]),
          finalDestination: safeStr(row["FINAL DESTINATION"]),
          destinationCountry: safeStr(row["DESTINATION COUNTRY"]),
          sbNo: safeStr(row["SB NO"]),
          sbDate: parseExcelDate(row["SB DATE"]),
          leoDate: parseExcelDate(row["LEO Date"]),
          sbExchangeRate: safeFloat(row["SB EXCHANGE RATE"]),
          freightInsuranceINR: safeFloat(row["FREIGHT+INSURANCE AMOUNT (INR)"]),
          freightInsuranceUSD: safeFloat(row["FREIGHT +INSURANCE AMOUNT  US$"]),
          insuranceUSD: safeFloat(row["INSURANCE($)"]),
          sbFobValueUSD: safeFloat(row["SB FOB VALUE ($)"]),
          sbFobValueINR: safeFloat(row["SB FOB VALUE IN INR"]),
          rodtepAmountINR: safeFloat(row["RODTEP AMOUNT (INR)"]),
          drawbackAmountINR: safeFloat(row["DRAWBACK AMOUNT INR"]),
        },
      });
      const pi = safeStr(row["PROFORMA INVOICE"]);
      if (pi) exportMap[pi] = ex.id;
      exCount++;
    } catch (e: any) {
      console.error(`  Export error (row ${i}):`, e.message?.slice(0, 100));
    }
  }
  console.log(`✓ ${exCount} export contracts created`);

  // ──────────────────────────────────────────────────────────────────────────────
  // EXPORT EXPENSES (from EX_COSTING sheet) - limited to first 50 rows with data
  // ──────────────────────────────────────────────────────────────────────────────
  const exCostData = XLSX.utils.sheet_to_json(exWb.Sheets["EX_COSTING"], {
    defval: "",
  });
  let exExpCount = 0;

  for (let i = 0; i < Math.min((exCostData as any[]).length, 100); i++) {
    const row = (exCostData as any[])[i];
    const pi =
      safeStr(row[" PROFORMA INVOICE "]) || safeStr(row["PROFORMA INVOICE"]);
    if (!pi) continue;

    const exportContractId = exportMap[pi];
    if (!exportContractId) continue;

    // CHA charges
    const chaAmt = safeFloat(row["CHA CHARGES (INR)"]);
    if (chaAmt && chaAmt > 0) {
      await prisma.exportExpense.create({
        data: {
          exportContractId,
          proformaInvoice: pi,
          category: "CHA",
          vendorName: safeStr(row["CHA NAME"]),
          billNo: safeStr(row["BILL NO."]),
          billDate: parseExcelDate(row["CHA BILL DATE"]),
          amount: chaAmt,
          gstAmount: safeFloat(row["GST ON CHA CHARGES (INR)"]) || 0,
        },
      });
      exExpCount++;
    }

    // Shipping line charges
    const slAmt = safeFloat(row["OCEAN FREIGHT (INR)"]);
    if (slAmt && slAmt > 0) {
      await prisma.exportExpense.create({
        data: {
          exportContractId,
          proformaInvoice: pi,
          category: "SHIPPING_LINE",
          vendorName: safeStr(row["SHIPPING LINE"]),
          billNo: safeStr(row["SHIPPING L BILL NO."]),
          billDate: parseExcelDate(row["SHIPPING L BILL DATE"]),
          amount: slAmt,
          gstAmount: safeFloat(row["GST ON OCEAN FREIGHT (INR)"]) || 0,
        },
      });
      exExpCount++;
    }

    // Transportation
    const transAmt = safeFloat(row["TRANS. EXP.(INCLUDING LO OR UN) (INR)"]);
    if (transAmt && transAmt > 0) {
      await prisma.exportExpense.create({
        data: {
          exportContractId,
          proformaInvoice: pi,
          category: "TRANSPORTATION",
          vendorName: safeStr(row["TRANSPORTER NAME"]),
          billNo: safeStr(row["TRANSPORTER BILL NO."]),
          billDate: parseExcelDate(row["TRANSPORTER BILL DATE"]),
          amount: transAmt,
          gstAmount: 0,
        },
      });
      exExpCount++;
    }

    // Fumigation
    const fumiAmt = safeFloat(row["FUMI. CHARGES (INR)"]);
    if (fumiAmt && fumiAmt > 0) {
      await prisma.exportExpense.create({
        data: {
          exportContractId,
          proformaInvoice: pi,
          category: "FUMIGATION",
          vendorName: safeStr(row["FUMI. VENDOR"]),
          billNo: safeStr(row["BILL NO"]),
          billDate: parseExcelDate(row["FUMI. BILL DATE"]),
          amount: fumiAmt,
          gstAmount: safeFloat(row["CGST/SGST (INR)"]) || 0,
        },
      });
      exExpCount++;
    }
  }
  console.log(`✓ ${exExpCount} export expenses created`);

  // ──────────────────────────────────────────────────────────────────────────────
  // WAREHOUSE EXPENSES (from ETC WH expenses - limited for performance)
  // ──────────────────────────────────────────────────────────────────────────────
  const whExpFile = path.join(
    EXCEL_DIR,
    "ETC WH and Activity expenses Sheet Updated.xlsx",
  );
  const whExpWb = XLSX.readFile(whExpFile);
  const whExpData = XLSX.utils.sheet_to_json(whExpWb.Sheets["Pan India"], {
    defval: "",
  });

  let whExpCount = 0;
  // Take first 500 non-empty rows for performance
  const whExpRows = (whExpData as any[]).filter(
    (r) => r["Vendor Name"] && r["Total Bill Amt (₹)"],
  );

  for (let i = 0; i < Math.min(whExpRows.length, 500); i++) {
    const row = whExpRows[i];
    const totalAmt = safeFloat(row["Total Bill Amt (₹)"]);
    if (!totalAmt || totalAmt <= 0) continue;

    const blNumber = safeStr(row["BL"]);
    const contractId = blNumber ? contractMap[blNumber] : undefined;

    // Find or skip warehouse-related expense
    if (!contractId) continue;

    try {
      await prisma.expense.create({
        data: {
          contractId,
          blNumber,
          batchNumber: safeStr(row["Batch"]),
          category: "SERVICE_CHARGE",
          expenseType: safeStr(row["Type of Exp"]) || "OTHER",
          description:
            `${safeStr(row["Type Exp Desc"]) || ""} - ${safeStr(row["WH"]) || ""}`.trim(),
          amount: totalAmt,
          currency: "INR",
          vendor: safeStr(row["Vendor Name"]),
          invoiceNumber: safeStr(row["Inv NO"]),
          invoiceDate: parseExcelDate(row["Inv Date"]),
        },
      });
      whExpCount++;
    } catch (e: any) {
      // skip errors
    }
  }

  // Also create expenses that don't have a matching contract (as standalone warehouse expenses)
  const standaloneExpRows = (whExpData as any[])
    .filter(
      (r) =>
        r["Vendor Name"] &&
        r["Total Bill Amt (₹)"] &&
        (!r["BL"] || !contractMap[String(r["BL"])]),
    )
    .slice(0, 200);

  // Create a dummy contract for standalone warehouse expenses
  let standaloneContract: any = null;
  if (standaloneExpRows.length > 0) {
    standaloneContract = await prisma.importContract.create({
      data: {
        importRefNumber: "WH-EXPENSES-STANDALONE",
        contractId: "WH-EXP-STANDALONE",
        status: "ACTIVE_INVENTORY",
        material: "Various",
        supplier: "Various",
        quantity: 0,
        price: 0,
        incoterms: "N/A",
        createdById: admin.id,
      },
    });

    for (const row of standaloneExpRows) {
      const totalAmt = safeFloat(row["Total Bill Amt (₹)"]);
      if (!totalAmt || totalAmt <= 0) continue;

      try {
        await prisma.expense.create({
          data: {
            contractId: standaloneContract.id,
            blNumber: safeStr(row["BL"]),
            batchNumber: safeStr(row["Batch"]),
            category: "SERVICE_CHARGE",
            expenseType: safeStr(row["Type of Exp"]) || "OTHER",
            description:
              `${safeStr(row["Type Exp Desc"]) || ""} - ${safeStr(row["WH"]) || ""}`.trim(),
            amount: totalAmt,
            currency: "INR",
            vendor: safeStr(row["Vendor Name"]),
            invoiceNumber: safeStr(row["Inv NO"]),
            invoiceDate: parseExcelDate(row["Inv Date"]),
          },
        });
        whExpCount++;
      } catch (e: any) {
        // skip
      }
    }
  }
  console.log(`✓ ${whExpCount} warehouse expenses created`);

  // ──────────────────────────────────────────────────────────────────────────────
  // IMPORT CLEARANCE COSTS (from IMPORT_CCC sheet)
  // ──────────────────────────────────────────────────────────────────────────────
  const cccData = XLSX.utils.sheet_to_json(impWb.Sheets["IMPORT_CCC"], {
    defval: "",
  });
  let cccCount = 0;

  for (const row of cccData as any[]) {
    const blNumber = safeStr(row["__EMPTY_3"]);
    if (!blNumber) continue;
    const contractId = contractMap[blNumber];
    if (!contractId) continue;

    // Custom duty
    const duty = safeFloat(row["CUSTOM DUTY"]);
    if (duty && duty > 0) {
      await prisma.expense.create({
        data: {
          contractId,
          blNumber,
          category: "GOVERNMENT_CHARGE",
          expenseType: "CUSTOMS_DUTY",
          description: "Import Custom Duty",
          amount: duty,
          currency: "INR",
        },
      });
      cccCount++;
    }

    // CHA charges
    const cha = safeFloat(row[" CLEARANCE COST AS PER SAP ANEXURE "]);
    if (cha && cha > 0) {
      await prisma.expense.create({
        data: {
          contractId,
          blNumber,
          category: "SERVICE_CHARGE",
          expenseType: "CLEARING_FORWARDING",
          description: "CHA Charges",
          amount: cha,
          currency: "INR",
          vendor: safeStr(row["AS PER BILL CLEARANCE CHARGES"]),
        },
      });
      cccCount++;
    }

    // CFS charges
    const cfs = safeFloat(row["__EMPTY_20"]);
    if (cfs && cfs > 0) {
      await prisma.expense.create({
        data: {
          contractId,
          blNumber,
          category: "SERVICE_CHARGE",
          expenseType: "OTHER",
          description: "CFS Port Charges",
          amount: cfs,
          currency: "INR",
          vendor: safeStr(row["CFS CHARGES "]),
        },
      });
      cccCount++;
    }

    // Transportation
    const trans = safeFloat(row["__EMPTY_21"]);
    if (trans && trans > 0) {
      await prisma.expense.create({
        data: {
          contractId,
          blNumber,
          category: "SERVICE_CHARGE",
          expenseType: "TRANSPORTATION",
          description: "Transportation Charges",
          amount: trans,
          currency: "INR",
          vendor: safeStr(row["TRANSPORTATION CHARGES"]),
        },
      });
      cccCount++;
    }

    // Surveyor charges
    const surv = safeFloat(row["__EMPTY_22"]);
    if (surv && surv > 0) {
      await prisma.expense.create({
        data: {
          contractId,
          blNumber,
          category: "SERVICE_CHARGE",
          expenseType: "OTHER",
          description: "Surveyor Charges",
          amount: surv,
          currency: "INR",
          vendor: safeStr(row["SURVEYOR CHARGES"]),
        },
      });
      cccCount++;
    }
  }
  console.log(`✓ ${cccCount} import clearance cost entries created`);

  // Summary
  const totals = {
    users: await prisma.user.count(),
    warehouses: await prisma.warehouse.count(),
    plants: await prisma.plant.count(),
    importContracts: await prisma.importContract.count(),
    shipments: await prisma.shipment.count(),
    exportContracts: await prisma.exportContract.count(),
    exportExpenses: await prisma.exportExpense.count(),
    expenses: await prisma.expense.count(),
  };

  console.log("\n═══ SEED SUMMARY ═══");
  console.log(JSON.stringify(totals, null, 2));
  console.log("\n✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
