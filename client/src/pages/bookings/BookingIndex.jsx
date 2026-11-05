import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import API from '../../api/axios';
import FlashMessage from '../../components/FlashMessage';
import { useAuth } from '../../context/useAuth';

export default function BookingIndex() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Host accounts cannot access guest bookings
  if (user && user.role === 'host') {
    return <Navigate to="/host/dashboard" replace />;
  }

  useEffect(() => {
    API.get('/bookings')
      .then(res => setBookings(res.data.bookings || []))
      .catch(err => setError(err.response?.data?.error || 'Failed to load bookings'))
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await API.post(`/bookings/${bookingId}/cancel`);
      setBookings(prev => prev.map(b => (b._id === bookingId ? { ...b, status: 'cancelled' } : b)));
      setSuccess('Booking cancelled successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel booking');
    }
  };

  const handleDelete = async (bookingId) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return;
    try {
      await API.delete(`/bookings/${bookingId}`);
      setBookings(prev => prev.filter(b => b._id !== bookingId));
      setSuccess('Booking deleted successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete booking');
    }
  };

  if (loading) return <div className="loading-spinner" />;

  return (
    <div className="container" style={{ padding: '2rem 1.5rem 3.5rem' }}>
      {error && <FlashMessage message={error} type="error" />}
      {success && <FlashMessage message={success} type="success" />}

      <div className="section-header-row">
        <div className="section-header-left">
          <div className="section-blue-bar" />
          <div>
            <h2>My Bookings</h2>
            <p>Manage and track your reservations</p>
          </div>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center" style={{ padding: '4rem 0' }}>
          <h2>No bookings yet</h2>
          <p className="text-light mt-1">Browse listings and make your first booking!</p>
          <Link to="/" className="hero-cta-btn mt-2" style={{ marginTop: '1.25rem' }}>
            Browse Listings <i className="fa-solid fa-arrow-right"></i>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {bookings.map(booking => {
            const listing = booking.listing || {};
            const img = listing.images?.[0]?.url || listing.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';
            return (
              <div key={booking._id} className="booking-card">
                <img src={img} alt={listing.title || 'Listing'} className="booking-card-img" />
                <div className="booking-card-body">
                  <div className="flex justify-between items-center">
                    <h3 className="booking-card-title">
                      <Link to={`/bookings/${booking._id}`} style={{ color: '#0f172a' }}>
                        {listing.title || 'Listing'}
                      </Link>
                    </h3>
                    <span className={`badge status-${booking.status}`}>{booking.status}</span>
                  </div>
                  <p className="booking-card-dates">
                    <i className="fa-regular fa-calendar" style={{ color: '#0066ff' }}></i>{' '}
                    {new Date(booking.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' → '}
                    {new Date(booking.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-light" style={{ fontSize: '0.85rem' }}>
                    {booking.guests} guest{booking.guests > 1 ? 's' : ''}
                  </p>
                  <p className="booking-card-price">₹{booking.totalPrice?.toLocaleString('en-IN')}</p>
                  <div className="flex gap-1 mt-1">
                    <Link to={`/bookings/${booking._id}`} className="luxury-view-btn" style={{ fontSize: '0.8rem', padding: '0.35rem 0.9rem' }}>
                      View Details
                    </Link>
                    {booking.status === 'confirmed' && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleCancel(booking._id)}>Cancel</button>
                    )}
                    {booking.status === 'pending' && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(booking._id)}>Delete</button>
                    )}
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
