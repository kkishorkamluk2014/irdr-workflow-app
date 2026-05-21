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

export default function Expenses() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const [customFieldDefs, setCustomFieldDefs] = useState<FieldDef[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  const loadFieldDefs = () => {
    api
      .get("/field-definitions?entityType=EXPENSE")
      .then((r) => setCustomFieldDefs(r.data))
      .catch(() => {});
  };

  useEffect(() => {
    api
      .get("/expenses")
      .then((r) => {
        setExpenses(r.data);
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

  const getCustom = (exp: any, key: string) => {
    try {
      const cf = JSON.parse(exp.customFields || "{}");
      return cf[key] ?? "—";
    } catch {
      return "—";
    }
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget).entries());
    const standardKeys = [
      "contractId",
      "blNumber",
      "batchNumber",
      "category",
      "expenseType",
      "description",
      "amount",
      "currency",
      "vendor",
      "invoiceNumber",
      "cargoType",
    ];
    const payload: any = {};
    const custom: Record<string, string> = {};
    for (const [k, v] of Object.entries(form)) {
      if (standardKeys.includes(k)) payload[k] = v;
      else custom[k] = String(v);
    }
    Object.assign(custom, customValues);
    payload.customFields = custom;
    await api.post("/expenses", payload);
    setShowModal(false);
    setCustomValues({});
    api.get("/expenses").then((r) => setExpenses(r.data));
  };

  return (
    <div>
      <div className="page-header">
        <h1>Expenses & Charges</h1>
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
            + Add Expense
          </button>
        </div>
      </div>

      <div className="card table-container">
        <table>
          <thead>
            <tr>
              <th>Import Ref</th>
              <th>BL #</th>
              <th>Batch</th>
              <th>Category</th>
              <th>Type</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Vendor</th>
              <th>Date</th>
              {customFieldDefs.map((f) => (
                <th key={f.id}>{f.fieldLabel}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {expenses.map((exp) => (
              <tr
                key={exp.id}
                ref={(el) => {
                  rowRefs.current[exp.id] = el;
                }}
                className={highlightId === exp.id ? "row-highlighted" : ""}
              >
                <td>{exp.contract?.importRefNumber || "—"}</td>
                <td>{exp.blNumber || "—"}</td>
                <td>{exp.batchNumber || "—"}</td>
                <td>{exp.category.replace(/_/g, " ")}</td>
                <td>{exp.expenseType.replace(/_/g, " ")}</td>
                <td>{exp.description}</td>
                <td>
                  {exp.currency} {exp.amount.toLocaleString()}
                </td>
                <td>{exp.vendor || "—"}</td>
                <td>{new Date(exp.createdAt).toLocaleDateString()}</td>
                {customFieldDefs.map((f) => (
                  <td key={f.id}>{getCustom(exp, f.fieldName)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add Expense</h2>
            <form onSubmit={handleCreate}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Contract ID *</label>
                  <input name="contractId" required />
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
                  <label>Category *</label>
                  <select name="category" required>
                    <option value="SERVICE_CHARGE">Service Charge</option>
                    <option value="GOVERNMENT_CHARGE">Government Charge</option>
                    <option value="SHIPPING_LINE_CHARGE">
                      Shipping Line Charge
                    </option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Expense Type *</label>
                  <select name="expenseType" required>
                    <option value="CLEARING_FORWARDING">
                      Clearing & Forwarding
                    </option>
                    <option value="CUSTOMS_DUTY">Customs Duty</option>
                    <option value="TRANSPORTATION">Transportation</option>
                    <option value="LOADING">Loading</option>
                    <option value="UNLOADING">Unloading</option>
                    <option value="LABOUR">Labour</option>
                    <option value="STORAGE">Storage</option>
                    <option value="INTEREST">Interest</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Description *</label>
                  <input name="description" required />
                </div>
                <div className="form-group">
                  <label>Amount *</label>
                  <input name="amount" type="number" step="0.01" required />
                </div>
                <div className="form-group">
                  <label>Currency</label>
                  <select name="currency">
                    <option>INR</option>
                    <option>USD</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Vendor</label>
                  <input name="vendor" />
                </div>
                <div className="form-group">
                  <label>Invoice Number</label>
                  <input name="invoiceNumber" />
                </div>
                <div className="form-group">
                  <label>Cargo Type</label>
                  <select name="cargoType">
                    <option value="">N/A</option>
                    <option value="CONTAINER">Container</option>
                    <option value="BULK">Bulk</option>
                    <option value="BREAK_BULK">Break Bulk</option>
                    <option value="LIQUID_BULK">Liquid Bulk</option>
                  </select>
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
          entityType="EXPENSE"
          onClose={() => setShowManager(false)}
          onSaved={() => {
            loadFieldDefs();
            api.get("/expenses").then((r) => setExpenses(r.data));
          }}
        />
      )}
    </div>
  );
}
