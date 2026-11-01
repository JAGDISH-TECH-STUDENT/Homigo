import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import FlashMessage from '../../components/FlashMessage';
import AdminSidebar from './AdminSidebar';

let bookingsCache = null;

export default function AdminBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState(bookingsCache || []);
  const [loading, setLoading] = useState(!bookingsCache);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    API.get('/admin/bookings')
      .then(res => {
        const data = res.data.bookings || [];
        bookingsCache = data;
        setBookings(data);
      })
      .catch(err => {
        if (!bookingsCache) {
          setError(err.response?.data?.error || 'Failed to load bookings');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this booking record?')) return;
    try {
      await API.delete(`/admin/bookings/${id}`);
      setBookings(prev => {
        const next = prev.filter(b => b._id !== id);
        bookingsCache = next;
        return next;
      });
      setSuccess('Booking record deleted');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete booking');
    }
  };

  const filtered = bookings.filter(b => {
    const matchSearch = b.listing?.title?.toLowerCase().includes(search.toLowerCase()) ||
      b.user?.username?.toLowerCase().includes(search.toLowerCase()) ||
      b._id?.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;
    if (statusFilter === 'all') return true;
    return b.status === statusFilter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="admin-badge admin-badge-active">
            <i className="fa-solid fa-circle-check" style={{ fontSize: '0.65rem' }}></i> Confirmed
          </span>
        );
      case 'pending':
        return (
          <span className="admin-badge admin-badge-pending">
            <i className="fa-solid fa-clock" style={{ fontSize: '0.65rem' }}></i> Pending
          </span>
        );
      case 'cancelled':
      case 'rejected':
        return (
          <span className="admin-badge admin-badge-inactive">
            <i className="fa-solid fa-circle-xmark" style={{ fontSize: '0.65rem' }}></i> Cancelled
          </span>
        );
      default:
        return (
          <span className="admin-badge admin-badge-neutral">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="admin-layout admin-dark">
        <AdminSidebar />
        <div className="admin-content">
          <div className="admin-page-header-dark">
            <div>
              <h1>
                <i className="fa-solid fa-calendar-check" style={{ color: '#f472b6', marginRight: '0.6rem', fontSize: '1.4rem' }}></i>
                Manage Bookings
              </h1>
              <p>Track guest stays, confirmation statuses, date ranges, and transaction payouts.</p>
            </div>
          </div>
          <div className="admin-loading-container">
            <div className="admin-spinner"></div>
            <div className="admin-loading-text">Loading reservations...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout admin-dark">
      <AdminSidebar />

      <div className="admin-content">
        {error && <FlashMessage message={error} type="error" />}
        {success && <FlashMessage message={success} type="success" />}

        {/* Page Header */}
        <div className="admin-page-header-dark">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.4rem' }}>
              <button
                type="button"
                className="admin-back-btn admin-back-btn-sm"
                onClick={() => {
                  if (window.history.state?.idx > 0) {
                    navigate(-1);
                  } else {
                    navigate('/admin');
                  }
                }}
                title="Go back"
              >
                <i className="fa-solid fa-arrow-left"></i>
                <span>Back</span>
              </button>
              <h1 style={{ margin: 0 }}>
                <i className="fa-solid fa-calendar-check" style={{ color: '#f472b6', marginRight: '0.6rem', fontSize: '1.4rem' }}></i>
                Manage Bookings
              </h1>
            </div>
            <p>Track guest stays, confirmation statuses, date ranges, and transaction payouts.</p>
          </div>
          <div className="admin-header-actions-dark">
            <div style={{ position: 'relative' }}>
              <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}></i>
              <input
                type="text"
                className="admin-input-dark"
                placeholder="Search listing or guest..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: '2.4rem', width: '260px' }}
              />
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Bookings', count: bookings.length },
            { id: 'confirmed', label: 'Confirmed', count: bookings.filter(b => b.status === 'confirmed').length },
            { id: 'pending', label: 'Pending', count: bookings.filter(b => b.status === 'pending').length },
            { id: 'cancelled', label: 'Cancelled', count: bookings.filter(b => b.status === 'cancelled' || b.status === 'rejected').length },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`admin-btn ${statusFilter === f.id ? 'admin-btn-primary' : 'admin-btn-outline'}`}
              style={{ fontSize: '0.78rem' }}
            >
              {f.label} <span style={{ opacity: 0.75, marginLeft: '0.3rem' }}>({f.count})</span>
            </button>
          ))}
        </div>

        {/* Bookings Table Card */}
        <div className="admin-card-dark">
          <div className="admin-card-dark-header">
            <h3>
              Reservations
              <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginLeft: '0.5rem', fontWeight: 400 }}>
                ({filtered.length} {filtered.length === 1 ? 'booking' : 'bookings'})
              </span>
            </h3>
          </div>

          <div className="admin-table-container">
            <table className="admin-table-dark">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Listing</th>
                  <th>Guest</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.4)' }}>
                      <i className="fa-solid fa-calendar-xmark" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block' }}></i>
                      No bookings match your filter
                    </td>
                  </tr>
                ) : filtered.map(b => (
                  <tr key={b._id}>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                        #{b._id.slice(-6).toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#fff', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={b.listing?.title}>
                        {b.listing?.title || 'Unknown Property'}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#fff' }}>
                          {(b.user?.username || 'G')[0].toUpperCase()}
                        </div>
                        <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.82rem' }}>
                          @{b.user?.username || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="admin-td-muted" style={{ fontSize: '0.8rem' }}>
                        {b.checkIn ? new Date(b.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span className="admin-td-muted" style={{ fontSize: '0.8rem' }}>
                        {b.checkOut ? new Date(b.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#34d399' }}>
                        ₹{b.totalPrice?.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td>
                      {getStatusBadge(b.status)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          className="admin-btn admin-btn-danger admin-btn-sm"
                          onClick={() => handleDelete(b._id)}
                          title="Delete Booking"
                        >
                          <i className="fa-solid fa-trash-can"></i> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
