import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface Contract {
  id: string;
  importRefNumber: string;
  contractId: string;
  status: string;
  material: string;
  supplier: string;
  quantity: number;
  price: number;
  currency: string;
  incoterms: string;
  blNumber: string | null;
  createdAt: string;
}

export default function Contracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { loadContracts(); }, []);

  const loadContracts = () => {
    api.get('/contracts').then(res => setContracts(res.data.contracts)).catch(() => {});
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = Object.fromEntries(form.entries());
    await api.post('/contracts', body);
    setShowModal(false);
    loadContracts();
  };

  return (
    <div>
      <div className="page-header">
        <h1>Import Contracts</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Contract</button>
      </div>

      <div className="card table-container">
        <table>
          <thead>
            <tr>
              <th>Ref Number</th>
              <th>Contract ID</th>
              <th>Material</th>
              <th>Supplier</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Incoterms</th>
              <th>BL #</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map(c => (
              <tr key={c.id} onClick={() => navigate(`/contracts/${c.id}`)} style={{ cursor: 'pointer' }}>
                <td><strong>{c.importRefNumber}</strong></td>
                <td>{c.contractId}</td>
                <td>{c.material}</td>
                <td>{c.supplier}</td>
                <td>{c.quantity}</td>
                <td>{c.currency} {c.price}</td>
                <td>{c.incoterms}</td>
                <td>{c.blNumber || '—'}</td>
                <td><span className={`badge badge-${statusClass(c.status)}`}>{formatStatus(c.status)}</span></td>
                <td>{new Date(c.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Upload Import Contract</h2>
            <form onSubmit={handleCreate}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Material *</label>
                  <input name="material" required />
                </div>
                <div className="form-group">
                  <label>Supplier *</label>
                  <input name="supplier" required />
                </div>
                <div className="form-group">
                  <label>Quantity *</label>
                  <input name="quantity" type="number" step="0.01" required />
                </div>
                <div className="form-group">
                  <label>Unit</label>
                  <select name="unit"><option>MT</option><option>KG</option><option>Tons</option></select>
                </div>
                <div className="form-group">
                  <label>Price *</label>
                  <input name="price" type="number" step="0.01" required />
                </div>
                <div className="form-group">
                  <label>Currency</label>
                  <select name="currency"><option>USD</option><option>INR</option><option>EUR</option></select>
                </div>
                <div className="form-group">
                  <label>Incoterms *</label>
                  <select name="incoterms" required>
                    <option value="">Select</option>
                    <option>FOB</option><option>CIF</option><option>CFR</option><option>EXW</option>
                    <option>DDP</option><option>DAP</option><option>FCA</option><option>CPT</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Cargo Type</label>
                  <select name="cargoType">
                    <option value="">Select</option>
                    <option value="CONTAINER">Container</option><option value="BULK">Bulk</option>
                    <option value="BREAK_BULK">Break Bulk</option><option value="LIQUID_BULK">Liquid Bulk</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Loading Port</label>
                  <input name="loadingPort" />
                </div>
                <div className="form-group">
                  <label>Destination Port</label>
                  <input name="destinationPort" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary">Create Contract</button>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function formatStatus(s: string) { return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
function statusClass(s: string): string {
  const map: Record<string, string> = { DRAFT_VALIDATION: 'draft', IMPORT_PLANNING: 'planning', IMPORT_IN_TRANSIT: 'transit', IMPORT_UNDER_CLEARANCE: 'clearance', CLEARANCE_COMPLETED: 'completed', WAREHOUSE_INWARD_PENDING: 'pending', DELIVERED: 'delivered', FUNDED_INVENTORY: 'funded', FUNDING_RELEASED: 'released', ACTIVE_INVENTORY: 'active' };
  return map[s] || 'draft';
}
