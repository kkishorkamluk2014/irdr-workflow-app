import { useEffect, useState } from "react";
import api from "../services/api";

interface FieldDef {
  id: string;
  entityType: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  required: boolean;
  active: boolean;
  sortOrder: number;
}

interface Props {
  entityType: "SHIPMENT" | "EXPENSE";
  onClose: () => void;
  onSaved: () => void;
}

const FIELD_TYPE_LABELS: Record<string, string> = {
  TEXT: "Text",
  NUMBER: "Number",
  DATE: "Date",
  BOOLEAN: "Yes / No",
};

export default function CustomFieldsManager({
  entityType,
  onClose,
  onSaved,
}: Props) {
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [label, setLabel] = useState("");
  const [fieldType, setFieldType] = useState("TEXT");
  const [required, setRequired] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    api
      .get(`/field-definitions?entityType=${entityType}`)
      .then((r) => setFields(r.data))
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, [entityType]);

  const toFieldName = (lbl: string) =>
    lbl
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

  const handleAdd = async () => {
    if (!label.trim()) {
      setError("Label is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.post("/field-definitions", {
        entityType,
        fieldName: toFieldName(label),
        fieldLabel: label.trim(),
        fieldType,
        required,
      });
      setLabel("");
      setFieldType("TEXT");
      setRequired(false);
      setShowAdd(false);
      load();
      onSaved();
    } catch (e: any) {
      setError(e?.response?.data?.error || "Failed to add field");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/field-definitions/${id}`);
    load();
    onSaved();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth: 560, width: "95%" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <h2 style={{ margin: 0 }}>
            ⚙ Manage Custom Columns —{" "}
            {entityType === "SHIPMENT" ? "Shipments" : "Expenses"}
          </h2>
          <button
            className="btn btn-outline"
            style={{ padding: "0.25rem 0.75rem" }}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Existing fields */}
        {fields.length === 0 ? (
          <p style={{ color: "#888", margin: "1rem 0" }}>
            No custom columns yet. Add one below.
          </p>
        ) : (
          <div style={{ marginBottom: "1rem" }}>
            <table style={{ width: "100%", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ background: "#f5f7fa" }}>
                  <th style={{ textAlign: "left", padding: "0.5rem" }}>
                    Label
                  </th>
                  <th style={{ textAlign: "left", padding: "0.5rem" }}>Type</th>
                  <th style={{ textAlign: "left", padding: "0.5rem" }}>
                    Required
                  </th>
                  <th style={{ padding: "0.5rem" }}></th>
                </tr>
              </thead>
              <tbody>
                {fields.map((f) => (
                  <tr key={f.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "0.5rem" }}>
                      <strong>{f.fieldLabel}</strong>
                      <br />
                      <span style={{ color: "#888", fontSize: "0.78rem" }}>
                        {f.fieldName}
                      </span>
                    </td>
                    <td style={{ padding: "0.5rem" }}>
                      {FIELD_TYPE_LABELS[f.fieldType] || f.fieldType}
                    </td>
                    <td style={{ padding: "0.5rem" }}>
                      {f.required ? "✅" : "—"}
                    </td>
                    <td style={{ padding: "0.5rem", textAlign: "right" }}>
                      <button
                        className="btn btn-outline"
                        style={{
                          padding: "0.2rem 0.6rem",
                          fontSize: "0.8rem",
                          color: "#c0392b",
                          borderColor: "#c0392b",
                        }}
                        onClick={() => handleDelete(f.id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add new field */}
        {!showAdd ? (
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            + Add Column
          </button>
        ) : (
          <div
            style={{
              background: "#f8f9fb",
              borderRadius: 8,
              padding: "1rem",
              marginTop: "0.5rem",
              border: "1px solid #e0e0e0",
            }}
          >
            <h3 style={{ margin: "0 0 0.75rem" }}>New Column</h3>
            {error && (
              <p style={{ color: "#c0392b", marginBottom: "0.5rem" }}>
                {error}
              </p>
            )}
            <div className="form-grid">
              <div className="form-group">
                <label>Column Label *</label>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Freight Forwarder"
                />
              </div>
              <div className="form-group">
                <label>Data Type *</label>
                <select
                  value={fieldType}
                  onChange={(e) => setFieldType(e.target.value)}
                >
                  <option value="TEXT">Text</option>
                  <option value="NUMBER">Number</option>
                  <option value="DATE">Date</option>
                  <option value="BOOLEAN">Yes / No</option>
                </select>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                margin: "0.75rem 0",
              }}
            >
              <input
                type="checkbox"
                id="req"
                checked={required}
                onChange={(e) => setRequired(e.target.checked)}
              />
              <label htmlFor="req" style={{ marginBottom: 0 }}>
                Required field
              </label>
            </div>
            <div
              style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}
            >
              <button
                className="btn btn-primary"
                onClick={handleAdd}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save Column"}
              </button>
              <button
                className="btn btn-outline"
                onClick={() => {
                  setShowAdd(false);
                  setError("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
