import { useEffect, useState } from "react";
import api from "../services/api";

interface DashboardData {
  totalContracts: number;
  contractsByStatus: { status: string; _count: number }[];
  totalInventory: number;
  fundedInventory: number;
  activeInventory: number;
  pendingApprovals: number;
  recentActivity: {
    id: string;
    action: string;
    description: string;
    createdAt: string;
    performedBy: { name: string };
  }[];
  totalExportContracts: number;
  totalShipments: number;
  shipmentsByStatus: { status: string; _count: number }[];
  totalExpenses: number;
  totalExpenseAmount: number;
  totalWarehouses: number;
  warehousesByStatus: { agreementStatus: string; _count: number }[];
  totalPlants: number;
  totalExportExpenseAmount: number;
  totalDeliveryOrders: number;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    api
      .get("/dashboard/summary")
      .then((res) => setData(res.data))
      .catch(() => {});
  }, []);

  if (!data) return <p>Loading dashboard...</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p style={{ color: "var(--text-muted)" }}>
          Real-time Import, Export & Inventory Visibility
        </p>
      </div>

      {/* Key Metrics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{data.totalContracts}</div>
          <div className="stat-label">Import Contracts</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data.totalExportContracts}</div>
          <div className="stat-label">Export Contracts</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data.totalShipments}</div>
          <div className="stat-label">Shipments</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data.totalExpenses}</div>
          <div className="stat-label">Expense Entries</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            ₹{formatAmount(data.totalExpenseAmount)}
          </div>
          <div className="stat-label">Total Import Expenses</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            ₹{formatAmount(data.totalExportExpenseAmount)}
          </div>
          <div className="stat-label">Total Export Expenses</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data.totalInventory}</div>
          <div className="stat-label">Inventory Items</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data.activeInventory}</div>
          <div className="stat-label">Active Inventory</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "var(--danger)" }}>
            {data.fundedInventory}
          </div>
          <div className="stat-label">Funded (Dead) Inventory</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data.totalWarehouses}</div>
          <div className="stat-label">Warehouses</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data.totalPlants}</div>
          <div className="stat-label">Plants</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data.totalDeliveryOrders}</div>
          <div className="stat-label">Delivery Orders</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "var(--warning)" }}>
            {data.pendingApprovals}
          </div>
          <div className="stat-label">Pending Approvals</div>
        </div>
      </div>

      {/* Breakdown Tables */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.5rem",
          marginTop: "1.5rem",
        }}
      >
        <div className="card">
          <h3 style={{ marginBottom: "1rem" }}>Import Contracts by Status</h3>
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {data.contractsByStatus.map((s) => (
                <tr key={s.status}>
                  <td>
                    <span className={`badge badge-${statusClass(s.status)}`}>
                      {formatStatus(s.status)}
                    </span>
                  </td>
                  <td>{s._count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: "1rem" }}>Shipments by Status</h3>
          {data.shipmentsByStatus.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {data.shipmentsByStatus.map((s) => (
                  <tr key={s.status}>
                    <td>
                      <span className={`badge badge-${statusClass(s.status)}`}>
                        {formatStatus(s.status)}
                      </span>
                    </td>
                    <td>{s._count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              No shipment data
            </p>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: "1rem" }}>Warehouse Agreement Status</h3>
          {data.warehousesByStatus.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {data.warehousesByStatus.map((s) => (
                  <tr key={s.agreementStatus}>
                    <td>
                      <span
                        className={`badge badge-${s.agreementStatus === "LIVE" ? "active" : "draft"}`}
                      >
                        {s.agreementStatus}
                      </span>
                    </td>
                    <td>{s._count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              No warehouse status data
            </p>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: "1rem" }}>Recent Activity</h3>
          <div>
            {data.recentActivity.length > 0 ? (
              data.recentActivity.map((a) => (
                <div
                  key={a.id}
                  style={{
                    padding: "0.5rem 0",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <p style={{ fontSize: "0.85rem" }}>
                    <strong>{a.performedBy.name}</strong> — {a.action}
                  </p>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {a.description}
                  </p>
                  <p
                    style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
                  >
                    {new Date(a.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                No recent activity
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatAmount(num: number): string {
  if (num >= 10000000) return (num / 10000000).toFixed(2) + " Cr";
  if (num >= 100000) return (num / 100000).toFixed(2) + " L";
  if (num >= 1000) return (num / 1000).toFixed(1) + " K";
  return num.toLocaleString();
}

function formatStatus(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusClass(s: string): string {
  const map: Record<string, string> = {
    DRAFT_VALIDATION: "draft",
    IMPORT_PLANNING: "planning",
    IMPORT_IN_TRANSIT: "transit",
    IMPORT_UNDER_CLEARANCE: "clearance",
    CLEARANCE_COMPLETED: "completed",
    WAREHOUSE_INWARD_PENDING: "pending",
    DELIVERED: "delivered",
    FUNDED_INVENTORY: "funded",
    FUNDING_RELEASED: "released",
    ACTIVE_INVENTORY: "active",
  };
  return map[s] || "draft";
}
