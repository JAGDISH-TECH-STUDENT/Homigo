import { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import API from '../../api/axios';
import FlashMessage from '../../components/FlashMessage';
import { useAuth } from '../../context/useAuth';

export default function BookingShow() {
  const { user } = useAuth();
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (user && user.role === 'host') {
    return <Navigate to="/host/dashboard" replace />;
  }

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

      <div className="card" style={{ overflow: 'hidden', borderRadius: 24, border: '1px solid rgba(0, 102, 255, 0.08)', boxShadow: '0 12px 35px rgba(0, 80, 200, 0.06)' }}>
        {img && (
          <img
            src={img}
            alt={listing.title}
            style={{ width: '100%', height: 280, objectFit: 'cover' }}
            onError={e => {
              e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';
            }}
          />
        )}
        <div style={{ padding: '1.75rem' }}>
          <div className="flex justify-between items-center mb-2">
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
              {listing.title || 'Listing'}
            </h1>
            <span className={`badge status-${booking.status}`} style={{ textTransform: 'capitalize', fontWeight: 700, padding: '0.35rem 0.85rem', borderRadius: 9999 }}>
              {booking.status}
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.92rem', marginBottom: '1.25rem' }}>
            <i className="fa-solid fa-location-dot" style={{ color: '#0066ff', marginRight: '0.4rem' }}></i>
            {listing.location}, {listing.country}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '1.5rem 0', padding: '1.25rem', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 18 }}>
            <div>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>Check-in</p>
              <p style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{new Date(booking.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>Check-out</p>
              <p style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{new Date(booking.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>Guests</p>
              <p style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{booking.guests}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>Booked on</p>
              <p style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{new Date(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1.25rem' }}>
              <span style={{ color: '#64748b', fontWeight: 600, fontSize: '0.95rem' }}>Total Price</span>
              <span style={{ fontWeight: 800, fontSize: '1.4rem', color: '#0066ff' }}>₹{booking.totalPrice?.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="flex gap-1">
            <Link
              to={`/listings/${listing._id || listing}`}
              className="btn btn-primary btn-sm"
              style={{ borderRadius: 9999, padding: '0.55rem 1.4rem', fontWeight: 700, background: '#0066ff', color: '#fff', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <i className="fa-solid fa-hotel"></i> View Listing
            </Link>
            {booking.status === 'confirmed' && (
              <button
                className="btn btn-danger btn-sm"
                onClick={handleCancel}
                style={{ borderRadius: 9999, padding: '0.55rem 1.25rem', fontWeight: 700 }}
              >
                Cancel Booking
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
