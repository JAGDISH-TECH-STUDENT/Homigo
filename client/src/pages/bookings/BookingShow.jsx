import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../../api/axios';
import FlashMessage from '../../components/FlashMessage';

export default function BookingShow() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    API.get(`/bookings/${bookingId}`)
      .then(res => setBooking(res.data.booking || res.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load booking'))
      .finally(() => setLoading(false));
  }, [bookingId]);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      const res = await API.post(`/bookings/${bookingId}/cancel`);
      setBooking(res.data.booking || { ...booking, status: 'cancelled' });
      setSuccess('Booking cancelled');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel');
    }
  };

  if (loading) return <div className="loading-spinner" />;
  if (!booking) return <div className="container text-center" style={{ padding: '4rem 0' }}><h2>Booking not found</h2></div>;

  const listing = booking.listing || {};
  const img = listing.images?.[0]?.url || listing.images?.[0];

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: 800 }}>
      {error && <FlashMessage message={error} type="error" />}
      {success && <FlashMessage message={success} type="success" />}

      <Link to="/bookings" style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>&larr; Back to bookings</Link>

      <div className="card mt-2" style={{ overflow: 'hidden' }}>
        {img && <img src={img} alt={listing.title} style={{ width: '100%', height: 260, objectFit: 'cover' }} />}
        <div style={{ padding: '1.5rem' }}>
          <div className="flex justify-between items-center mb-2">
            <h1 style={{ fontSize: '1.5rem' }}>{listing.title || 'Listing'}</h1>
            <span className={`badge status-${booking.status}`}>{booking.status}</span>
          </div>
          <p className="text-light">{listing.location}, {listing.country}</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '1.5rem 0', padding: '1rem', background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-light)' }}>Check-in</p>
              <p style={{ fontWeight: 600 }}>{new Date(booking.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-light)' }}>Check-out</p>
              <p style={{ fontWeight: 600 }}>{new Date(booking.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-light)' }}>Guests</p>
              <p style={{ fontWeight: 600 }}>{booking.guests}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-light)' }}>Booked on</p>
              <p style={{ fontWeight: 600 }}>{new Date(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <div className="flex justify-between" style={{ fontSize: '0.9rem', marginBottom: '0.35rem' }}>
              <span className="text-light">Total Price</span>
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>₹{booking.totalPrice?.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="flex gap-1 mt-2">
            <Link to={`/listings/${listing._id || listing}`} className="btn btn-secondary btn-sm">View Listing</Link>
            {booking.status === 'confirmed' && (
              <button className="btn btn-danger btn-sm" onClick={handleCancel}>Cancel Booking</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
