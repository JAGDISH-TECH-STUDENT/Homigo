import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import FlashMessage from '../../components/FlashMessage';

export default function HostListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    API.get('/listings/host/listings')
      .then(res => setListings(res.data.listings || res.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load your listings'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    setDeletingId(listingId);
    try {
      await API.delete(`/listings/${listingId}`);
      setListings(prev => prev.filter(l => (l._id || l.id) !== listingId));
      setSuccess('Listing deleted successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete listing');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div className="loading-spinner" />;

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      {error && <FlashMessage message={error} type="error" />}
      {success && <FlashMessage message={success} type="success" />}

      <div className="page-header">
        <h1>My Listings</h1>
        <Link to="/listings/new" className="btn btn-primary">
          <i className="fa-solid fa-plus"></i> New Listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="text-center" style={{ padding: '4rem 0' }}>
          <h2>No listings yet</h2>
          <p className="text-light mt-1">Create your first listing to start hosting.</p>
          <Link to="/listings/new" className="btn btn-primary mt-2">Create Listing</Link>
        </div>
      ) : (
        <div className="listing-grid">
          {listings.map(listing => {
            const listingId = listing._id || listing.id;
            return (
              <div key={listingId} className="card">
                <img
                  className="card-img"
                  src={listing.images?.[0]?.url || listing.images?.[0] || '/placeholder.jpg'}
                  alt={listing.title}
                />
                <div className="card-body">
                  <h3 className="card-title">{listing.title}</h3>
                  <p className="card-text">{listing.location}, {listing.country}</p>
                  <p className="card-price mt-1">
                    ₹{listing.price?.toLocaleString('en-IN')} <span>/ night</span>
                  </p>
                  {listing.category && (
                    <span className="badge badge-active mt-1" style={{ display: 'inline-block' }}>
                      {listing.category}
                    </span>
                  )}
                  <div className="flex gap-1 mt-2" style={{ flexWrap: 'wrap' }}>
                    <Link to={`/listings/${listingId}`} className="btn btn-secondary btn-sm">View</Link>
                    <Link to={`/listings/${listingId}/edit`} className="btn btn-outline btn-sm">Edit</Link>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(listingId)}
                      disabled={deletingId === listingId}
                    >
                      {deletingId === listingId ? 'Deleting...' : 'Delete'}
                    </button>
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
