# IRDR Workflow App

## End-to-End Import, Funding & Inventory Workflow System
**Owner:** IRDR Solutions Private Limited

---

## Features (All 7 Phases)

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Import Contract Upload & Validation (OCR, BL Validation, Mismatch Approval) | ✅ |
| 2 | Shipment Lifecycle Workflow (In Transit → Under Clearance) | ✅ |
| 3 | Customs Clearance & Expense Tracking (Service/Govt/Shipping charges) | ✅ |
| 4 | Stock Transfer & Inventory Tracking (BL-wise, Batch-wise, Movement expenses) | ✅ |
| 5 | Funded Inventory Workflow (Dead inventory, blocking, release, audit trail) | ✅ |
| 6 | Warehouse & Plant Operations (Inward confirmation, Delivery orders, Activities) | ✅ |
| 7 | Real-Time Visibility & Reporting Dashboard | ✅ |

---

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **OCR:** Tesseract.js (can be replaced with Azure Document Intelligence)
- **Auth:** JWT-based authentication

---

## Prerequisites

- **Node.js** >= 18
- **PostgreSQL** >= 14
- **npm** >= 9

---

## Quick Start

### 1. Install dependencies

```bash
cd irdr-workflow-app
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 2. Configure database

```bash
# Copy the env file and update DATABASE_URL
cp backend/.env.example backend/.env
# Edit backend/.env with your PostgreSQL connection string
```

### 3. Setup database

```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
cd ..
```

### 4. Run the application

```bash
npm run dev
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000

### 5. Login credentials (from seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@irdr.com | admin123 |
| CMT Team | cmt@irdr.com | cmt123 |

---

## Workflow Statuses

| Status | Description |
|--------|-------------|
| Draft Validation | Contract Uploaded |
| Import Planning | Contract Approved |
| Import In Transit | Cargo Shipped |
| Import Under Clearance | BOE Filed / Indian Waters |
| Clearance Completed | Customs Cleared |
| Warehouse Inward Pending | Transit to Warehouse |
| Delivered | Material Received |
| Funded Inventory | Under Financier Control |
| Funding Released | Ownership Released |
| Active Inventory | Available for Use |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| GET | /api/contracts | List contracts |
| POST | /api/contracts | Create contract |
| POST | /api/contracts/:id/validate-bl | Validate BL |
| POST | /api/contracts/:id/ocr-extract | OCR extraction |
| PATCH | /api/contracts/:id/status | Update status |
| GET/POST | /api/shipments | Shipment CRUD |
| GET/POST | /api/expenses | Expense CRUD |
| GET | /api/expenses/landed-cost/:id | Landed cost calc |
| GET/POST | /api/inventory | Inventory CRUD |
| POST | /api/inventory/:id/transfer | Stock transfer |
| POST | /api/inventory/:id/fund | Mark funded |
| POST | /api/inventory/:id/release-funding | Release funding |
| GET/POST | /api/warehouse | Warehouse CRUD |
| POST | /api/warehouse/:id/inward | Inward confirmation |
| POST | /api/warehouse/:id/delivery-order | Delivery order |
| GET/PATCH | /api/approvals | Approval workflow |
| GET | /api/dashboard/summary | Dashboard data |
| GET | /api/dashboard/inventory-by-bl | BL-wise report |
| GET | /api/dashboard/funded-inventory | Funded report |
| GET | /api/dashboard/lifecycle | Lifecycle report |

---

## Project Structure

```
irdr-workflow-app/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.ts            # Seed data
│   └── src/
│       ├── index.ts           # Express server
│       ├── middleware/auth.ts  # JWT auth
│       ├── models/prisma.ts   # Prisma client
│       ├── routes/            # API routes
│       │   ├── auth.ts
│       │   ├── contracts.ts
│       │   ├── shipments.ts
│       │   ├── expenses.ts
│       │   ├── inventory.ts
│       │   ├── warehouse.ts
│       │   ├── approvals.ts
│       │   └── dashboard.ts
│       └── services/
│           ├── ocr.ts         # OCR extraction
│           └── validation.ts  # BL validation
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/Layout.tsx
│   │   ├── hooks/useAuth.tsx
│   │   ├── services/api.ts
│   │   └── pages/
│   │       ├── Dashboard.tsx
│   │       ├── Contracts.tsx
│   │       ├── ContractDetail.tsx
│   │       ├── Shipments.tsx
│   │       ├── Inventory.tsx
│   │       ├── FundedInventory.tsx
│   │       ├── Warehouse.tsx
│   │       ├── Approvals.tsx
│   │       └── Expenses.tsx
│   └── index.html
└── package.json
```
