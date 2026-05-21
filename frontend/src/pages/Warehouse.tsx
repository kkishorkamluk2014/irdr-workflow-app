import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";

export default function Warehouse() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  useEffect(() => {
    api
      .get("/warehouse")
      .then((r) => {
        setWarehouses(r.data);
        const hid = searchParams.get("highlight");
        if (hid) {
          setHighlightId(hid);
          setTimeout(() => {
            rowRefs.current[hid]?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            setTimeout(() => setHighlightId(null), 3000);
          }, 200);
        }
      })
      .catch(() => {});
  }, []);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget).entries());
    await api.post("/warehouse", form);
    setShowModal(false);
    api.get("/warehouse").then((r) => setWarehouses(r.data));
  };

  return (
    <div>
      <div className="page-header">
        <h1>Warehouses & Plants</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Warehouse
        </button>
      </div>

      <div className="card table-container">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>City</th>
              <th>State</th>
              <th>Capacity</th>
              <th>Inventory Items</th>
            </tr>
          </thead>
          <tbody>
            {warehouses.map((w) => (
              <tr
                key={w.id}
                ref={(el) => {
                  rowRefs.current[w.id] = el;
                }}
                className={highlightId === w.id ? "row-highlighted" : ""}
              >
                <td>
                  <strong>{w.code}</strong>
                </td>
                <td>{w.name}</td>
                <td>{w.city || "—"}</td>
                <td>{w.state || "—"}</td>
                <td>{w.capacity ? `${w.capacity} ${w.capacityUnit}` : "—"}</td>
                <td>{w._count?.inventoryItems || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add Warehouse</h2>
            <form onSubmit={handleCreate}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Code *</label>
                  <input name="code" required />
                </div>
                <div className="form-group">
                  <label>Name *</label>
                  <input name="name" required />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input name="address" />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input name="city" />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input name="state" />
                </div>
                <div className="form-group">
                  <label>Capacity</label>
                  <input name="capacity" type="number" />
                </div>
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
