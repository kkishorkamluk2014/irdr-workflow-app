import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Expenses() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { api.get('/expenses').then(r => setExpenses(r.data)).catch(() => {}); }, []);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget).entries());
    await api.post('/expenses', form);
    setShowModal(false);
    api.get('/expenses').then(r => setExpenses(r.data));
  };

  return (
    <div>
      <div className="page-header">
        <h1>Expenses & Charges</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Expense</button>
      </div>

      <div className="card table-container">
        <table>
          <thead><tr><th>Import Ref</th><th>BL #</th><th>Batch</th><th>Category</th><th>Type</th><th>Description</th><th>Amount</th><th>Vendor</th><th>Date</th></tr></thead>
          <tbody>
            {expenses.map(e => (
              <tr key={e.id}>
                <td>{e.contract?.importRefNumber || '—'}</td>
                <td>{e.blNumber || '—'}</td>
                <td>{e.batchNumber || '—'}</td>
                <td>{e.category.replace(/_/g, ' ')}</td>
                <td>{e.expenseType.replace(/_/g, ' ')}</td>
                <td>{e.description}</td>
                <td>{e.currency} {e.amount.toLocaleString()}</td>
                <td>{e.vendor || '—'}</td>
                <td>{new Date(e.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Add Expense</h2>
            <form onSubmit={handleCreate}>
              <div className="form-grid">
                <div className="form-group"><label>Contract ID *</label><input name="contractId" required /></div>
                <div className="form-group"><label>BL Number</label><input name="blNumber" /></div>
                <div className="form-group"><label>Batch Number</label><input name="batchNumber" /></div>
                <div className="form-group">
                  <label>Category *</label>
                  <select name="category" required>
                    <option value="SERVICE_CHARGE">Service Charge</option>
                    <option value="GOVERNMENT_CHARGE">Government Charge</option>
                    <option value="SHIPPING_LINE_CHARGE">Shipping Line Charge</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Expense Type *</label>
                  <select name="expenseType" required>
                    <option value="CLEARING_FORWARDING">Clearing & Forwarding</option>
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
                <div className="form-group"><label>Description *</label><input name="description" required /></div>
                <div className="form-group"><label>Amount *</label><input name="amount" type="number" step="0.01" required /></div>
                <div className="form-group"><label>Currency</label><select name="currency"><option>INR</option><option>USD</option></select></div>
                <div className="form-group"><label>Vendor</label><input name="vendor" /></div>
                <div className="form-group"><label>Invoice Number</label><input name="invoiceNumber" /></div>
                <div className="form-group">
                  <label>Cargo Type</label>
                  <select name="cargoType">
                    <option value="">N/A</option>
                    <option value="CONTAINER">Container</option><option value="BULK">Bulk</option>
                    <option value="BREAK_BULK">Break Bulk</option><option value="LIQUID_BULK">Liquid Bulk</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary">Create</button>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
