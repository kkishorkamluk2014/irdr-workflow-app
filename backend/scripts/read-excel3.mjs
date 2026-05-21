import XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../../frontend/public");

// Focus on IMPORT_TRACKING_SHEET first
const wb = XLSX.readFile(path.join(publicDir, "IMPORT_TRACKING_SHEET.xlsx"));
console.log("SHEETS:", wb.SheetNames.join(", "));

// Read IMPORT sheet
const importSheet = wb.Sheets["IMPORT"];
const importData = XLSX.utils.sheet_to_json(importSheet, { defval: "" });
// Filter out rows with all empty values
const filtered = importData.filter((row) => {
  const vals = Object.values(row);
  return vals.some((v) => v !== "" && v !== 0);
});
console.log(`\nIMPORT sheet: ${filtered.length} rows`);
if (filtered.length > 0) {
  const keys = Object.keys(filtered[0]).filter(
    (k) => !k.startsWith("__EMPTY_1"),
  );
  console.log("COLUMNS:", keys.slice(0, 40).join(" | "));
  // First 3 rows, limited cols
  for (let i = 0; i < Math.min(3, filtered.length); i++) {
    const obj = {};
    for (const k of keys.slice(0, 40)) obj[k] = filtered[i][k];
    console.log(JSON.stringify(obj));
  }
}

// Read IMPORT_CCC sheet (costing)
const cccSheet = wb.Sheets["IMPORT_CCC"];
if (cccSheet) {
  const cccData = XLSX.utils.sheet_to_json(cccSheet, { defval: "" });
  const cccFiltered = cccData.filter((row) => {
    const vals = Object.values(row);
    return vals.some((v) => v !== "" && v !== 0);
  });
  console.log(`\nIMPORT_CCC sheet: ${cccFiltered.length} rows`);
  if (cccFiltered.length > 0) {
    const keys = Object.keys(cccFiltered[0]).filter(
      (k) => !k.startsWith("__EMPTY_1"),
    );
    console.log("COLUMNS:", keys.slice(0, 50).join(" | "));
    for (let i = 0; i < Math.min(2, cccFiltered.length); i++) {
      const obj = {};
      for (const k of keys.slice(0, 50)) obj[k] = cccFiltered[i][k];
      console.log(JSON.stringify(obj));
    }
  }
}

// Warehouse agreement
const whWb = XLSX.readFile(
  path.join(publicDir, "Warehouse Agreement list details  2.xlsx"),
);
const whSheet = whWb.Sheets[whWb.SheetNames[0]];
const whData = XLSX.utils.sheet_to_json(whSheet, { defval: "" });
const whFiltered = whData.filter((row) =>
  Object.values(row).some((v) => v !== ""),
);
console.log(
  `\nWarehouse Agreement (${whWb.SheetNames[0]}): ${whFiltered.length} rows`,
);
if (whFiltered.length > 0) {
  const keys = Object.keys(whFiltered[0]).filter(
    (k) => !k.startsWith("__EMPTY_"),
  );
  console.log("COLUMNS:", keys.join(" | "));
  for (let i = 0; i < Math.min(5, whFiltered.length); i++) {
    const obj = {};
    for (const k of keys) obj[k] = whFiltered[i][k];
    console.log(JSON.stringify(obj));
  }
}

// ETC WH expenses
const etcWb = XLSX.readFile(
  path.join(publicDir, "ETC WH and Activity expenses Sheet Updated.xlsx"),
);
console.log(`\nETC WH sheets: ${etcWb.SheetNames.join(", ")}`);
const etcSheet = etcWb.Sheets[etcWb.SheetNames[0]];
const etcData = XLSX.utils.sheet_to_json(etcSheet, { defval: "" });
const etcFiltered = etcData.filter((row) =>
  Object.values(row).some((v) => v !== ""),
);
console.log(`ETC WH (${etcWb.SheetNames[0]}): ${etcFiltered.length} rows`);
if (etcFiltered.length > 0) {
  const keys = Object.keys(etcFiltered[0]).filter(
    (k) => !k.startsWith("__EMPTY_1"),
  );
  console.log("COLUMNS:", keys.slice(0, 30).join(" | "));
  for (let i = 0; i < Math.min(3, etcFiltered.length); i++) {
    const obj = {};
    for (const k of keys.slice(0, 30)) obj[k] = etcFiltered[i][k];
    console.log(JSON.stringify(obj));
  }
}
