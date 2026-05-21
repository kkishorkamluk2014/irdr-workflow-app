import { useEffect, useState } from 'react';
import api from '../services/api';

export default function FundedInventory() {
  const [data, setData] = useState<any>(null);

  useEffect(() => { api.get('/dashboard/funded-inventory').then(r => setData(r.data)).catch(() => {}); }, []);

  if (!data) return <p>Loading...</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Funded Inventory</h1>
        <span className="badge badge-funded">{data.summary.totalItems} items under funding</span>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">₹{data.summary.totalFundingAmount.toLocaleString()}</div>
          <div className="stat-label">Total Funding Amount</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--warning)' }}>₹{data.summary.totalInterest.toLocaleString()}</div>
          <div className="stat-label">Total Interest Accrued</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">₹{data.summary.totalStorage.toLocaleString()}</div>
          <div className="stat-label">Total Storage Cost</div>
        </div>
      </div>

      <div className="card table-container">
        <table>
          <thead><tr><th>Material</th><th>Import Ref</th><th>Qty</th><th>Agency</th><th>Funding Amt</th><th>Interest</th><th>Storage</th><th>Start Date</th><th>Actions</th></tr></thead>
          <tbody>
            {data.items.map((i: any) => (
              <tr key={i.id}>
                <td><strong>{i.material}</strong></td>
                <td>{i.contract?.importRefNumber || '—'}</td>
                <td>{i.quantity} {i.unit}</td>
                <td>{i.fundingAgency}</td>
                <td>₹{i.fundingAmount?.toLocaleString()}</td>
                <td>₹{i.interestAccrued.toLocaleString()}</td>
                <td>₹{i.storageCost.toLocaleString()}</td>
                <td>{i.fundingStartDate ? new Date(i.fundingStartDate).toLocaleDateString() : '—'}</td>
                <td>
                  <button className="btn btn-success" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                    onClick={async () => { await api.post(`/inventory/${i.id}/release-funding`); window.location.reload(); }}>
                    Release
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3>Notes</h3>
        <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <li>Funded inventory is blocked from sale, transfer, and consumption</li>
          <li>Ownership changes only after payment to funding agency</li>
          <li>Released inventory moves from Dead Inventory to Active Inventory</li>
          <li>Full audit trail is maintained for release and ownership changes</li>
        </ul>
      </div>
    </div>
  );
}
