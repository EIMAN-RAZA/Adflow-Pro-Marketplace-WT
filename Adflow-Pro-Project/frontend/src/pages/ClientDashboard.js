import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Badge from '../components/Badge';

export default function ClientDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('orders');
  const [payModal, setPayModal] = useState(null);
  const [payForm, setPayForm] = useState({ method: '', transaction_ref: '', sender_name: '', screenshot_url: '' });
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    api.get('/client/dashboard').then(r => setData(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const submitPayment = async () => {
    try {
      await api.post('/client/payments', { order_id: payModal._id, ...payForm });
      setPayModal(null);
      setMsg('Payment submitted successfully');
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed');
    }
  };

  const completeOrder = async (id) => {
    await api.patch(`/client/orders/${id}/complete`);
    load();
  };

  const requestRevision = async (id) => {
    await api.patch(`/client/orders/${id}/revision`);
    load();
  };

  const submitReview = async () => {
    try {
      await api.post('/client/reviews', { order_id: reviewModal._id, ...reviewForm });
      setReviewModal(null);
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed');
    }
  };

  if (loading) return <div className="page"><div className="spinner" /></div>;

  const { orders, stats } = data;

  return (
    <div className="page">
      <div className="dashboard-layout">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-label">Client Panel</div>
          {[
            { key: 'orders', label: 'My Orders' },
            { key: 'explore', label: 'Find Services', action: () => navigate('/explore') }
          ].map(item => (
            <div className="sidebar-section" key={item.key}>
              <div
                className={`sidebar-item ${tab === item.key ? 'active' : ''}`}
                onClick={item.action || (() => setTab(item.key))}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="dashboard-content">
          <h1 style={{ fontSize: 24, marginBottom: 24 }}>Client Dashboard</h1>

          {msg && <div className="alert alert-success" onClick={() => setMsg('')}>{msg}</div>}

          {/* Stats */}
          <div className="grid grid-4" style={{ marginBottom: 32 }}>
            {[
              { label: 'Total Orders', value: stats.total_orders },
              { label: 'Active', value: stats.active },
              { label: 'Completed', value: stats.completed },
              { label: 'Total Spent', value: `$${stats.total_spent}` }
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-card-label">{s.label}</div>
                <div className="stat-card-value">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Orders Table */}
          <div className="card">
            <div className="section-header">
              <h2 className="section-title">Orders</h2>
            </div>
            {orders.length === 0 ? (
              <div className="empty-state">
                <h3>No orders yet</h3>
                <p>Browse services and place your first order</p>
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/explore')}>
                  Explore Services
                </button>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Provider</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o._id}>
                        <td style={{ color: 'var(--text)', fontWeight: 500 }}>
                          {o.gig_id?.title || 'N/A'}
                        </td>
                        <td>{o.provider_id?.name}</td>
                        <td>${o.amount}</td>
                        <td><Badge status={o.status} /></td>
                        <td className="text-sm">{new Date(o.order_date).toLocaleDateString()}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {o.status === 'placed' && (
                              <button className="btn btn-sm btn-primary" onClick={() => setPayModal(o)}>
                                Pay
                              </button>
                            )}
                            {o.status === 'delivered' && (
                              <>
                                <button className="btn btn-sm btn-success" onClick={() => completeOrder(o._id)}>
                                  Accept
                                </button>
                                <button className="btn btn-sm btn-warning" onClick={() => requestRevision(o._id)}>
                                  Revision
                                </button>
                              </>
                            )}
                            {o.status === 'completed' && (
                              <button className="btn btn-sm btn-outline" onClick={() => setReviewModal(o)}>
                                Review
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {payModal && (
        <div className="modal-overlay" onClick={() => setPayModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Submit Payment</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setPayModal(null)}>X</button>
            </div>
            <p className="text-muted text-sm" style={{ marginBottom: 16 }}>
              Amount due: <strong style={{ color: 'var(--text)' }}>${payModal.amount}</strong>
            </p>
            {['method', 'transaction_ref', 'sender_name', 'screenshot_url'].map(field => (
              <div className="form-group" key={field}>
                <label className="form-label">{field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</label>
                <input
                  value={payForm[field]}
                  onChange={e => setPayForm(f => ({ ...f, [field]: e.target.value }))}
                  placeholder={field === 'screenshot_url' ? 'URL to payment screenshot' : ''}
                />
              </div>
            ))}
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={submitPayment}>
              Submit Payment
            </button>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="modal-overlay" onClick={() => setReviewModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Leave a Review</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setReviewModal(null)}>X</button>
            </div>
            <div className="form-group">
              <label className="form-label">Rating</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    className={`btn btn-sm ${reviewForm.rating >= n ? 'btn-warning' : 'btn-ghost'}`}
                    onClick={() => setReviewForm(f => ({ ...f, rating: n }))}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Comment</label>
              <textarea
                rows={4}
                value={reviewForm.comment}
                onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                placeholder="Share your experience..."
              />
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={submitReview}>
              Submit Review
            </button>
          </div>
        </div>
      )}
    </div>
  );
}