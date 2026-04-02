import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import FlashMessage from '../../components/FlashMessage';

export default function HostDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    API.get('/host/dashboard')
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (bookingId, action) => {
    try {
      await API.post(`/host/bookings/${bookingId}/${action}`);
      setData(prev => ({
        ...prev,
        bookings: prev.bookings.map(b =>
          b._id === bookingId ? { ...b, status: action === 'confirm' ? 'confirmed' : 'rejected' } : b
        ),
        stats: {
          ...prev.stats,
          pending: prev.stats.pending - 1,
          ...(action === 'confirm' ? { confirmed: prev.stats.confirmed + 1 } : {}),
        }
      }));
      setSuccess(`Booking ${action === 'confirm' ? 'confirmed' : 'rejected'}`);
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${action} booking`);
    }
  };

  if (loading) return <div className="loading-spinner" />;
  if (!data) return <div className="container text-center" style={{ padding: '4rem 0' }}><h2>Could not load dashboard</h2></div>;

  const { bookings = [], listings = [], stats = {} } = data;

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      {error && <FlashMessage message={error} type="error" />}
      {success && <FlashMessage message={success} type="success" />}

      <div className="page-header">
        <h1>Host Dashboard</h1>
        <Link to="/listings/new" className="btn btn-primary">
          <i className="fa-solid fa-plus"></i> New Listing
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Listings', value: listings.length, color: 'var(--secondary)' },
          { label: 'Pending Requests', value: stats.pending || 0, color: 'var(--warning)' },
          { label: 'Confirmed', value: stats.confirmed || 0, color: 'var(--success)' },
        ].map((stat, i) => (
          <div key={i} className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <p style={{ fontSize: '2rem', fontWeight: 700, color: stat.color }}>{stat.value}</p>
            <p className="text-light" style={{ fontSize: '0.85rem' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      <h2 style={{ marginBottom: '1rem' }}>Booking Requests</h2>

      {bookings.length === 0 ? (
        <div className="text-center" style={{ padding: '3rem 0' }}>
          <p className="text-light">No booking requests yet. Create listings to start receiving bookings.</p>
        </div>
      ) : (
        <div>
          {bookings.map(booking => {
            const listing = booking.listing || {};
            const user = booking.user || {};
            const img = listing.images?.[0]?.url || listing.images?.[0];
            return (
              <div key={booking._id} className="booking-card">
                {img && <img src={img} alt={listing.title} className="booking-card-img" />}
                <div className="booking-card-body">
                  <div className="flex justify-between items-center">
                    <h3 className="booking-card-title">{listing.title || 'Listing'}</h3>
                    <span className={`badge status-${booking.status}`}>{booking.status}</span>
                  </div>
                  <p className="text-light" style={{ fontSize: '0.85rem' }}>
                    Guest: <strong>@{user.username || 'Unknown'}</strong>
                  </p>
                  <p className="booking-card-dates">
                    {new Date(booking.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    {' → '}
                    {new Date(booking.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' · '}{booking.guests} guest{booking.guests > 1 ? 's' : ''}
                  </p>
                  <p className="booking-card-price">₹{booking.totalPrice?.toLocaleString('en-IN')}</p>
                  {booking.status === 'pending' && (
                    <div className="flex gap-1 mt-1">
                      <button className="btn btn-success btn-sm" onClick={() => handleAction(booking._id, 'confirm')}>Confirm</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleAction(booking._id, 'reject')}>Reject</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
