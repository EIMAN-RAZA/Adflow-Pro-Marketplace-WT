import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import GigCard from '../components/GigCard';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/gigs/featured').then(r => setFeatured(r.data)).catch(() => {});
    api.get('/categories').then(r => setCategories(r.data)).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/explore?search=${encodeURIComponent(search)}`);
  };

  return (
    <div className="page">
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div className="hero-grid">
            <div>
              <div className="hero-eyebrow">Gig Marketplace Platform</div>
              <h1 className="hero-title">
                Find Expert Services,<br />
                <em>Delivered Fast</em>
              </h1>
              <p className="hero-desc">
                Connect with verified professionals for design, development, writing, and more.
                Secure payments, milestone tracking, and quality guaranteed.
              </p>
              <form onSubmit={handleSearch} className="search-bar" style={{ marginBottom: 24 }}>
                <input
                  type="text"
                  placeholder="Search for any service..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <button type="submit">Search</button>
              </form>
              <div className="hero-actions">
                <Link to="/explore" className="btn btn-primary btn-lg">Browse Services</Link>
                <Link to="/register" className="btn btn-ghost btn-lg">Become a Provider</Link>
              </div>
            </div>
            <div className="hero-visual">
              {[
                { num: '2.4K+', label: 'Active Services' },
                { num: '98%', label: 'Satisfaction Rate' },
                { num: '800+', label: 'Verified Providers' },
                { num: '12K+', label: 'Orders Completed' }
              ].map(s => (
                <div key={s.label} className="hero-stat">
                  <div className="hero-stat-num">{s.num}</div>
                  <div className="hero-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section style={{ padding: '60px 0', borderTop: '1px solid var(--border)' }}>
          <div className="container">
            <h2 style={{ fontSize: 28, marginBottom: 32 }}>Browse Categories</h2>
            <div className="grid grid-4">
              {categories.map(cat => (
                <Link
                  key={cat._id}
                  to={`/explore?category=${cat._id}`}
                  className="card card-hover"
                  style={{ textAlign: 'center', padding: '24px 16px' }}
                >
                  <div style={{ fontSize: 32, marginBottom: 10 }}>
                    {cat.icon || '&#128268;'}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{cat.name}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Gigs */}
      {featured.length > 0 && (
        <section style={{ padding: '60px 0', borderTop: '1px solid var(--border)' }}>
          <div className="container">
            <div className="section-header">
              <h2 style={{ fontSize: 28 }}>Featured Services</h2>
              <Link to="/explore" className="btn btn-outline">View All</Link>
            </div>
            <div className="grid grid-4">
              {featured.map(gig => <GigCard key={gig._id} gig={gig} />)}
            </div>
          </div>
        </section>
      )}

      {/* Trust Strip */}
      <section style={{ padding: '60px 0', borderTop: '1px solid var(--border)', background: 'var(--bg-1)' }}>
        <div className="container">
          <div className="grid grid-3" style={{ gap: 32 }}>
            {[
              { title: 'Escrow Protection', desc: 'Payments held securely until work is approved by you.' },
              { title: 'Verified Providers', desc: 'Every provider is reviewed and approved before listing.' },
              { title: 'Dispute Resolution', desc: 'Our moderation team resolves conflicts fairly and quickly.' }
            ].map(t => (
              <div key={t.title} className="card">
                <h3 style={{ fontSize: 17, marginBottom: 8 }}>{t.title}</h3>
                <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.6 }}>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}