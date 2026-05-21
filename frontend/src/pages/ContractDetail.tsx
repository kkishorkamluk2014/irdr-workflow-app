import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

const WORKFLOW_STATUSES = [
  'DRAFT_VALIDATION', 'IMPORT_PLANNING', 'IMPORT_IN_TRANSIT',
  'IMPORT_UNDER_CLEARANCE', 'CLEARANCE_COMPLETED', 'WAREHOUSE_INWARD_PENDING',
  'DELIVERED', 'FUNDED_INVENTORY', 'FUNDING_RELEASED', 'ACTIVE_INVENTORY'
];

export default function ContractDetail() {
  const { id } = useParams();
  const [contract, setContract] = useState<any>(null);
  const [blForm, setBlForm] = useState({ blNumber: '', blQuantity: '', blMaterial: '', blPrice: '' });

  useEffect(() => { loadContract(); }, [id]);

  const loadContract = () => {
    api.get(`/contracts/${id}`).then(res => setContract(res.data)).catch(() => {});
  };

  const handleBLValidation = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post(`/contracts/${id}/validate-bl`, blForm);
    loadContract();
  };

  const handleStatusChange = async (status: string) => {
    await api.patch(`/contracts/${id}/status`, { status });
    loadContract();
  };

  if (!contract) return <p>Loading...</p>;

  const currentIdx = WORKFLOW_STATUSES.indexOf(contract.status);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{contract.importRefNumber}</h1>
          <p style={{ color: 'var(--text-muted)' }}>Contract: {contract.contractId}</p>
        </div>
        <span className={`badge badge-${statusClass(contract.status)}`}>{formatStatus(contract.status)}</span>
      </div>

      {/* Workflow Status Track */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Workflow Progress</h3>
        <div className="status-track">
          {WORKFLOW_STATUSES.map((s, i) => (
            <div key={s} className={`status-step ${i < currentIdx ? 'completed' : i === currentIdx ? 'active' : ''}`}>
              <div className="dot"></div>
              <span style={{ fontSize: '0.7rem' }}>{formatStatus(s)}</span>
              {i < WORKFLOW_STATUSES.length - 1 && <div className="line"></div>}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Contract Details */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Contract Details</h3>
          <table>
            <tbody>
              <tr><td><strong>Material</strong></td><td>{contract.material}</td></tr>
              <tr><td><strong>Supplier</strong></td><td>{contract.supplier}</td></tr>
              <tr><td><strong>Quantity</strong></td><td>{contract.quantity} {contract.unit}</td></tr>
              <tr><td><strong>Price</strong></td><td>{contract.currency} {contract.price}</td></tr>
              <tr><td><strong>Incoterms</strong></td><td>{contract.incoterms}</td></tr>
              <tr><td><strong>Cargo Type</strong></td><td>{contract.cargoType || '—'}</td></tr>
              <tr><td><strong>Loading Port</strong></td><td>{contract.loadingPort || '—'}</td></tr>
              <tr><td><strong>Destination Port</strong></td><td>{contract.destinationPort || '—'}</td></tr>
              <tr><td><strong>BL Number</strong></td><td>{contract.blNumber || '—'}</td></tr>
            </tbody>
          </table>
        </div>

        {/* BL Validation (Phase 1) */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Bill of Lading Validation</h3>
          {contract.blValidated ? (
            <p style={{ color: 'var(--success)' }}>✓ BL validated successfully</p>
          ) : contract.blMismatch ? (
            <p style={{ color: 'var(--danger)' }}>⚠ Mismatch detected — awaiting approval</p>
          ) : (
            <form onSubmit={handleBLValidation}>
              <div className="form-group">
                <label>BL Number</label>
                <input value={blForm.blNumber} onChange={e => setBlForm({ ...blForm, blNumber: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>BL Quantity</label>
                <input type="number" step="0.01" value={blForm.blQuantity} onChange={e => setBlForm({ ...blForm, blQuantity: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>BL Material</label>
                <input value={blForm.blMaterial} onChange={e => setBlForm({ ...blForm, blMaterial: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>BL Price</label>
                <input type="number" step="0.01" value={blForm.blPrice} onChange={e => setBlForm({ ...blForm, blPrice: e.target.value })} required />
              </div>
              <button type="submit" className="btn btn-primary">Validate BL</button>
            </form>
          )}
        </div>
      </div>

      {/* Quick status actions */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Update Status</h3>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {WORKFLOW_STATUSES.filter((_, i) => i > currentIdx).map(s => (
            <button key={s} className="btn btn-outline" onClick={() => handleStatusChange(s)}>
              → {formatStatus(s)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatStatus(s: string) { return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
function statusClass(s: string) {
  const map: Record<string, string> = { DRAFT_VALIDATION: 'draft', IMPORT_PLANNING: 'planning', IMPORT_IN_TRANSIT: 'transit', IMPORT_UNDER_CLEARANCE: 'clearance', CLEARANCE_COMPLETED: 'completed', WAREHOUSE_INWARD_PENDING: 'pending', DELIVERED: 'delivered', FUNDED_INVENTORY: 'funded', FUNDING_RELEASED: 'released', ACTIVE_INVENTORY: 'active' };
  return map[s] || 'draft';
}
