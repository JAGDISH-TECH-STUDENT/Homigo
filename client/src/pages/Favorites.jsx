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
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      {error && <FlashMessage message={error} type="error" />}

      <div className="page-header">
        <h1>My Favorites</h1>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center" style={{ padding: '4rem 0' }}>
          <i className="fa-regular fa-heart" style={{ fontSize: '4rem', color: 'var(--border)', marginBottom: '1rem', display: 'block' }}></i>
          <h2>No favorites yet</h2>
          <p className="text-light mt-1">Start exploring and save your favorite listings!</p>
          <Link to="/listings" className="btn btn-primary mt-2">Browse Listings</Link>
        </div>
      ) : (
        <div className="listing-grid">
          {favorites.map(fav => {
            const listing = fav.listing || {};
            const listingId = listing._id || fav.listing;
            return (
              <div key={fav._id} className="card" style={{ position: 'relative' }}>
                <Link to={`/listings/${listingId}`}>
                  <img
                    className="card-img"
                    src={listing.images?.[0]?.url || listing.images?.[0] || '/placeholder.jpg'}
                    alt={listing.title || 'Listing'}
                  />
                  <div className="card-body">
                    <h3 className="card-title">{listing.title || 'Listing'}</h3>
                    <p className="card-text">{listing.location}, {listing.country}</p>
                    <p className="card-price mt-1">
                      ₹{listing.price?.toLocaleString('en-IN')} <span>/ night</span>
                    </p>
                  </div>
                </Link>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleRemove(listingId)}
                  style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', borderRadius: '50%', width: 32, height: 32, padding: 0, fontSize: '0.9rem' }}
                  title="Remove from favorites"
                >
                  <i className="fa-solid fa-heart"></i>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
