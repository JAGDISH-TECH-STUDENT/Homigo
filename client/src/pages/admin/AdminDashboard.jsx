import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/admin/dashboard')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-spinner" />;
  if (!data) return <div className="container text-center" style={{ padding: '4rem 0' }}><h2>Access denied</h2></div>;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link to="/admin" className="active">Dashboard</Link>
        <Link to="/admin/users">Users</Link>
        <Link to="/admin/listings">Listings</Link>
        <Link to="/admin/bookings">Bookings</Link>
        <Link to="/admin/reviews">Reviews</Link>
      </aside>
      <div className="admin-content">
        <h1 style={{ marginBottom: '1.5rem' }}>Admin Dashboard</h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Users', value: data.totalUsers, icon: 'fa-users', color: '#0d6efd' },
            { label: 'Listings', value: data.totalListings, icon: 'fa-building', color: 'var(--success)' },
            { label: 'Bookings', value: data.totalBookings, icon: 'fa-calendar', color: 'var(--warning)' },
            { label: 'Reviews', value: data.totalReviews, icon: 'fa-star', color: 'var(--primary)' },
          ].map((stat, i) => (
            <div key={i} className="card" style={{ padding: '1.25rem' }}>
              <div className="flex items-center gap-2">
                <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-sm)', background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color, fontSize: '1.25rem' }}>
                  <i className={`fa-solid ${stat.icon}`}></i>
                </div>
                <div>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stat.value}</p>
                  <p className="text-light" style={{ fontSize: '0.8rem' }}>{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Guests', value: data.guests },
            { label: 'Hosts', value: data.hosts },
            { label: 'Admins', value: data.admins },
          ].map((s, i) => (
            <div key={i} className="card" style={{ padding: '1rem', textAlign: 'center' }}>
              <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>{s.value}</p>
              <p className="text-light" style={{ fontSize: '0.8rem' }}>{s.label}</p>
            </div>
          ))}
        </div>

        <h3 style={{ marginBottom: '0.75rem' }}>Recent Users</h3>
        <div className="table-wrapper mb-2">
          <table className="table">
            <thead><tr><th>Username</th><th>Email</th><th>Role</th></tr></thead>
            <tbody>
              {(data.recentUsers || []).map(u => (
                <tr key={u._id}><td>{u.username}</td><td>{u.email}</td><td><span className="badge badge-active">{u.role}</span></td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 style={{ marginBottom: '0.75rem' }}>Recent Listings</h3>
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Title</th><th>Location</th><th>Price</th></tr></thead>
            <tbody>
              {(data.recentListings || []).map(l => (
                <tr key={l._id}><td>{l.title}</td><td>{l.location}</td><td>₹{l.price?.toLocaleString('en-IN')}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
