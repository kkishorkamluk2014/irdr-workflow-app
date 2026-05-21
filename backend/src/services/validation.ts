interface ContractData {
  material: string;
  quantity: number;
  price: number;
}

interface BLData {
  blMaterial: string;
  blQuantity: number;
  blPrice: number;
}

interface ValidationResult {
  hasMismatch: boolean;
  mismatches: {
    field: string;
    contractValue: string | number;
    blValue: string | number;
    variance?: number;
  }[];
}

export function validateContractAgainstBL(contract: ContractData, bl: BLData): ValidationResult {
  const mismatches: ValidationResult['mismatches'] = [];

  // Quantity check (allow 2% tolerance for weight-based goods)
  const qtyVariance = Math.abs(contract.quantity - bl.blQuantity) / contract.quantity;
  if (qtyVariance > 0.02) {
    mismatches.push({
      field: 'quantity',
      contractValue: contract.quantity,
      blValue: bl.blQuantity,
      variance: qtyVariance * 100,
    });
  }

  // Material check (case-insensitive)
  if (contract.material.toLowerCase().trim() !== bl.blMaterial.toLowerCase().trim()) {
    mismatches.push({
      field: 'material',
      contractValue: contract.material,
      blValue: bl.blMaterial,
    });
  }

  // Price check (allow 1% tolerance)
  const priceVariance = Math.abs(contract.price - bl.blPrice) / contract.price;
  if (priceVariance > 0.01) {
    mismatches.push({
      field: 'price',
      contractValue: contract.price,
      blValue: bl.blPrice,
      variance: priceVariance * 100,
    });
  }

  return {
    hasMismatch: mismatches.length > 0,
    mismatches,
  };
}
