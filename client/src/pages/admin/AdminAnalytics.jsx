import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    API.get(`/admin/analytics?period=${period}`)
      .then(res => {
        setData(res.data)
      })
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) return <div className="loading-spinner" />;

  const { overview, stats, charts } = data || {};

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">Homigo<span>Admin</span></div>
        <Link to="/admin"><i className="fa-solid fa-gauge-high"></i> Dashboard</Link>
        <Link to="/admin/users"><i className="fa-solid fa-users"></i> Users</Link>
        <Link to="/admin/listings"><i className="fa-solid fa-building"></i> Listings</Link>
        <Link to="/admin/bookings"><i className="fa-solid fa-calendar-check"></i> Bookings</Link>
        <Link to="/admin/reviews"><i className="fa-solid fa-star"></i> Reviews</Link>
        <Link to="/admin/analytics" className="active"><i className="fa-solid fa-chart-line"></i> Analytics</Link>
        <Link to="/admin/complaints"><i className="fa-solid fa-headset"></i> Complaints</Link>
      </aside>
      
      <div className="admin-content">
        <div className="admin-header">
          <h1>Analytics & Reports</h1>
          <select value={period} onChange={e => setPeriod(e.target.value)} className="form-control" style={{ width: 'auto' }}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>

        <div className="admin-stat-cards" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="admin-stat-card">
            <div className="admin-stat-card-icon" style={{ background: '#dbeafe', color: '#3b82f6' }}>
              <i className="fa-solid fa-users"></i>
            </div>
            <div className="admin-stat-card-value">{overview?.totalUsers || 0}</div>
            <div className="admin-stat-card-label">Total Users <span style={{ fontSize: '0.7rem', color: '#10b981' }}>(+{stats?.newUsers})</span></div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-card-icon" style={{ background: '#d1fae5', color: '#10b981' }}>
              <i className="fa-solid fa-building"></i>
            </div>
            <div className="admin-stat-card-value">{overview?.totalListings || 0}</div>
            <div className="admin-stat-card-label">Total Listings <span style={{ fontSize: '0.7rem', color: '#10b981' }}>(+{stats?.newListings})</span></div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-card-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
              <i className="fa-solid fa-calendar-check"></i>
            </div>
            <div className="admin-stat-card-value">{overview?.totalBookings || 0}</div>
            <div className="admin-stat-card-label">Total Bookings <span style={{ fontSize: '0.7rem', color: '#10b981' }}>(+{stats?.newBookings})</span></div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-card-icon" style={{ background: '#ede9fe', color: '#8b5cf6' }}>
              <i className="fa-solid fa-rupee-sign"></i>
            </div>
            <div className="admin-stat-card-value">₹{(overview?.totalRevenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
            <div className="admin-stat-card-label">Total Revenue</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-card-icon" style={{ background: '#fce7f3', color: '#ec4899' }}>
              <i className="fa-solid fa-user-shield"></i>
            </div>
            <div className="admin-stat-card-value">{overview?.totalHosts || 0}</div>
            <div className="admin-stat-card-label">Total Hosts</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="admin-table-card">
            <div className="admin-table-header">
              <div className="admin-table-title">Monthly Revenue</div>
            </div>
            <div style={{ padding: '1.5rem' }}>
              {charts?.monthlyRevenue?.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: 150 }}>
                  {charts.monthlyRevenue.map((m, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '100%', background: '#3b82f6', borderRadius: '4px 4px 0 0', height: `${(m.revenue / (overview?.totalRevenue || 1)) * 150}px`, minHeight: 4 }}></div>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>M{m.month}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-light text-center">No revenue data</p>
              )}
            </div>
          </div>

          <div className="admin-table-card">
            <div className="admin-table-header">
              <div className="admin-table-title">Bookings by Status</div>
            </div>
            <div style={{ padding: '1.5rem' }}>
              {Object.entries(charts?.bookingsByStatus || {}).map(([status, count], i) => (
                <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: i < Object.keys(charts.bookingsByStatus).length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{status}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 80, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${(count / (overview?.totalBookings || 1)) * 100}%`, height: '100%', background: status === 'confirmed' ? '#10b981' : status === 'pending' ? '#f59e0b' : '#ef4444', borderRadius: 4 }}></div>
                    </div>
                    <span style={{ fontWeight: 600, minWidth: 30, textAlign: 'right' }}>{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="admin-table-card">
            <div className="admin-table-header">
              <div className="admin-table-title">Top Locations</div>
            </div>
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Location</th>
                  <th>Listings</th>
                </tr>
              </thead>
              <tbody>
                {(charts?.topLocations || []).map((l, i) => (
                  <tr key={l.location || i}>
                    <td style={{ fontWeight: 600, color: '#94a3b8' }}>{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{l.location || l._id || '-'}</td>
                    <td style={{ color: '#64748b' }}>{l.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-table-card">
            <div className="admin-table-header">
              <div className="admin-table-title">Recent Listings</div>
            </div>
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Location</th>
                  <th>Owner</th>
                </tr>
              </thead>
              <tbody>
                {(charts?.topListings || []).map((l, i) => (
                  <tr key={l._id || i}>
                    <td style={{ fontWeight: 600, color: '#94a3b8' }}>{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{l.title || 'Untitled'}</td>
                    <td style={{ color: '#64748b' }}>{l.location || 'N/A'}</td>
                    <td style={{ color: '#64748b' }}>{l.owner || 'Unknown'}</td>
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