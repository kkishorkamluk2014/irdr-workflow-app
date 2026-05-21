import { useEffect, useState } from "react";
import api from "../services/api";

interface WarehouseOption {
  id: string;
  name: string;
  code: string;
  city?: string;
}

export default function Inventory() {
  const [items, setItems] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [plants, setPlants] = useState<WarehouseOption[]>([]);
  const [locationType, setLocationType] = useState<"warehouse" | "plant">(
    "warehouse",
  );

  useEffect(() => {
    api
      .get("/inventory")
      .then((r) => setItems(r.data))
      .catch(() => {});
    api
      .get("/warehouse")
      .then((r) => setWarehouses(r.data))
      .catch(() => {});
    api
      .get("/warehouse/plants")
      .then((r) => setPlants(r.data))
      .catch(() => {});
  }, []);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget).entries());
    await api.post("/inventory", form);
    setShowModal(false);
    api.get("/inventory").then((r) => setItems(r.data));
  };

  return (
    <div>
      <div className="page-header">
        <h1>Inventory</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Inventory
        </button>
      </div>

      <div className="card table-container">
        <table>
          <thead>
            <tr>
              <th>Material</th>
              <th>Type</th>
              <th>Qty</th>
              <th>BL #</th>
              <th>Batch #</th>
              <th>Location</th>
              <th>Status</th>
              <th>Funded</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id}>
                <td>
                  <strong>{i.material}</strong>
                </td>
                <td>{i.inventoryType}</td>
                <td>
                  {i.quantity} {i.unit}
                </td>
                <td>{i.blNumber || "—"}</td>
                <td>{i.batchNumber || "—"}</td>
                <td>{i.warehouse?.name || i.plant?.name || "—"}</td>
                <td>
                  <span
                    className={`badge badge-${i.status === "ACTIVE_INVENTORY" ? "active" : "funded"}`}
                  >
                    {i.status.replace(/_/g, " ")}
                  </span>
                </td>
                <td>{i.isFunded ? "🔒 Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add Inventory Item</h2>
            <form onSubmit={handleCreate}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Material *</label>
                  <input name="material" required />
                </div>
                <div className="form-group">
                  <label>Type *</label>
                  <select name="inventoryType" required>
                    <option value="IMPORT">Import</option>
                    <option value="LOCAL_PURCHASE">Local Purchase</option>
                    <option value="LOCAL_SALE">Local Sale</option>
                    <option value="EXPORT">Export</option>
                    <option value="STO_INWARD">STO Inward</option>
                    <option value="STO_OUTWARD">STO Outward</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantity *</label>
                  <input name="quantity" type="number" step="0.01" required />
                </div>
                <div className="form-group">
                  <label>Unit</label>
                  <select name="unit">
                    <option>MT</option>
                    <option>KG</option>
                    <option>Tons</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>BL Number</label>
                  <input name="blNumber" />
                </div>
                <div className="form-group">
                  <label>Batch Number</label>
                  <input name="batchNumber" />
                </div>
                <div className="form-group">
                  <label>Contract ID</label>
                  <input name="contractId" />
                </div>
                <div className="form-group">
                  <label>Location Type</label>
                  <select
                    value={locationType}
                    onChange={(e) =>
                      setLocationType(e.target.value as "warehouse" | "plant")
                    }
                  >
                    <option value="warehouse">Warehouse</option>
                    <option value="plant">Plant</option>
                  </select>
                </div>
                {locationType === "warehouse" ? (
                  <div className="form-group">
                    <label>Warehouse *</label>
                    <select name="warehouseId" required>
                      <option value="">— Select Warehouse —</option>
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.code} — {w.name}
                          {w.city ? ` (${w.city})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="form-group">
                    <label>Plant *</label>
                    <select name="plantId" required>
                      <option value="">— Select Plant —</option>
                      {plants.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code} — {p.name}
                          {p.city ? ` (${p.city})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div
                style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}
              >
                <button type="submit" className="btn btn-primary">
                  Create
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
