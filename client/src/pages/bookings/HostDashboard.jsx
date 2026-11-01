import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import FlashMessage from '../../components/FlashMessage';
import { useAuth } from '../../context/useAuth';

export default function HostDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();

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

  const statCards = [
    { label: 'Total Listings', value: listings.length, icon: 'fa-building', color: '#818cf8', bg: 'linear-gradient(135deg, rgba(129,140,248,0.2), rgba(129,140,248,0.05))' },
    { label: 'Pending Requests', value: stats.pending || 0, icon: 'fa-clock', color: '#fbbf24', bg: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(251,191,36,0.05))' },
    { label: 'Confirmed', value: stats.confirmed || 0, icon: 'fa-check-circle', color: '#34d399', bg: 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(52,211,153,0.05))' },
  ];

  return (
    <div style={{ background: '#0b0f1a', minHeight: 'calc(100vh - 60px)', padding: '2rem 1.5rem' }}>
      {error && <FlashMessage message={error} type="error" />}
      {success && <FlashMessage message={success} type="success" />}

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', margin: '0 0 0.25rem 0' }}>Host Dashboard</h1>
            <p style={{ fontSize: '0.95rem', fontWeight: 500, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Welcome back, <span style={{ color: '#818cf8' }}>{user?.username || 'Host'}</span></p>
          </div>
          <Link to="/listings/new" className="btn btn-primary" style={{ padding: '0.65rem 1.25rem' }}>
            <i className="fa-solid fa-plus"></i> New Listing
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          {statCards.map((stat, i) => (
            <div key={i} style={{ background: '#111827', borderRadius: 16, padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`fa-solid ${stat.icon}`} style={{ color: stat.color, fontSize: '1.25rem' }}></i>
                </div>
                <div>
                  <p style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', lineHeight: 1, margin: '0 0 0.25rem 0' }}>{stat.value}</p>
                  <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {listings.length > 0 && (
          <div style={{ background: '#111827', borderRadius: 16, padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: '1rem' }}>Your Listings</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
              {listings.slice(0, 4).map(l => (
                <Link key={l._id} to={`/listings/${l._id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden', transition: 'all 0.2s', background: 'rgba(255,255,255,0.02)' }}>
                    <img src={l.images?.[0]?.url || l.images?.[0] || '/placeholder.jpg'} alt={l.title} style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                    <div style={{ padding: '0.75rem' }}>
                      <p style={{ fontWeight: 600, color: '#fff', margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>{l.title}</p>
                      <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>₹{l.price?.toLocaleString('en-IN')}/night</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div style={{ background: '#111827', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', margin: 0 }}>Booking Requests</h2>
          </div>

          {bookings.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <i className="fa-solid fa-calendar-xmark" style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.2)', marginBottom: '1rem', display: 'block' }}></i>
              <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0 }}>No booking requests yet. Create listings to start receiving bookings.</p>
            </div>
          ) : (
            <div style={{ padding: '1rem' }}>
              {bookings.map(booking => {
                const listing = booking.listing || {};
                const user = booking.user || {};
                const img = listing.images?.[0]?.url || listing.images?.[0];
                return (
                  <div key={booking._id} style={{ display: 'flex', gap: '1rem', padding: '1rem', borderRadius: 12, marginBottom: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <img src={img || '/placeholder.jpg'} alt={listing.title} style={{ width: 100, height: 70, objectFit: 'cover', borderRadius: 8 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                        <h3 style={{ fontWeight: 600, color: '#fff', margin: 0, fontSize: '1rem' }}>{listing.title || 'Listing'}</h3>
                        <span style={{ 
                          fontSize: '0.72rem', fontWeight: 600, padding: '0.25rem 0.75rem', borderRadius: 20,
                          background: booking.status === 'confirmed' ? 'rgba(52, 211, 153, 0.15)' : booking.status === 'rejected' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                          color: booking.status === 'confirmed' ? '#34d399' : booking.status === 'rejected' ? '#f87171' : '#fbbf24',
                          textTransform: 'capitalize'
                        }}>{booking.status}</span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', margin: '0 0 0.25rem 0' }}>
                        Guest: <strong style={{ color: '#818cf8' }}>@{user.username || 'Unknown'}</strong>
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                        {new Date(booking.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} → {new Date(booking.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {booking.guests} guest{booking.guests > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                      <p style={{ fontWeight: 700, color: '#1e293b', fontSize: '1.1rem', margin: 0 }}>₹{booking.totalPrice?.toLocaleString('en-IN')}</p>
                      {booking.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
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
      </div>
    </div>
  );
}