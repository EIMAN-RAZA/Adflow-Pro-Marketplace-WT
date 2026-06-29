import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import GigCard from '../components/GigCard';

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [gigs, setGigs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || '';
  const page = parseInt(searchParams.get('page') || '1');

  const [localSearch, setLocalSearch] = useState(search);

  useEffect(() => { api.get('/categories').then(r => setCategories(r.data)).catch(() => {}); }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 12 });
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (sort) params.set('sort', sort);

    api.get(`/gigs?${params}`).then(r => {
      setGigs(r.data.gigs);
      setTotal(r.data.total);
      setPages(r.data.pages);
    }).finally(() => setLoading(false));
  }, [search, category, sort, page]);

  const update = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  return (
    <div className="page">
      <div className="container" style={{ padding: '40px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 32 }}>
          {/* Filters sidebar */}
          <div>
            <div className="card" style={{ position: 'sticky', top: 90 }}>
              <h3 style={{ fontSize: 15, marginBottom: 16 }}>Filters</h3>

              <div className="form-group">
                <div className="form-label">Category</div>
                <select value={category} onChange={e => update('category', e.target.value)}>
                  <option value="">All Categories</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <div className="form-label">Sort By</div>
                <select value={sort} onChange={e => update('sort', e.target.value)}>
                  <option value="">Newest</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price_asc">Lowest Price</option>
                </select>
              </div>

              {(category || search || sort) && (
                <button className="btn btn-outline btn-sm" style={{ width: '100%' }} onClick={() => setSearchParams({})}>
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Main */}
          <div>
            <form onSubmit={e => { e.preventDefault(); update('search', localSearch); }}
              style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              <input
                value={localSearch}
                onChange={e => setLocalSearch(e.target.value)}
                placeholder="Search services..."
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary">Search</button>
            </form>

            <div className="flex-between" style={{ marginBottom: 20 }}>
              <div className="text-muted text-sm">{total} services found</div>
            </div>

            {loading ? (
              <div className="spinner" />
            ) : gigs.length === 0 ? (
              <div className="empty-state">
                <h3>No services found</h3>
                <p>Try different search terms or filters</p>
              </div>
            ) : (
              <>
                <div className="grid grid-3">
                  {gigs.map(gig => <GigCard key={gig._id} gig={gig} />)}
                </div>

                {pages > 1 && (
                  <div className="flex-center gap-8" style={{ marginTop: 32 }}>
                    {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => update('page', p)}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}