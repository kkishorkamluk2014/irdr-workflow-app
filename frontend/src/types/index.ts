export type ContractStatus =
  | 'DRAFT_VALIDATION'
  | 'IMPORT_PLANNING'
  | 'IMPORT_IN_TRANSIT'
  | 'IMPORT_UNDER_CLEARANCE'
  | 'CLEARANCE_COMPLETED'
  | 'WAREHOUSE_INWARD_PENDING'
  | 'DELIVERED'
  | 'FUNDED_INVENTORY'
  | 'FUNDING_RELEASED'
  | 'ACTIVE_INVENTORY';

export type InventoryType = 'IMPORT' | 'LOCAL_PURCHASE' | 'LOCAL_SALE' | 'EXPORT' | 'STO_INWARD' | 'STO_OUTWARD';
export type ChargeCategory = 'SERVICE_CHARGE' | 'GOVERNMENT_CHARGE' | 'SHIPPING_LINE_CHARGE';
export type CargoType = 'CONTAINER' | 'BULK' | 'BREAK_BULK' | 'LIQUID_BULK';
export type ExpenseType = 'TRANSPORTATION' | 'LOADING' | 'UNLOADING' | 'LABOUR' | 'STORAGE' | 'INTEREST' | 'CLEARING_FORWARDING' | 'CUSTOMS_DUTY' | 'OTHER';

export interface ImportContract {
  id: string;
  importRefNumber: string;
  contractId: string;
  status: ContractStatus;
  material: string;
  supplier: string;
  quantity: number;
  unit: string;
  price: number;
  currency: string;
  incoterms: string;
  blNumber: string | null;
  blValidated: boolean;
  blMismatch: boolean;
  cargoType: CargoType | null;
  loadingPort: string | null;
  destinationPort: string | null;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  inventoryType: InventoryType;
  material: string;
  quantity: number;
  unit: string;
  blNumber: string | null;
  batchNumber: string | null;
  isFunded: boolean;
  isDeadInventory: boolean;
  fundingAgency: string | null;
  fundingAmount: number | null;
  status: ContractStatus;
}
