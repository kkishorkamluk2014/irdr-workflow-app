import XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../../frontend/public");

const files = [
  "Warehouse Agreement list details  2.xlsx",
  "EXPORT_TRACKING_SHEET.xlsx",
  "IMPORT_TRACKING_SHEET.xlsx",
  "ETC WH and Activity expenses Sheet Updated.xlsx",
];

for (const file of files) {
  const filePath = path.join(publicDir, file);
  try {
    const workbook = XLSX.readFile(filePath);
    console.log(`\n${"=".repeat(80)}`);
    console.log(`FILE: ${file}`);
    console.log(`SHEETS: ${workbook.SheetNames.join(", ")}`);

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      console.log(`\n--- Sheet: "${sheetName}" (${data.length} rows) ---`);
      if (data.length > 0) {
        console.log("COLUMNS:", Object.keys(data[0]).join(" | "));
        // Print first 3 rows as sample
        const sample = data.slice(0, 3);
        for (const row of sample) {
          console.log(JSON.stringify(row));
        }
        if (data.length > 3) {
          console.log(`... and ${data.length - 3} more rows`);
        }
      }
    }
  } catch (e) {
    console.log(`\nERROR reading ${file}: ${e.message}`);
  }
}
