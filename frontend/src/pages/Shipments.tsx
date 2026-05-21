import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import CustomFieldsManager from "../components/CustomFieldsManager";

interface FieldDef {
  id: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  required: boolean;
}

export default function Shipments() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const [customFieldDefs, setCustomFieldDefs] = useState<FieldDef[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  const loadFieldDefs = () => {
    api
      .get("/field-definitions?entityType=SHIPMENT")
      .then((r) => setCustomFieldDefs(r.data))
      .catch(() => {});
  };

  useEffect(() => {
    api
      .get("/shipments")
      .then((r) => {
        setShipments(r.data);
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
    loadFieldDefs();
  }, []);

  const getCustom = (s: any, key: string) => {
    try {
      const cf = JSON.parse(s.customFields || "{}");
      return cf[key] ?? "—";
    } catch {
      return "—";
    }
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget).entries());
    // Separate custom fields from standard fields
    const standardKeys = [
      "contractId",
      "blNumber",
      "vesselName",
      "cargoType",
      "loadingPort",
      "destinationPort",
      "departureDate",
    ];
    const payload: any = {};
    const custom: Record<string, string> = {};
    for (const [k, v] of Object.entries(form)) {
      if (standardKeys.includes(k)) payload[k] = v;
      else custom[k] = String(v);
    }
    if (Object.keys(customValues).length > 0)
      Object.assign(custom, customValues);
    payload.customFields = custom;
    await api.post("/shipments", payload);
    setShowModal(false);
    setCustomValues({});
    api.get("/shipments").then((r) => setShipments(r.data));
  };

  return (
    <div>
      <div className="page-header">
        <h1>Shipments</h1>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            className="btn btn-outline"
            onClick={() => setShowManager(true)}
          >
            ⚙ Manage Columns
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            + New Shipment
          </button>
        </div>
      </div>

      <div className="card table-container">
        <table>
          <thead>
            <tr>
              <th>BL Number</th>
              <th>Vessel</th>
              <th>Loading Port</th>
              <th>Destination</th>
              <th>Cargo</th>
              <th>Status</th>
              <th>Departure</th>
              {customFieldDefs.map((f) => (
                <th key={f.id}>{f.fieldLabel}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shipments.map((s) => (
              <tr
                key={s.id}
                ref={(el) => {
                  rowRefs.current[s.id] = el;
                }}
                className={highlightId === s.id ? "row-highlighted" : ""}
              >
                <td>
                  <strong>{s.blNumber}</strong>
                </td>
                <td>{s.vesselName || "—"}</td>
                <td>{s.loadingPort}</td>
                <td>{s.destinationPort}</td>
                <td>{s.cargoType}</td>
                <td>
                  <span
                    className={`badge badge-${s.status === "IMPORT_IN_TRANSIT" ? "transit" : "clearance"}`}
                  >
                    {s.status.replace(/_/g, " ")}
                  </span>
                </td>
                <td>
                  {s.departureDate
                    ? new Date(s.departureDate).toLocaleDateString()
                    : "—"}
                </td>
                {customFieldDefs.map((f) => (
                  <td key={f.id}>{getCustom(s, f.fieldName)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create Shipment</h2>
            <form onSubmit={handleCreate}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Contract ID *</label>
                  <input name="contractId" required />
                </div>
                <div className="form-group">
                  <label>BL Number *</label>
                  <input name="blNumber" required />
                </div>
                <div className="form-group">
                  <label>Vessel Name</label>
                  <input name="vesselName" />
                </div>
                <div className="form-group">
                  <label>Cargo Type *</label>
                  <select name="cargoType" required>
                    <option value="CONTAINER">Container</option>
                    <option value="BULK">Bulk</option>
                    <option value="BREAK_BULK">Break Bulk</option>
                    <option value="LIQUID_BULK">Liquid Bulk</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Loading Port *</label>
                  <input name="loadingPort" required />
                </div>
                <div className="form-group">
                  <label>Destination Port *</label>
                  <input name="destinationPort" required />
                </div>
                <div className="form-group">
                  <label>Departure Date</label>
                  <input name="departureDate" type="date" />
                </div>

                {/* Dynamic custom fields */}
                {customFieldDefs.map((f) => (
                  <div className="form-group" key={f.id}>
                    <label>
                      {f.fieldLabel}
                      {f.required ? " *" : ""}
                    </label>
                    {f.fieldType === "BOOLEAN" ? (
                      <select
                        value={customValues[f.fieldName] || ""}
                        onChange={(ev) =>
                          setCustomValues((prev) => ({
                            ...prev,
                            [f.fieldName]: ev.target.value,
                          }))
                        }
                        required={f.required}
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    ) : (
                      <input
                        type={
                          f.fieldType === "NUMBER"
                            ? "number"
                            : f.fieldType === "DATE"
                              ? "date"
                              : "text"
                        }
                        value={customValues[f.fieldName] || ""}
                        onChange={(ev) =>
                          setCustomValues((prev) => ({
                            ...prev,
                            [f.fieldName]: ev.target.value,
                          }))
                        }
                        required={f.required}
                      />
                    )}
                  </div>
                ))}
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

      {showManager && (
        <CustomFieldsManager
          entityType="SHIPMENT"
          onClose={() => setShowManager(false)}
          onSaved={() => {
            loadFieldDefs();
            api.get("/shipments").then((r) => setShipments(r.data));
          }}
        />
      )}
    </div>
  );
}
