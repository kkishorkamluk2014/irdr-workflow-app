import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Approvals() {
  const [approvals, setApprovals] = useState<any[]>([]);

  useEffect(() => { api.get('/approvals').then(r => setApprovals(r.data)).catch(() => {}); }, []);

  const handleAction = async (id: string, status: string) => {
    const remarks = status === 'REJECTED' ? prompt('Rejection reason:') : '';
    await api.patch(`/approvals/${id}`, { status, remarks });
    api.get('/approvals').then(r => setApprovals(r.data));
  };

  return (
    <div>
      <div className="page-header">
        <h1>Pending Approvals</h1>
      </div>

      <div className="card table-container">
        <table>
          <thead><tr><th>Import Ref</th><th>Material</th><th>Supplier</th><th>Reason</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>
            {approvals.map(a => (
              <tr key={a.id}>
                <td><strong>{a.contract.importRefNumber}</strong></td>
                <td>{a.contract.material}</td>
                <td>{a.contract.supplier}</td>
                <td>{a.reason}</td>
                <td>{new Date(a.createdAt).toLocaleString()}</td>
                <td>
                  <button className="btn btn-success" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', marginRight: '0.5rem' }}
                    onClick={() => handleAction(a.id, 'APPROVED')}>Approve</button>
                  <button className="btn btn-danger" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                    onClick={() => handleAction(a.id, 'REJECTED')}>Reject</button>
                </td>
              </tr>
            ))}
            {approvals.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No pending approvals</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
