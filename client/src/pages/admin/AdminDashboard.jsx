import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/useAuth';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    API.get('/admin/dashboard')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-spinner" />;
  if (!data) return <div className="container text-center" style={{ padding: '4rem 0' }}><h2>Access denied</h2></div>;

  const statCards = [
    { label: 'Total Users', value: data.totalUsers, icon: 'fa-users', color: '#3b82f6', bg: '#dbeafe' },
    { label: 'Total Listings', value: data.totalListings, icon: 'fa-building', color: '#10b981', bg: '#d1fae5' },
    { label: 'Total Bookings', value: data.totalBookings, icon: 'fa-calendar-check', color: '#f59e0b', bg: '#fef3c7' },
    { label: 'Total Reviews', value: data.totalReviews, icon: 'fa-star', color: '#8b5cf6', bg: '#ede9fe' },
  ];

  const userStats = [
    { label: 'Guests', value: data.guests, color: '#3b82f6', bg: '#dbeafe' },
    { label: 'Hosts', value: data.hosts, color: '#10b981', bg: '#d1fae5' },
    { label: 'Admins', value: data.admins, color: '#f59e0b', bg: '#fef3c7' },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">Homigo<span>Admin</span></div>
        <div className="admin-sidebar-section">Main</div>
        <Link to="/admin" className="active"><i className="fa-solid fa-gauge-high"></i> Dashboard</Link>
        <Link to="/admin/users"><i className="fa-solid fa-users"></i> Users</Link>
        <Link to="/admin/listings"><i className="fa-solid fa-building"></i> Listings</Link>
        <Link to="/admin/bookings"><i className="fa-solid fa-calendar-check"></i> Bookings</Link>
        <Link to="/admin/reviews"><i className="fa-solid fa-star"></i> Reviews</Link>
        <Link to="/admin/analytics"><i className="fa-solid fa-chart-line"></i> Analytics</Link>
        <Link to="/admin/complaints"><i className="fa-solid fa-headset"></i> Complaints</Link>
        <div className="admin-sidebar-section" style={{ marginTop: '2rem' }}>Quick Stats</div>
        <div style={{ padding: '0 1.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Active Listings</span>
            <strong style={{ color: '#10b981' }}>{data.activeListings}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Confirmed Bookings</span>
            <strong style={{ color: '#10b981' }}>{data.confirmedBookings}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Total Revenue</span>
            <strong style={{ color: '#10b981' }}>₹{(data.totalRevenue || 0).toLocaleString('en-IN')}</strong>
          </div>
        </div>
      </aside>
      
      <div className="admin-content">
        <div className="admin-header">
          <h1>Dashboard Overview</h1>
          <div className="admin-header-actions">
            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b' }}>Welcome back, {user?.username || 'Admin'}</span>
          </div>
        </div>

        <div className="admin-stat-cards" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {statCards.map((stat, i) => (
            <div key={i} className="admin-stat-card">
              <div className="admin-stat-card-icon" style={{ background: stat.bg, color: stat.color }}>
                <i className={`fa-solid ${stat.icon}`}></i>
              </div>
              <div className="admin-stat-card-value">{stat.value}</div>
              <div className="admin-stat-card-label">{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
          {userStats.map((s, i) => (
            <div key={i} className="admin-stat-card" style={{ textAlign: 'center', padding: '1.25rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', fontSize: '1rem' }}>
                <i className="fa-solid fa-user"></i>
              </div>
              <div className="admin-stat-card-value" style={{ fontSize: '1.5rem' }}>{s.value}</div>
              <div className="admin-stat-card-label">{s.label}</div>
            </div>
          ))}
          <div className="admin-stat-card" style={{ textAlign: 'center', padding: '1.25rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fef3c7', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', fontSize: '1rem' }}>
              <i className="fa-solid fa-rupee-sign"></i>
            </div>
            <div className="admin-stat-card-value" style={{ fontSize: '1.5rem' }}>₹{(data.avgListingPrice || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
            <div className="admin-stat-card-label">Avg. Price/Night</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="admin-table-card">
            <div className="admin-table-header">
              <div className="admin-table-title">Recent Users</div>
              <Link to="/admin/users" style={{ fontSize: '0.85rem', color: '#3b82f6' }}>View all</Link>
            </div>
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {(data.recentUsers || []).map(u => (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 500 }}>{u.username}</td>
                    <td style={{ color: '#64748b' }}>{u.email}</td>
                    <td><span className={`badge ${u.role === 'admin' ? 'badge-danger' : u.role === 'host' ? 'badge-success' : ''}`} style={{ background: u.role === 'admin' ? '#fef2f2' : u.role === 'host' ? '#f0fdf4' : '#f8fafc', color: u.role === 'admin' ? '#dc2626' : u.role === 'host' ? '#16a34a' : '#64748b' }}>{u.role || 'guest'}</span></td>
                    <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-table-card">
            <div className="admin-table-header">
              <div className="admin-table-title">Recent Listings</div>
              <Link to="/admin/listings" style={{ fontSize: '0.85rem', color: '#3b82f6' }}>View all</Link>
            </div>
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Location</th>
                  <th>Price</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {(data.recentListings || []).map(l => (
                  <tr key={l._id}>
                    <td style={{ fontWeight: 500 }}>{l.title}</td>
                    <td style={{ color: '#64748b' }}>{l.location}, {l.country}</td>
                    <td>₹{l.price?.toLocaleString('en-IN')}</td>
                    <td style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <i className="fa-solid fa-star" style={{ color: '#f59e0b', fontSize: '0.75rem' }}></i>
                      <span>{l.avgRating ? l.avgRating.toFixed(1) : 'N/A'}</span>
                      <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>({l.reviewsCount || 0})</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-table-card">
          <div className="admin-table-header">
            <div className="admin-table-title">Top Rated Listings</div>
          </div>
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Rating</th>
                <th>Reviews Count</th>
              </tr>
            </thead>
            <tbody>
              {(data.topListings || []).map((l, i) => (
                <tr key={l._id}>
                  <td style={{ fontWeight: 600, color: '#94a3b8' }}>{i + 1}</td>
                  <td style={{ fontWeight: 500 }}>{l.title}</td>
                  <td style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <i className="fa-solid fa-star" style={{ color: '#f59e0b', fontSize: '0.75rem' }}></i>
                    <span>{l.avgRating ? l.avgRating.toFixed(1) : 'N/A'}</span>
                  </td>
                  <td style={{ color: '#64748b' }}>{l.reviewsCount || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}