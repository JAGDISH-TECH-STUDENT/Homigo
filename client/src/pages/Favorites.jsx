import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import FlashMessage from '../components/FlashMessage';

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get('/favorites')
      .then(res => setFavorites(res.data.favorites || []))
      .catch(err => setError(err.response?.data?.error || 'Failed to load favorites'))
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (listingId) => {
    try {
      await API.post(`/favorites/${listingId}/toggle`);
      setFavorites(prev => prev.filter(f => (f.listing?._id || f.listing) !== listingId));
    } catch {
      // ignore
    }
  };

  if (loading) return <div className="loading-spinner" />;

  return (
    <div className="container" style={{ padding: '2rem 1.5rem 3.5rem' }}>
      {error && <FlashMessage message={error} type="error" />}

      <div className="section-header-row">
        <div className="section-header-left">
          <div className="section-blue-bar" />
          <div>
            <h2>My Favorites</h2>
            <p>Saved properties you love</p>
          </div>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center" style={{ padding: '4rem 0' }}>
          <i className="fa-regular fa-heart" style={{ fontSize: '4rem', color: '#cbd5e1', marginBottom: '1rem', display: 'block' }}></i>
          <h2>No favorites yet</h2>
          <p className="text-light mt-1">Start exploring and save your favorite listings!</p>
          <Link to="/" className="hero-cta-btn mt-2" style={{ marginTop: '1.25rem' }}>
            Browse Listings <i className="fa-solid fa-arrow-right"></i>
          </Link>
        </div>
      ) : (
        <div className="listing-grid">
          {favorites.map((fav, index) => {
            const listing = fav.listing || {};
            const listingId = listing._id || fav.listing;
            const rating = listing.avgRating ? listing.avgRating.toFixed(1) : (4.7 + (index % 3) * 0.1).toFixed(1);

            return (
              <div key={fav._id} className="luxury-card">
                <div className="luxury-card-img-wrap">
                  <div className="card-rating-badge">
                    <i className="fa-solid fa-star"></i>
                    <span>{rating}</span>
                  </div>

                  <button
                    className="card-fav-btn active"
                    onClick={(e) => {
                      e.preventDefault();
                      handleRemove(listingId);
                    }}
                    title="Remove from favorites"
                    aria-label="Remove favorite"
                  >
                    ♥
                  </button>

                  <Link to={`/listings/${listingId}`}>
                    <img
                      className="luxury-card-img"
                      src={listing.images?.[0]?.url || listing.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'}
                      alt={listing.title || 'Listing'}
                      loading="lazy"
                      decoding="async"
                    />
                  </Link>
                </div>

                <div className="luxury-card-body">
                  <Link to={`/listings/${listingId}`}>
                    <h3 className="luxury-card-title" title={listing.title}>
                      {listing.title || 'Exclusive Stay'}
                    </h3>
                  </Link>

                  <div className="luxury-card-location">
                    <i className="fa-solid fa-location-dot"></i>
                    <span>{listing.location || 'Location'}, {listing.country || 'Country'}</span>
                  </div>

                  <div className="luxury-card-footer">
                    <div className="luxury-card-price">
                      ₹{listing.price?.toLocaleString('en-IN')} <span>/ night</span>
                    </div>

                    <Link to={`/listings/${listingId}`} className="luxury-view-btn">
                      View Details <i className="fa-solid fa-arrow-right"></i>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
