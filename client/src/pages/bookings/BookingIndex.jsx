import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import FlashMessage from '../../components/FlashMessage';

export default function BookingIndex() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      {error && <FlashMessage message={error} type="error" />}
      {success && <FlashMessage message={success} type="success" />}

      <div className="page-header">
        <h1>My Bookings</h1>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center" style={{ padding: '4rem 0' }}>
          <h2>No bookings yet</h2>
          <p className="text-light mt-1">Browse listings and make your first booking!</p>
          <Link to="/listings" className="btn btn-primary mt-2">Browse Listings</Link>
        </div>
      ) : (
        <div>
          {bookings.map(booking => {
            const listing = booking.listing || {};
            const img = listing.images?.[0]?.url || listing.images?.[0];
            return (
              <div key={booking._id} className="booking-card">
                {img && <img src={img} alt={listing.title || 'Listing'} className="booking-card-img" />}
                <div className="booking-card-body">
                  <div className="flex justify-between items-center">
                    <h3 className="booking-card-title">
                      <Link to={`/bookings/${booking._id}`} style={{ color: 'var(--text)' }}>
                        {listing.title || 'Listing'}
                      </Link>
                    </h3>
                    <span className={`badge status-${booking.status}`}>{booking.status}</span>
                  </div>
                  <p className="booking-card-dates">
                    <i className="fa-regular fa-calendar"></i>{' '}
                    {new Date(booking.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' → '}
                    {new Date(booking.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-light" style={{ fontSize: '0.85rem' }}>
                    {booking.guests} guest{booking.guests > 1 ? 's' : ''}
                  </p>
                  <p className="booking-card-price">₹{booking.totalPrice?.toLocaleString('en-IN')}</p>
                  <div className="flex gap-1 mt-1">
                    <Link to={`/bookings/${booking._id}`} className="btn btn-outline btn-sm">View Details</Link>
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
