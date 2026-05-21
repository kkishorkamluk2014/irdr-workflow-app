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
      // Use CSV output which is cleaner, limited to used range
      const csv = XLSX.utils.sheet_to_csv(sheet, { FS: "|", blankrows: false });
      const lines = csv
        .split("\n")
        .filter((l) => l.replace(/\|/g, "").trim() !== "");
      console.log(`\n--- Sheet: "${sheetName}" (${lines.length} lines) ---`);
      // Print first 8 lines (header + data)
      for (let i = 0; i < Math.min(8, lines.length); i++) {
        // Trim trailing empty pipe-delimited fields
        const trimmed = lines[i].replace(/(\|)+$/, "");
        console.log(trimmed);
      }
      if (lines.length > 8) console.log(`... total ${lines.length} lines`);
    }
  } catch (e) {
    console.log(`\nERROR reading ${file}: ${e.message}`);
  }
}
