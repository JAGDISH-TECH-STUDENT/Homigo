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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 80px)',
      padding: '2rem 1.5rem 4rem'
    }}>
      {error && <FlashMessage message={error} type="error" />}
      {success && <FlashMessage message={success} type="success" />}

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <span style={{
                background: '#eff6ff',
                color: '#0066ff',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.5px',
                padding: '0.25rem 0.75rem',
                borderRadius: 50,
                textTransform: 'uppercase'
              }}>
                Properties
              </span>
            </div>
            <h1 style={{
              fontSize: '2.1rem',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.5px',
              margin: '0 0 0.25rem 0'
            }}>
              My Listings
            </h1>
            <p style={{ fontSize: '0.95rem', fontWeight: 500, color: '#64748b', margin: 0 }}>
              Manage your property portfolio, edit information, or create new listings
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/host/dashboard"
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: 50,
                fontWeight: 600,
                fontSize: '0.9rem',
                color: '#0066ff',
                background: '#ffffff',
                border: '1px solid rgba(0, 102, 255, 0.2)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 2px 8px rgba(0, 80, 200, 0.04)',
                transition: 'all 0.2s'
              }}
            >
              <i className="fa-solid fa-chart-line"></i> Dashboard
            </Link>

            <Link
              to="/listings/new"
              style={{
                padding: '0.65rem 1.4rem',
                borderRadius: 50,
                fontWeight: 600,
                fontSize: '0.9rem',
                color: '#ffffff',
                background: 'linear-gradient(135deg, #0066ff 0%, #0052cc 100%)',
                border: 'none',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(0, 102, 255, 0.3)',
                transition: 'all 0.2s'
              }}
            >
              <i className="fa-solid fa-plus"></i> New Listing
            </Link>
          </div>
        </div>

        {listings.length === 0 ? (
          <div style={{
            background: '#ffffff',
            borderRadius: 24,
            padding: '4rem 2rem',
            textAlign: 'center',
            border: '1px solid rgba(0, 102, 255, 0.08)',
            boxShadow: '0 10px 30px rgba(0, 80, 200, 0.05)'
          }}>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: '#eff6ff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <i className="fa-solid fa-hotel" style={{ fontSize: '1.8rem', color: '#0066ff' }}></i>
            </div>
            <h2 style={{ color: '#0f172a', fontWeight: 800, fontSize: '1.35rem', marginBottom: '0.4rem' }}>
              No listings yet
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', maxWidth: 420, margin: '0 auto 1.75rem auto' }}>
              Start sharing your property with travelers worldwide and earn revenue.
            </p>
            <Link
              to="/listings/new"
              style={{
                padding: '0.75rem 1.6rem',
                borderRadius: 50,
                fontWeight: 600,
                fontSize: '0.92rem',
                color: '#ffffff',
                background: 'linear-gradient(135deg, #0066ff 0%, #0052cc 100%)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(0, 102, 255, 0.3)'
              }}
            >
              <i className="fa-solid fa-plus"></i> Create Your First Listing
            </Link>
          </div>
        ) : (
          <div className="listing-grid">
            {listings.map(listing => {
              const listingId = listing._id || listing.id;
              return (
                <div key={listingId} className="luxury-card">
                  <div className="luxury-card-img-wrap">
                    <img
                      className="luxury-card-img"
                      src={listing.images?.[0]?.url || listing.images?.[0] || '/placeholder.jpg'}
                      alt={listing.title}
                    />
                    {listing.category && (
                      <span className="luxury-card-badge">
                        {listing.category}
                      </span>
                    )}
                  </div>

                  <div className="luxury-card-body">
                    <Link to={`/listings/${listingId}`} style={{ textDecoration: 'none' }}>
                      <h3 className="luxury-card-title" title={listing.title}>
                        {listing.title}
                      </h3>
                    </Link>

                    <div className="luxury-card-location">
                      <i className="fa-solid fa-location-dot"></i>
                      <span>{listing.location}, {listing.country}</span>
                    </div>

                    <div style={{ marginTop: '0.75rem', marginBottom: '1rem' }}>
                      <div className="luxury-card-price">
                        ₹{listing.price?.toLocaleString('en-IN')}{' '}
                        <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#94a3b8' }}>/ night</span>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      paddingTop: '0.9rem',
                      borderTop: '1px solid rgba(0, 102, 255, 0.08)',
                      alignItems: 'center'
                    }}>
                      <Link
                        to={`/listings/${listingId}`}
                        style={{
                          flex: 1,
                          padding: '0.45rem 0',
                          textAlign: 'center',
                          borderRadius: 50,
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          color: '#0066ff',
                          background: '#eff6ff',
                          textDecoration: 'none',
                          border: '1px solid rgba(0, 102, 255, 0.15)',
                          transition: 'all 0.2s'
                        }}
                      >
                        View
                      </Link>

                      <Link
                        to={`/listings/${listingId}/edit`}
                        style={{
                          flex: 1,
                          padding: '0.45rem 0',
                          textAlign: 'center',
                          borderRadius: 50,
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          color: '#475569',
                          background: '#f8fafc',
                          textDecoration: 'none',
                          border: '1px solid #e2e8f0',
                          transition: 'all 0.2s'
                        }}
                      >
                        Edit
                      </Link>

                      <button
                        onClick={() => handleDelete(listingId)}
                        disabled={deletingId === listingId}
                        style={{
                          padding: '0.45rem 0.85rem',
                          borderRadius: 50,
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          color: '#ef4444',
                          background: '#fff',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = '#fef2f2';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = '#fff';
                        }}
                        title="Delete listing"
                      >
                        <i className="fa-regular fa-trash-can"></i>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

