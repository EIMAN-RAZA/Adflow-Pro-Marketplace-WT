import { useState, useEffect } from 'react';
import api from '../services/api';
import Badge from '../components/Badge';

const EMPTY_GIG = {
  title: '', category_id: '', description: '',
  packages: [{ name: 'basic', price: '', delivery_days: '', revisions: 1, features: [] }],
  tags: '', thumbnail_url: ''
};

export default function ProviderDashboard() {
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [gigForm, setGigForm] = useState(EMPTY_GIG);
  const [gigMsg, setGigMsg] = useState('');
  const [editGig, setEditGig] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/provider/dashboard'),
      api.get('/categories')
    ]).then(([r1, r2]) => {
      setData(r1.data);
      setCategories(r2.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const submitGig = async () => {
    if (!gigForm.category_id) {
      setGigMsg('Category is required');
      return;
    }
    
    try {
      const payload = {
        ...gigForm,
        tags: gigForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        packages: gigForm.packages.map(p => ({ ...p, price: Number(p.price), delivery_days: Number(p.delivery_days) }))
      };
      if (editGig) {
        await api.patch(`/provider/gigs/${editGig._id}`, payload);
        setGigMsg('Gig updated');
      } else {
        await api.post('/provider/gigs', payload);
        setGigMsg('Gig created as draft');
      }
      setGigForm(EMPTY_GIG);
      setEditGig(null);
      setTab('gigs');
      load();
    } catch (err) {
      setGigMsg(err.response?.data?.message || 'Failed');
    }
  };

  const submitForReview = async (id) => {
    try {
      await api.patch(`/provider/gigs/${id}/submit`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const startOrder = async (id) => {
    try {
      await api.patch(`/provider/orders/${id}/start`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const deliverOrder = async (id) => {
    try {
      await api.patch(`/provider/orders/${id}/deliver`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const startEditGig = (gig) => {
    setEditGig(gig);
    setGigForm({
      ...gig,
      tags: gig.tags?.join(', ') || '',
      category_id: gig.category_id?._id || gig.category_id
    });
    setTab('create');
  };

  if (loading) return <div className="page"><div className="spinner" /></div>;
  const { gigs, orders, stats } = data;

  return (
    <div className="page">
      <div className="dashboard-layout">
        <div className="sidebar">
          <div className="sidebar-label">Provider Panel</div>
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'gigs', label: 'My Gigs' },
            { key: 'orders', label: 'Orders' },
            { key: 'create', label: 'Create Gig' }
          ].map(item => (
            <div className="sidebar-section" key={item.key}>
              <div className={`sidebar-item ${tab === item.key ? 'active' : ''}`} onClick={() => setTab(item.key)}>
                {item.label}
              </div>
            </div>
          ))}
        </div>

        <div className="dashboard-content">
          <h1 style={{ fontSize: 24, marginBottom: 24 }}>Provider Dashboard</h1>

          {/* Overview */}
          {tab === 'overview' && (
            <>
              <div className="grid grid-4" style={{ marginBottom: 32 }}>
                {[
                  { label: 'Total Gigs', value: stats.total_gigs },
                  { label: 'Active Gigs', value: stats.active_gigs },
                  { label: 'Total Orders', value: stats.total_orders },
                  { label: 'Earnings', value: `$${stats.earnings}` }
                ].map(s => (
                  <div key={s.label} className="stat-card">
                    <div className="stat-card-label">{s.label}</div>
                    <div className="stat-card-value">{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="card">
                <div className="section-header">
                  <h2 className="section-title">Recent Orders</h2>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Client</th><th>Gig</th><th>Amount</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 5).map(o => (
                        <tr key={o._id}>
                          <td>{o.client_id?.name}</td>
                          <td>{o.gig_id?.title}</td>
                          <td>${o.amount}</td>
                          <td><Badge status={o.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Gigs */}
          {tab === 'gigs' && (
            <div className="card">
              <div className="section-header">
                <h2 className="section-title">My Gigs</h2>
                <button className="btn btn-primary btn-sm" onClick={() => { setEditGig(null); setGigForm(EMPTY_GIG); setTab('create'); }}>
                  + New Gig
                </button>
              </div>
              {gigs.length === 0 ? (
                <div className="empty-state">
                  <h3>No gigs yet</h3>
                  <p>Create your first service listing</p>
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Title</th><th>Category</th><th>Status</th><th>Rating</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {gigs.map(g => (
                        <tr key={g._id}>
                          <td style={{ color: 'var(--text)', fontWeight: 500, maxWidth: 200 }}>{g.title}</td>
                          <td>{g.category_id?.name || '-'}</td>
                          <td><Badge status={g.status} /></td>
                          <td>{g.rating_avg > 0 ? `${g.rating_avg} (${g.rating_count})` : '-'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              {['draft', 'rejected'].includes(g.status) && (
                                <>
                                  <button className="btn btn-sm btn-ghost" onClick={() => startEditGig(g)}>Edit</button>
                                  <button className="btn btn-sm btn-primary" onClick={() => submitForReview(g._id)}>Submit</button>
                                </>
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
          )}

          {/* Orders */}
          {tab === 'orders' && (
            <div className="card">
              <h2 className="section-title" style={{ marginBottom: 20 }}>Orders</h2>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Client</th><th>Gig</th><th>Amount</th><th>Status</th><th>Deadline</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o._id}>
                        <td>{o.client_id?.name}</td>
                        <td style={{ maxWidth: 180 }}>{o.gig_id?.title}</td>
                        <td>${o.amount}</td>
                        <td><Badge status={o.status} /></td>
                        <td className="text-sm">{o.deadline ? new Date(o.deadline).toLocaleDateString() : '-'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {o.status === 'payment_verified' && (
                              <button className="btn btn-sm btn-primary" onClick={() => startOrder(o._id)}>Start</button>
                            )}
                            {o.status === 'in_progress' && (
                              <button className="btn btn-sm btn-success" onClick={() => deliverOrder(o._id)}>Deliver</button>
                            )}
                            {o.status === 'revision_requested' && (
                              <button className="btn btn-sm btn-primary" onClick={() => deliverOrder(o._id)}>Re-deliver</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Create/Edit Gig */}
          {tab === 'create' && (
            <div className="card" style={{ maxWidth: 700 }}>
              <h2 style={{ marginBottom: 24 }}>{editGig ? 'Edit Gig' : 'Create New Gig'}</h2>
              {gigMsg && <div className="alert alert-info" onClick={() => setGigMsg('')}>{gigMsg}</div>}

              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  value={gigForm.title}
                  onChange={e => setGigForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. I will design a professional logo"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  value={gigForm.category_id}
                  onChange={e => setGigForm(f => ({ ...f, category_id: e.target.value }))}
                >
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  rows={5}
                  value={gigForm.description}
                  onChange={e => setGigForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe your service in detail..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Thumbnail URL</label>
                <input
                  value={gigForm.thumbnail_url}
                  onChange={e => setGigForm(f => ({ ...f, thumbnail_url: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tags (comma separated)</label>
                <input
                  value={gigForm.tags}
                  onChange={e => setGigForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="logo, design, branding"
                />
              </div>

              <h3 style={{ fontSize: 16, marginBottom: 12 }}>Packages</h3>
              {gigForm.packages.map((pkg, i) => (
                <div key={pkg.name} className="card" style={{ marginBottom: 12, background: 'var(--bg-2)' }}>
                  <div style={{ fontWeight: 600, textTransform: 'capitalize', marginBottom: 12, color: 'var(--accent-2)' }}>
                    {pkg.name}
                  </div>
                  <div className="grid grid-3" style={{ gap: 12 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Price ($)</label>
                      <input
                        type="number"
                        value={pkg.price}
                        onChange={e => {
                          const pkgs = [...gigForm.packages];
                          pkgs[i].price = e.target.value;
                          setGigForm(f => ({ ...f, packages: pkgs }));
                        }}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Delivery (days)</label>
                      <input
                        type="number"
                        value={pkg.delivery_days}
                        onChange={e => {
                          const pkgs = [...gigForm.packages];
                          pkgs[i].delivery_days = e.target.value;
                          setGigForm(f => ({ ...f, packages: pkgs }));
                        }}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Revisions</label>
                      <input
                        type="number"
                        value={pkg.revisions}
                        onChange={e => {
                          const pkgs = [...gigForm.packages];
                          pkgs[i].revisions = e.target.value;
                          setGigForm(f => ({ ...f, packages: pkgs }));
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {gigForm.packages.length < 3 && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ marginBottom: 20 }}
                  onClick={() => {
                    const names = ['basic', 'standard', 'premium'];
                    const next = names[gigForm.packages.length];
                    setGigForm(f => ({
                      ...f,
                      packages: [...f.packages, { name: next, price: '', delivery_days: '', revisions: 1, features: [] }]
                    }));
                  }}
                >
                  + Add Package
                </button>
              )}

              <button className="btn btn-primary" style={{ width: '100%' }} onClick={submitGig}>
                {editGig ? 'Update Gig' : 'Save as Draft'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}