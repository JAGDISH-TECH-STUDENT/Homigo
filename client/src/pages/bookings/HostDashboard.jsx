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
          pending: Math.max(0, (prev.stats.pending || 0) - 1),
          ...(action === 'confirm' ? { confirmed: (prev.stats.confirmed || 0) + 1 } : {}),
        }
      }));
      setSuccess(`Booking ${action === 'confirm' ? 'confirmed' : 'rejected'} successfully`);
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${action} booking`);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div style={{
          background: '#ffffff',
          borderRadius: 24,
          padding: '3rem 2rem',
          maxWidth: 500,
          margin: '0 auto',
          border: '1px solid rgba(0, 102, 255, 0.08)',
          boxShadow: '0 10px 30px rgba(0, 80, 200, 0.06)'
        }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '2.5rem', color: '#ef4444', marginBottom: '1rem' }}></i>
          <h2 style={{ color: '#0f172a', fontWeight: 700, marginBottom: '0.5rem' }}>Could not load dashboard</h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>An error occurred while fetching your host information.</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ borderRadius: 50 }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { bookings = [], listings = [], stats = {} } = data;

  const statCards = [
    {
      label: 'Total Listings',
      value: listings.length,
      icon: 'fa-building',
      color: '#0066ff',
      bg: '#eff6ff',
      border: 'rgba(0, 102, 255, 0.12)'
    },
    {
      label: 'Pending Requests',
      value: stats.pending || 0,
      icon: 'fa-clock',
      color: '#d97706',
      bg: '#fffbeb',
      border: 'rgba(217, 119, 6, 0.15)'
    },
    {
      label: 'Confirmed Bookings',
      value: stats.confirmed || 0,
      icon: 'fa-circle-check',
      color: '#059669',
      bg: '#ecfdf5',
      border: 'rgba(5, 150, 105, 0.15)'
    },
  ];

  return (
    <div style={{
      minHeight: 'calc(100vh - 80px)',
      padding: '2rem 1.5rem 4rem',
      background: 'transparent'
    }}>
      {error && <FlashMessage message={error} type="error" />}
      {success && <FlashMessage message={success} type="success" />}

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Top Header */}
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
                Host Portal
              </span>
            </div>
            <h1 style={{
              fontSize: '2.1rem',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.5px',
              margin: '0 0 0.25rem 0'
            }}>
              Host Dashboard
            </h1>
            <p style={{ fontSize: '0.95rem', fontWeight: 500, color: '#64748b', margin: 0 }}>
              Welcome back, <span style={{ color: '#0066ff', fontWeight: 600 }}>{user?.username || 'Host'}</span>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/host/listings"
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
              onMouseEnter={e => {
                e.currentTarget.style.background = '#eff6ff';
                e.currentTarget.style.borderColor = '#0066ff';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.borderColor = 'rgba(0, 102, 255, 0.2)';
              }}
            >
              <i className="fa-solid fa-list-check"></i> Manage Listings
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
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 18px rgba(0, 102, 255, 0.38)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 102, 255, 0.3)';
              }}
            >
              <i className="fa-solid fa-plus"></i> New Listing
            </Link>
          </div>
        </div>

        {/* Stat Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem'
        }}>
          {statCards.map((stat, i) => (
            <div
              key={i}
              style={{
                background: '#ffffff',
                borderRadius: 20,
                padding: '1.6rem 1.5rem',
                boxShadow: '0 8px 25px rgba(0, 80, 200, 0.05)',
                border: '1px solid rgba(0, 102, 255, 0.08)',
                transition: 'all 0.25s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 80, 200, 0.09)';
                e.currentTarget.style.borderColor = 'rgba(0, 102, 255, 0.2)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 80, 200, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(0, 102, 255, 0.08)';
              }}
            >
              <div style={{
                width: 54,
                height: 54,
                borderRadius: 16,
                background: stat.bg,
                border: `1px solid ${stat.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <i className={`fa-solid ${stat.icon}`} style={{ color: stat.color, fontSize: '1.4rem' }}></i>
              </div>
              <div>
                <p style={{
                  fontSize: '2.1rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  lineHeight: 1,
                  margin: '0 0 0.35rem 0',
                  letterSpacing: '-0.5px'
                }}>
                  {stat.value}
                </p>
                <p style={{
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: '#64748b',
                  margin: 0
                }}>
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Your Listings Preview */}
        {listings.length > 0 && (
          <div style={{
            background: '#ffffff',
            borderRadius: 22,
            padding: '1.75rem',
            boxShadow: '0 8px 25px rgba(0, 80, 200, 0.05)',
            border: '1px solid rgba(0, 102, 255, 0.08)',
            marginBottom: '2rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.25rem',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Your Active Listings
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
                  Quick overview of your published properties
                </p>
              </div>
              <Link
                to="/host/listings"
                style={{
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: '#0066ff',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                View all ({listings.length}) <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.75rem' }}></i>
              </Link>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '1.25rem'
            }}>
              {listings.slice(0, 4).map(l => (
                <Link
                  key={l._id}
                  to={`/listings/${l._id}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div
                    style={{
                      border: '1px solid rgba(0, 102, 255, 0.08)',
                      borderRadius: 16,
                      overflow: 'hidden',
                      transition: 'all 0.25s ease',
                      background: '#ffffff',
                      boxShadow: '0 2px 10px rgba(0, 80, 200, 0.03)'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.borderColor = 'rgba(0, 102, 255, 0.3)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 80, 200, 0.08)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = 'rgba(0, 102, 255, 0.08)';
                      e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 80, 200, 0.03)';
                    }}
                  >
                    <div style={{ position: 'relative', width: '100%', height: 135, background: '#f1f5f9' }}>
                      <img
                        src={l.images?.[0]?.url || l.images?.[0] || '/placeholder.jpg'}
                        alt={l.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      {l.category && (
                        <span style={{
                          position: 'absolute',
                          top: 10,
                          left: 10,
                          background: 'rgba(255, 255, 255, 0.92)',
                          backdropFilter: 'blur(8px)',
                          color: '#0f172a',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.6rem',
                          borderRadius: 50,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                        }}>
                          {l.category}
                        </span>
                      )}
                    </div>
                    <div style={{ padding: '0.9rem' }}>
                      <p style={{
                        fontWeight: 700,
                        color: '#0f172a',
                        margin: '0 0 0.25rem 0',
                        fontSize: '0.95rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {l.title}
                      </p>
                      <p style={{
                        fontSize: '0.8rem',
                        color: '#64748b',
                        margin: '0 0 0.5rem 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}>
                        <i className="fa-solid fa-location-dot" style={{ color: '#0066ff', fontSize: '0.75rem' }}></i>
                        {l.location}, {l.country}
                      </p>
                      <p style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0066ff', margin: 0 }}>
                        ₹{l.price?.toLocaleString('en-IN')}{' '}
                        <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#94a3b8' }}>/ night</span>
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Booking Requests Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: 22,
          boxShadow: '0 8px 25px rgba(0, 80, 200, 0.05)',
          border: '1px solid rgba(0, 102, 255, 0.08)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '1.35rem 1.75rem',
            borderBottom: '1px solid rgba(0, 102, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)'
          }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Booking Requests
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
                Review, confirm, or decline traveler booking inquiries
              </p>
            </div>
            {stats.pending > 0 && (
              <span style={{
                background: '#fffbeb',
                color: '#d97706',
                border: '1px solid #fde68a',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.3rem 0.8rem',
                borderRadius: 50
              }}>
                {stats.pending} Action Needed
              </span>
            )}
          </div>

          {bookings.length === 0 ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
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
                <i className="fa-regular fa-calendar-days" style={{ fontSize: '1.8rem', color: '#0066ff' }}></i>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.4rem 0' }}>
                No booking requests yet
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.92rem', maxWidth: 440, margin: '0 auto 1.5rem auto' }}>
                When guests choose your properties, their reservation requests will show up here for you to accept or manage.
              </p>
              <Link
                to="/listings/new"
                style={{
                  padding: '0.65rem 1.4rem',
                  borderRadius: 50,
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  color: '#ffffff',
                  background: 'linear-gradient(135deg, #0066ff 0%, #0052cc 100%)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 14px rgba(0, 102, 255, 0.25)'
                }}
              >
                <i className="fa-solid fa-plus"></i> Create New Listing
              </Link>
            </div>
          ) : (
            <div style={{ padding: '1.25rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {bookings.map(booking => {
                const listing = booking.listing || {};
                const user = booking.user || {};
                const img = listing.images?.[0]?.url || listing.images?.[0];
                return (
                  <div
                    key={booking._id}
                    style={{
                      display: 'flex',
                      gap: '1.25rem',
                      padding: '1.25rem',
                      borderRadius: 16,
                      background: '#ffffff',
                      border: '1px solid rgba(0, 102, 255, 0.08)',
                      boxShadow: '0 2px 10px rgba(0, 80, 200, 0.03)',
                      transition: 'all 0.2s ease',
                      flexWrap: 'wrap',
                      alignItems: 'center'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'rgba(0, 102, 255, 0.2)';
                      e.currentTarget.style.boxShadow = '0 6px 18px rgba(0, 80, 200, 0.06)';
                      e.currentTarget.style.background = '#fcfdfe';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'rgba(0, 102, 255, 0.08)';
                      e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 80, 200, 0.03)';
                      e.currentTarget.style.background = '#ffffff';
                    }}
                  >
                    <img
                      src={img || '/placeholder.jpg'}
                      alt={listing.title}
                      style={{
                        width: 110,
                        height: 75,
                        objectFit: 'cover',
                        borderRadius: 12,
                        flexShrink: 0,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                      }}
                    />

                    <div style={{ flex: 1, minWidth: 240 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                        <Link
                          to={listing._id ? `/listings/${listing._id}` : '#'}
                          style={{
                            fontWeight: 700,
                            color: '#0f172a',
                            fontSize: '1.02rem',
                            textDecoration: 'none'
                          }}
                        >
                          {listing.title || 'Listing'}
                        </Link>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.65rem',
                          borderRadius: 50,
                          textTransform: 'capitalize',
                          background:
                            booking.status === 'confirmed'
                              ? '#ecfdf5'
                              : booking.status === 'rejected'
                              ? '#fef2f2'
                              : '#fffbeb',
                          color:
                            booking.status === 'confirmed'
                              ? '#059669'
                              : booking.status === 'rejected'
                              ? '#dc2626'
                              : '#d97706',
                          border:
                            booking.status === 'confirmed'
                              ? '1px solid #a7f3d0'
                              : booking.status === 'rejected'
                              ? '1px solid #fecaca'
                              : '1px solid #fde68a'
                        }}>
                          {booking.status}
                        </span>
                      </div>

                      <p style={{ fontSize: '0.86rem', color: '#64748b', margin: '0 0 0.35rem 0' }}>
                        Guest:{' '}
                        <span style={{ color: '#0066ff', fontWeight: 600 }}>
                          @{user.username || 'Unknown'}
                        </span>
                      </p>

                      <p style={{
                        fontSize: '0.82rem',
                        color: '#64748b',
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        flexWrap: 'wrap'
                      }}>
                        <i className="fa-regular fa-calendar" style={{ color: '#0066ff' }}></i>
                        {new Date(booking.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        {' → '}
                        {new Date(booking.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        <span style={{ color: '#cbd5e1' }}>•</span>
                        <span>{booking.guests} guest{booking.guests > 1 ? 's' : ''}</span>
                      </p>
                    </div>

                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      marginLeft: 'auto'
                    }}>
                      <p style={{
                        fontWeight: 800,
                        color: '#0f172a',
                        fontSize: '1.25rem',
                        margin: 0,
                        letterSpacing: '-0.3px'
                      }}>
                        ₹{booking.totalPrice?.toLocaleString('en-IN')}
                      </p>

                      {booking.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleAction(booking._id, 'confirm')}
                            style={{
                              padding: '0.45rem 0.95rem',
                              borderRadius: 50,
                              fontWeight: 600,
                              fontSize: '0.82rem',
                              color: '#ffffff',
                              background: '#10b981',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#059669'}
                            onMouseLeave={e => e.currentTarget.style.background = '#10b981'}
                          >
                            <i className="fa-solid fa-check"></i> Accept
                          </button>
                          <button
                            onClick={() => handleAction(booking._id, 'reject')}
                            style={{
                              padding: '0.45rem 0.95rem',
                              borderRadius: 50,
                              fontWeight: 600,
                              fontSize: '0.82rem',
                              color: '#ef4444',
                              background: '#ffffff',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = '#fef2f2';
                              e.currentTarget.style.borderColor = '#ef4444';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = '#ffffff';
                              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                            }}
                          >
                            <i className="fa-solid fa-xmark"></i> Decline
                          </button>
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
