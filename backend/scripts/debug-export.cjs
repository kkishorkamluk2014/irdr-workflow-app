const XLSX = require("xlsx");
const path = require("path");

const dir = path.join(__dirname, "../frontend/public");
const wb = XLSX.readFile(path.join(dir, "EXPORT_TRACKING_SHEET.xlsx"));
const data = XLSX.utils.sheet_to_json(wb.Sheets["EX"], { defval: "" });
console.log("Total EX rows:", data.length);
console.log("Keys of row 0:", JSON.stringify(Object.keys(data[0])));
console.log("\nRow 0 STATUS:", data[0]["STATUS OF SHIPMENT"]);
console.log("Row 0 CONTRACT NO:", data[0]["CONTRACT NO"]);
console.log("Row 0 BL:", data[0]["BL NO./ LR NO"]);
console.log("Row 0 BUYER:", data[0]["BUYER"]);
console.log("Row 0 QTY:", data[0]["QTY (MT)"]);

// Check how many rows have a CONTRACT NO
const withContract = data.filter(
  (r) => r["CONTRACT NO"] && r["CONTRACT NO"] !== "",
);
console.log("\nRows with CONTRACT NO:", withContract.length);

// Check EX_COSTING
const costData = XLSX.utils.sheet_to_json(wb.Sheets["EX_COSTING"], {
  defval: "",
});
console.log("\nEX_COSTING total rows:", costData.length);
console.log(
  "EX_COSTING Keys:",
  JSON.stringify(Object.keys(costData[0]).slice(0, 20)),
);
const withPI = costData.filter(
  (r) => r["PROFORMA INVOICE"] || r[" PROFORMA INVOICE "],
);
console.log("Rows with PROFORMA INVOICE:", withPI.length);
if (withPI.length > 0)
  console.log(
    "Sample PI:",
    withPI[0]["PROFORMA INVOICE"] || withPI[0][" PROFORMA INVOICE "],
  );
