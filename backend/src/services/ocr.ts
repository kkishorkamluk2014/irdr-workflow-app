import Tesseract from 'tesseract.js';

interface OcrResult {
  material?: string;
  supplier?: string;
  quantity?: number;
  price?: number;
  blNumber?: string;
  incoterms?: string;
  rawText: string;
}

export async function ocrExtractContract(filePath: string, documentType: 'CONTRACT' | 'BL'): Promise<OcrResult> {
  const { data: { text } } = await Tesseract.recognize(filePath, 'eng');

  const result: OcrResult = { rawText: text };

  // Extract BL Number pattern (e.g., BL-2024-XXXXX or MSKU1234567)
  const blMatch = text.match(/(?:BL|B\/L|Bill of Lading)[:\s#]*([A-Z0-9-]+)/i);
  if (blMatch) result.blNumber = blMatch[1];

  // Extract quantity (pattern: number followed by MT/KG/Tons)
  const qtyMatch = text.match(/(?:quantity|qty)[:\s]*([0-9,.]+)\s*(MT|KG|Tons?)/i);
  if (qtyMatch) result.quantity = parseFloat(qtyMatch[1].replace(/,/g, ''));

  // Extract price (pattern: currency symbol followed by number)
  const priceMatch = text.match(/(?:price|amount|value)[:\s]*(?:USD|INR|\$|₹)?\s*([0-9,.]+)/i);
  if (priceMatch) result.price = parseFloat(priceMatch[1].replace(/,/g, ''));

  // Extract Incoterms
  const incoMatch = text.match(/\b(FOB|CIF|CFR|EXW|DDP|DAP|FCA|CPT|CIP|DAT)\b/i);
  if (incoMatch) result.incoterms = incoMatch[1].toUpperCase();

  // Extract supplier/shipper name
  const supplierMatch = text.match(/(?:supplier|shipper|seller)[:\s]*([A-Za-z\s&.]+?)(?:\n|,)/i);
  if (supplierMatch) result.supplier = supplierMatch[1].trim();

  // Extract material
  const materialMatch = text.match(/(?:material|commodity|goods|product)[:\s]*([A-Za-z\s]+?)(?:\n|,)/i);
  if (materialMatch) result.material = materialMatch[1].trim();

  return result;
}
