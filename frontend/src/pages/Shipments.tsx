import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Shipments() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { api.get('/shipments').then(r => setShipments(r.data)).catch(() => {}); }, []);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget).entries());
    await api.post('/shipments', form);
    setShowModal(false);
    api.get('/shipments').then(r => setShipments(r.data));
  };

  return (
    <div>
      <div className="page-header">
        <h1>Shipments</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Shipment</button>
      </div>

      <div className="card table-container">
        <table>
          <thead><tr><th>BL Number</th><th>Vessel</th><th>Loading Port</th><th>Destination</th><th>Cargo</th><th>Status</th><th>Departure</th></tr></thead>
          <tbody>
            {shipments.map(s => (
              <tr key={s.id}>
                <td><strong>{s.blNumber}</strong></td>
                <td>{s.vesselName || '—'}</td>
                <td>{s.loadingPort}</td>
                <td>{s.destinationPort}</td>
                <td>{s.cargoType}</td>
                <td><span className={`badge badge-${s.status === 'IMPORT_IN_TRANSIT' ? 'transit' : 'clearance'}`}>{s.status.replace(/_/g, ' ')}</span></td>
                <td>{s.departureDate ? new Date(s.departureDate).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Create Shipment</h2>
            <form onSubmit={handleCreate}>
              <div className="form-grid">
                <div className="form-group"><label>Contract ID *</label><input name="contractId" required /></div>
                <div className="form-group"><label>BL Number *</label><input name="blNumber" required /></div>
                <div className="form-group"><label>Vessel Name</label><input name="vesselName" /></div>
                <div className="form-group">
                  <label>Cargo Type *</label>
                  <select name="cargoType" required><option value="CONTAINER">Container</option><option value="BULK">Bulk</option><option value="BREAK_BULK">Break Bulk</option><option value="LIQUID_BULK">Liquid Bulk</option></select>
                </div>
                <div className="form-group"><label>Loading Port *</label><input name="loadingPort" required /></div>
                <div className="form-group"><label>Destination Port *</label><input name="destinationPort" required /></div>
                <div className="form-group"><label>Departure Date</label><input name="departureDate" type="date" /></div>
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
