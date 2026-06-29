import { useState, useEffect } from 'react';
import api from '../services/api';
import Badge from '../components/Badge';

export default function ModeratorDashboard() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noteModal, setNoteModal] = useState(null);
  const [note, setNote] = useState('');
  const [pendingAction, setPendingAction] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/moderator/gig-review-queue').then(r => setQueue(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const review = async (id, action) => {
    try {
      await api.patch(`/moderator/gigs/${id}/review`, { action, note });
      setNoteModal(null);
      setNote('');
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const openModal = (gig, action) => {
    setNoteModal(gig);
    setPendingAction(action);
    setNote('');
  };

  return (
    <div className="page">
      <div className="dashboard-layout">
        <div className="sidebar">
          <div className="sidebar-label">Moderator</div>
          <div className="sidebar-section">
            <div className="sidebar-item active">Gig Review Queue</div>
          </div>
        </div>

        <div className="dashboard-content">
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>Gig Review Queue</h1>
          <p className="text-muted" style={{ marginBottom: 24 }}>
            Review submitted gigs for quality and compliance before they reach admin activation.
          </p>

          {loading ? <div className="spinner" /> : queue.length === 0 ? (
            <div className="empty-state">
              <h3>Queue is clear</h3>
              <p>No gigs pending review at this time</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {queue.map(gig => (
                <div key={gig._id} className="card">
                  <div className="flex-between" style={{ marginBottom: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 16, marginBottom: 4 }}>{gig.title}</h3>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Badge status={gig.status} />
                        <span className="text-sm text-muted">{gig.category_id?.name}</span>
                        <span className="text-sm text-muted">by {gig.provider_id?.name}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-sm btn-success" onClick={() => openModal(gig, 'approve')}>
                        Approve
                      </button>
                      <button className="btn btn-sm btn-warning" onClick={() => openModal(gig, 'flag')}>
                        Flag
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => openModal(gig, 'reject')}>
                        Reject
                      </button>
                    </div>
                  </div>

                  <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>
                    {gig.description?.slice(0, 300)}{gig.description?.length > 300 ? '...' : ''}
                  </p>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {gig.packages?.map(p => (
                      <span key={p.name} className="tag" style={{ textTransform: 'capitalize' }}>
                        {p.name}: ${p.price} / {p.delivery_days}d
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Note Modal */}
      {noteModal && (
        <div className="modal-overlay" onClick={() => setNoteModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {pendingAction === 'approve' ? 'Approve' : pendingAction === 'reject' ? 'Reject' : 'Flag'} Gig
              </h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setNoteModal(null)}>X</button>
            </div>
            <p className="text-muted text-sm" style={{ marginBottom: 16 }}>
              Gig: <strong style={{ color: 'var(--text)' }}>{noteModal.title}</strong>
            </p>
            <div className="form-group">
              <label className="form-label">Note (optional for approve, required for reject)</label>
              <textarea
                rows={3}
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder={
                  pendingAction === 'reject'
                    ? 'Reason for rejection...'
                    : 'Add a note for the provider...'
                }
              />
            </div>
            <button
              className={`btn ${pendingAction === 'approve' ? 'btn-success' : pendingAction === 'reject' ? 'btn-danger' : 'btn-warning'}`}
              style={{ width: '100%' }}
              onClick={() => review(noteModal._id, pendingAction)}
            >
              Confirm {pendingAction === 'approve' ? 'Approval' : pendingAction === 'reject' ? 'Rejection' : 'Flag'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}