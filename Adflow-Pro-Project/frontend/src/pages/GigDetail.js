import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Badge from '../components/Badge';
import { useAuth } from '../context/AuthContext';

export default function GigDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [ordering, setOrdering] = useState(false);
  const [requirements, setRequirements] = useState('');
  const [showOrder, setShowOrder] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get(`/gigs/${slug}`).then(r => {
      setData(r.data);
      if (r.data.gig.packages?.length) setSelectedPkg(r.data.gig.packages[0]);
    }).catch(() => navigate('/explore')).finally(() => setLoading(false));
  }, [slug, navigate]);

  const placeOrder = async () => {
    if (!user) return navigate('/login');
    if (user.role !== 'client') return setMsg('Only clients can place orders');
    setOrdering(true);
    try {
      const order = await api.post('/client/orders', {
        gig_id: data.gig._id,
        package_name: selectedPkg.name,
        requirements
      });
      navigate('/client/dashboard');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to place order');
    } finally {
      setOrdering(false);
    }
  };

  if (loading) return <div className="page"><div className="spinner" /></div>;
  if (!data) return null;

  const { gig, reviews } = data;

  return (
    <div className="page">
      <div className="container" style={{ padding: '40px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32, alignItems: 'start' }}>
          {/* Left */}
          <div>
            <div className="text-sm text-muted" style={{ marginBottom: 8 }}>
              {gig.category_id?.name}
            </div>
            <h1 style={{ fontSize: 28, marginBottom: 16 }}>{gig.title}</h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div className="avatar avatar-lg">{gig.provider_id?.name?.charAt(0)}</div>
              <div>
                <div style={{ fontWeight: 600 }}>{gig.provider_id?.name}</div>
                {gig.rating_avg > 0 && (
                  <div className="rating">
                    &#9733; {Number(gig.rating_avg).toFixed(1)}
                    <span className="text-muted"> ({gig.rating_count} reviews)</span>
                  </div>
                )}
              </div>
            </div>

            {gig.thumbnail_url && (
              <img
                src={gig.thumbnail_url}
                alt={gig.title}
                style={{ width: '100%', borderRadius: 12, marginBottom: 24, aspectRatio: '16/9', objectFit: 'cover' }}
                onError={e => e.target.style.display = 'none'}
              />
            )}

            <h3 style={{ marginBottom: 12 }}>About This Service</h3>
            <p style={{ color: 'var(--text-2)', lineHeight: 1.8, marginBottom: 24, whiteSpace: 'pre-line' }}>
              {gig.description}
            </p>

            {gig.tags?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 32 }}>
                {gig.tags.map(t => <span key={t} className="tag">{t}</span>)}
              </div>
            )}

            <div className="divider" />

            {/* Reviews */}
            <h3 style={{ marginBottom: 16 }}>Reviews</h3>
            {reviews.length === 0 ? (
              <p className="text-muted text-sm">No reviews yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {reviews.map(r => (
                  <div key={r._id} className="card">
                    <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                      <div className="avatar">{r.client_id?.name?.charAt(0)}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{r.client_id?.name}</div>
                        <div className="rating" style={{ fontSize: 12 }}>
                          {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                        </div>
                      </div>
                    </div>
                    <p style={{ color: 'var(--text-2)', fontSize: 14 }}>{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Order card */}
          <div style={{ position: 'sticky', top: 90 }}>
            <div className="card">
              {/* Package selector */}
              {gig.packages?.length > 0 && (
                <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
                  {gig.packages.map(pkg => (
                    <button
                      key={pkg.name}
                      onClick={() => setSelectedPkg(pkg)}
                      className={`btn btn-sm ${selectedPkg?.name === pkg.name ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ flex: 1, textTransform: 'capitalize' }}
                    >
                      {pkg.name}
                    </button>
                  ))}
                </div>
              )}

              {selectedPkg && (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <div className="price" style={{ fontSize: 28, marginBottom: 4 }}>
                      ${selectedPkg.price}
                    </div>
                    <div className="text-muted text-sm">
                      Delivery: {selectedPkg.delivery_days} day{selectedPkg.delivery_days !== 1 ? 's' : ''}
                      &nbsp;&nbsp;|&nbsp;&nbsp;
                      {selectedPkg.revisions} revision{selectedPkg.revisions !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {selectedPkg.features?.length > 0 && (
                    <ul style={{ marginBottom: 16, paddingLeft: 0, listStyle: 'none' }}>
                      {selectedPkg.features.map(f => (
                        <li key={f} style={{ fontSize: 13, color: 'var(--text-2)', padding: '3px 0', paddingLeft: 16, position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 0, color: 'var(--success)' }}>&#10003;</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}

                  {!showOrder ? (
                    <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowOrder(true)}>
                      Order Now
                    </button>
                  ) : (
                    <>
                      <div className="form-group">
                        <div className="form-label">Requirements (optional)</div>
                        <textarea
                          rows={4}
                          placeholder="Describe your requirements..."
                          value={requirements}
                          onChange={e => setRequirements(e.target.value)}
                        />
                      </div>
                      {msg && <div className="alert alert-error">{msg}</div>}
                      <button
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        onClick={placeOrder}
                        disabled={ordering}
                      >
                        {ordering ? 'Placing Order...' : 'Confirm Order'}
                      </button>
                      <button className="btn btn-outline btn-sm" style={{ width: '100%', marginTop: 8 }} onClick={() => setShowOrder(false)}>
                        Cancel
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}