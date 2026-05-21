import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { contractRoutes } from "./routes/contracts";
import { shipmentRoutes } from "./routes/shipments";
import { expenseRoutes } from "./routes/expenses";
import { inventoryRoutes } from "./routes/inventory";
import { warehouseRoutes } from "./routes/warehouse";
import { approvalRoutes } from "./routes/approvals";
import { dashboardRoutes } from "./routes/dashboard";
import { searchRoutes } from "./routes/search";
import { authRoutes } from "./routes/auth";
import { authMiddleware } from "./middleware/auth";
import fieldDefinitionRoutes from "./routes/fieldDefinitions";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Public routes
app.use("/api/auth", authRoutes);

// Protected routes
app.use("/api/contracts", authMiddleware, contractRoutes);
app.use("/api/shipments", authMiddleware, shipmentRoutes);
app.use("/api/expenses", authMiddleware, expenseRoutes);
app.use("/api/inventory", authMiddleware, inventoryRoutes);
app.use("/api/warehouse", authMiddleware, warehouseRoutes);
app.use("/api/approvals", authMiddleware, approvalRoutes);
app.use("/api/dashboard", authMiddleware, dashboardRoutes);
app.use("/api/search", authMiddleware, searchRoutes);
app.use("/api/field-definitions", authMiddleware, fieldDefinitionRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Serve frontend static files in production
const frontendDist = path.join(__dirname, "../../frontend/dist");
app.use(express.static(frontendDist));
app.get("*", (_req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"));
});

app.listen(PORT, () => {
  console.log(`IRDR Workflow API running on port ${PORT}`);
});

export default app;
