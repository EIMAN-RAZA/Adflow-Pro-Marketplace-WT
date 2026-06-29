import { useState, useEffect } from 'react';
import api from '../services/api';
import Badge from '../components/Badge';

export default function AdminDashboard() {
  const [tab, setTab] = useState('analytics');
  const [analytics, setAnalytics] = useState(null);
  const [payments, setPayments] = useState([]);
  const [gigs, setGigs] = useState([]);
  const [users, setUsers] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [catForm, setCatForm] = useState({ name: '', icon: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/admin/analytics').then(r => setAnalytics(r.data)).catch(() => {});
    api.get('/categories').then(r => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === 'payments') api.get('/admin/payment-queue').then(r => setPayments(r.data));
    if (tab === 'gigs') api.get('/admin/gig-activation-queue').then(r => setGigs(r.data));
    if (tab === 'users') api.get('/admin/users').then(r => setUsers(r.data));
    if (tab === 'disputes') api.get('/admin/disputes').then(r => setDisputes(r.data));
  }, [tab]);

  const verifyPayment = async (id, action) => {
    await api.patch(`/admin/payments/${id}/verify`, { action });
    api.get('/admin/payment-queue').then(r => setPayments(r.data));
  };

  const activateGig = async (id) => {
    await api.patch(`/admin/gigs/${id}/activate`);
    api.get('/admin/gig-activation-queue').then(r => setGigs(r.data));
  };

  const resolveDispute = async (id) => {
    const note = prompt('Resolution note:');
    if (note !== null) {
      await api.patch(`/admin/disputes/${id}/resolve`, { resolution_note: note });
      api.get('/admin/disputes').then(r => setDisputes(r.data));
    }
  };

  const addCategory = async () => {
    try {
      await api.post('/categories', catForm);
      setCatForm({ name: '', icon: '' });
      api.get('/categories').then(r => setCategories(r.data));
      setMsg('Category added');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed');
    }
  };

  const toggleCat = async (id) => {
    await api.patch(`/categories/${id}/toggle`);
    api.get('/categories').then(r => setCategories(r.data));
  };

  const tabs = [
    { key: 'analytics', label: 'Analytics' },
    { key: 'payments', label: 'Payment Queue' },
    { key: 'gigs', label: 'Gig Activation' },
    { key: 'users', label: 'Users' },
    { key: 'disputes', label: 'Disputes' },
    { key: 'categories', label: 'Categories' }
  ];

  return (
    <div className="page">
      <div className="dashboard-layout">
        <div className="sidebar">
          <div className="sidebar-label">Admin Panel</div>
          {tabs.map(t => (
            <div className="sidebar-section" key={t.key}>
              <div className={`sidebar-item ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
                {t.label}
              </div>
            </div>
          ))}
        </div>

        <div className="dashboard-content">
          <h1 style={{ fontSize: 24, marginBottom: 24 }}>Admin Dashboard</h1>
          {msg && <div className="alert alert-success" onClick={() => setMsg('')}>{msg}</div>}

          {/* Analytics */}
          {tab === 'analytics' && analytics && (
            <>
              <div className="grid grid-4" style={{ marginBottom: 32 }}>
                {[
                  { label: 'Total Users', value: analytics.users },
                  { label: 'Active Gigs', value: analytics.active_gigs },
                  { label: 'Total Orders', value: analytics.orders },
                  { label: 'Revenue', value: `$${analytics.revenue}` }
                ].map(s => (
                  <div key={s.label} className="stat-card">
                    <div className="stat-card-label">{s.label}</div>
                    <div className="stat-card-value">{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="card">
                <h3 style={{ marginBottom: 16 }}>Orders by Status</h3>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Status</th><th>Count</th></tr></thead>
                    <tbody>
                      {analytics.ordersByStatus?.map(s => (
                        <tr key={s._id}>
                          <td><Badge status={s._id} /></td>
                          <td style={{ fontWeight: 600 }}>{s.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Payments */}
          {tab === 'payments' && (
            <div className="card">
              <h2 className="section-title" style={{ marginBottom: 20 }}>Payment Verification Queue</h2>
              {payments.length === 0 ? (
                <div className="empty-state"><h3>No pending payments</h3></div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Client</th><th>Amount</th><th>Method</th><th>Ref</th><th>Sender</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {payments.map(p => (
                        <tr key={p._id}>
                          <td>{p.client_id?.name}</td>
                          <td>${p.amount}</td>
                          <td>{p.method}</td>
                          <td className="text-sm">{p.transaction_ref}</td>
                          <td>{p.sender_name}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="btn btn-sm btn-success" onClick={() => verifyPayment(p._id, 'verify')}>
                                Verify
                              </button>
                              <button className="btn btn-sm btn-danger" onClick={() => verifyPayment(p._id, 'reject')}>
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Gig Activation */}
          {tab === 'gigs' && (
            <div className="card">
              <h2 className="section-title" style={{ marginBottom: 20 }}>Gig Activation Queue</h2>
              <p className="text-muted text-sm" style={{ marginBottom: 16 }}>
                These gigs have been approved by moderators and are waiting for final activation.
              </p>
              {gigs.length === 0 ? (
                <div className="empty-state"><h3>No gigs waiting activation</h3></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {gigs.map(g => (
                    <div key={g._id} className="card" style={{ background: 'var(--bg-2)' }}>
                      <div className="flex-between">
                        <div>
                          <h3 style={{ fontSize: 15, marginBottom: 4 }}>{g.title}</h3>
                          <div className="text-sm text-muted">
                            by {g.provider_id?.name} &bull; {g.category_id?.name}
                          </div>
                          {g.moderator_note && (
                            <div className="text-sm" style={{ color: 'var(--info)', marginTop: 4 }}>
                              Note: {g.moderator_note}
                            </div>
                          )}
                        </div>
                        <button className="btn btn-success btn-sm" onClick={() => activateGig(g._id)}>
                          Activate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Users */}
          {tab === 'users' && (
            <div className="card">
              <h2 className="section-title" style={{ marginBottom: 20 }}>User Management</h2>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th></tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id}>
                        <td style={{ fontWeight: 500 }}>{u.name}</td>
                        <td className="text-sm">{u.email}</td>
                        <td><Badge status={u.role} /></td>
                        <td><Badge status={u.status} /></td>
                        <td className="text-sm">{new Date(u.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Disputes */}
          {tab === 'disputes' && (
            <div className="card">
              <h2 className="section-title" style={{ marginBottom: 20 }}>Dispute Resolution</h2>
              {disputes.length === 0 ? (
                <div className="empty-state"><h3>No disputes</h3></div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Opened By</th><th>Reason</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {disputes.map(d => (
                        <tr key={d._id}>
                          <td>{d.opened_by?.name}</td>
                          <td style={{ maxWidth: 260 }}>{d.reason}</td>
                          <td><Badge status={d.status} /></td>
                          <td>
                            {d.status === 'open' && (
                              <button className="btn btn-sm btn-primary" onClick={() => resolveDispute(d._id)}>
                                Resolve
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Categories */}
          {tab === 'categories' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div className="card">
                <h3 style={{ marginBottom: 16 }}>Add Category</h3>
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input
                    value={catForm.name}
                    onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Web Development"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Icon (emoji or text)</label>
                  <input
                    value={catForm.icon}
                    onChange={e => setCatForm(f => ({ ...f, icon: e.target.value }))}
                    placeholder="e.g. Design"
                  />
                </div>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={addCategory}>
                  Add Category
                </button>
              </div>

              <div className="card">
                <h3 style={{ marginBottom: 16 }}>All Categories</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {categories.map(c => (
                    <div key={c._id} className="flex-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <span>{c.name}</span>
                      <button
                        className={`btn btn-sm ${c.is_active ? 'btn-ghost' : 'btn-primary'}`}
                        onClick={() => toggleCat(c._id)}
                      >
                        {c.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}