import { useNavigate } from 'react-router-dom';

export default function GigCard({ gig }) {
  const navigate = useNavigate();
  const minPrice = gig.packages?.length
    ? Math.min(...gig.packages.map(p => p.price))
    : null;

  return (
    <div className="gig-card" onClick={() => navigate(`/gigs/${gig.slug}`)}>
      <div className="gig-card-thumb">
        {gig.thumbnail_url
          ? <img src={gig.thumbnail_url} alt={gig.title} onError={e => e.target.style.display = 'none'} />
          : <span>No Preview</span>
        }
      </div>
      <div className="gig-card-body">
        <div className="gig-card-category">
          {gig.category_id?.name || 'Uncategorized'}
        </div>
        <div className="gig-card-title">{gig.title}</div>
        <div className="gig-card-provider">
          <div className="avatar">
            {gig.provider_id?.name?.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm text-muted">{gig.provider_id?.name}</span>
        </div>
        <div className="gig-card-footer">
          <div className="rating">
            {gig.rating_avg > 0 ? (
              <>&#9733; {Number(gig.rating_avg).toFixed(1)} <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>({gig.rating_count})</span></>
            ) : <span className="text-muted text-sm">No reviews</span>}
          </div>
          {minPrice !== null && (
            <div className="price">
              ${minPrice} <span>starting</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}