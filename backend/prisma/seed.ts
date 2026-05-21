import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create default admin user
  const passwordHash = await bcrypt.hash('admin123', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@irdr.com' },
    update: {},
    create: {
      email: 'admin@irdr.com',
      passwordHash,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  // Create CMT Team user
  const cmtHash = await bcrypt.hash('cmt123', 12);
  await prisma.user.upsert({
    where: { email: 'cmt@irdr.com' },
    update: {},
    create: {
      email: 'cmt@irdr.com',
      passwordHash: cmtHash,
      name: 'CMT Team User',
      role: 'CMT_TEAM',
    },
  });

  // Create sample warehouses
  const wh1 = await prisma.warehouse.upsert({
    where: { code: 'WH-MUM-01' },
    update: {},
    create: { name: 'Mumbai Port Warehouse', code: 'WH-MUM-01', city: 'Mumbai', state: 'Maharashtra', capacity: 5000 },
  });

  const wh2 = await prisma.warehouse.upsert({
    where: { code: 'WH-CHN-01' },
    update: {},
    create: { name: 'Chennai Storage Yard', code: 'WH-CHN-01', city: 'Chennai', state: 'Tamil Nadu', capacity: 3000 },
  });

  // Create sample plant
  await prisma.plant.upsert({
    where: { code: 'PLT-PUN-01' },
    update: {},
    create: { name: 'Pune Processing Plant', code: 'PLT-PUN-01', city: 'Pune', state: 'Maharashtra' },
  });

  // Create sample contract
  const contract = await prisma.importContract.create({
    data: {
      importRefNumber: 'IMP-2026-DEMO0001',
      contractId: 'CTR-2026-DEMO0001',
      material: 'Hot Rolled Steel Coil',
      supplier: 'ArcelorMittal SA',
      quantity: 500,
      unit: 'MT',
      price: 620,
      currency: 'USD',
      incoterms: 'CIF',
      cargoType: 'BULK',
      loadingPort: 'Rotterdam',
      destinationPort: 'Mumbai JNPT',
      status: 'IMPORT_PLANNING',
      createdById: admin.id,
    },
  });

  // Create sample inventory
  await prisma.inventoryItem.create({
    data: {
      contractId: contract.id,
      inventoryType: 'IMPORT',
      material: 'Hot Rolled Steel Coil',
      quantity: 500,
      unit: 'MT',
      blNumber: 'MAEU1234567',
      batchNumber: 'BATCH-2026-001',
      warehouseId: wh1.id,
      status: 'ACTIVE_INVENTORY',
    },
  });

  // Create funded inventory sample
  await prisma.inventoryItem.create({
    data: {
      inventoryType: 'IMPORT',
      material: 'Copper Cathode',
      quantity: 200,
      unit: 'MT',
      blNumber: 'HLCU9876543',
      batchNumber: 'BATCH-2026-002',
      warehouseId: wh2.id,
      isFunded: true,
      isDeadInventory: true,
      fundingAgency: 'State Bank of India',
      fundingAmount: 15000000,
      fundingStartDate: new Date('2026-03-01'),
      interestAccrued: 450000,
      storageCost: 120000,
      labourCost: 50000,
      blockedForSale: true,
      blockedForTransfer: true,
      blockedForConsumption: true,
      status: 'FUNDED_INVENTORY',
    },
  });

  console.log('✓ Seed data created successfully');
  console.log('  Admin login: admin@irdr.com / admin123');
  console.log('  CMT login:   cmt@irdr.com / cmt123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
