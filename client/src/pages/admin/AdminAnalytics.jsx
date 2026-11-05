import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import AdminSidebar from './AdminSidebar';

const analyticsCache = {};

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const [data, setData] = useState(analyticsCache['30'] || null);
  const [loading, setLoading] = useState(!analyticsCache['30']);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    if (analyticsCache[period]) {
      setData(analyticsCache[period]);
      setLoading(false);
    } else {
      setLoading(true);
    }
    API.get(`/admin/analytics?period=${period}`)
      .then(res => {
        analyticsCache[period] = res.data;
        setData(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const { overview, stats, charts } = data || {};

  const statCards = [
    {
      label: 'Total Users',
      value: overview?.totalUsers || 0,
      badge: `+${stats?.newUsers || 0} new`,
      icon: 'fa-users',
      color: '#818cf8',
      bg: 'linear-gradient(135deg, rgba(129,140,248,0.2), rgba(129,140,248,0.05))',
    },
    {
      label: 'Total Listings',
      value: overview?.totalListings || 0,
      badge: `+${stats?.newListings || 0} new`,
      icon: 'fa-building',
      color: '#34d399',
      bg: 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(52,211,153,0.05))',
    },
    {
      label: 'Total Bookings',
      value: overview?.totalBookings || 0,
      badge: `+${stats?.newBookings || 0} new`,
      icon: 'fa-calendar-check',
      color: '#f472b6',
      bg: 'linear-gradient(135deg, rgba(244,114,182,0.2), rgba(244,114,182,0.05))',
    },
    {
      label: 'Total Revenue',
      value: '₹' + (overview?.totalRevenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 }),
      badge: 'Platform Volume',
      icon: 'fa-rupee-sign',
      color: '#60a5fa',
      bg: 'linear-gradient(135deg, rgba(96,165,250,0.2), rgba(96,165,250,0.05))',
    },
    {
      label: 'Total Hosts',
      value: overview?.totalHosts || 0,
      badge: 'Verified partners',
      icon: 'fa-user-shield',
      color: '#fbbf24',
      bg: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(251,191,36,0.05))',
    },
  ];

  return (
    <div className="admin-layout admin-dark">
      <AdminSidebar />

      <div className="admin-content">
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
                <i className="fa-solid fa-chart-line" style={{ color: '#818cf8', marginRight: '0.6rem', fontSize: '1.4rem' }}></i>
                Analytics & Insights
              </h1>
            </div>
            <p>High-level platform metrics, reservation volumes, and revenue distribution over time.</p>
          </div>
          <div className="admin-header-actions-dark">
            <div className="admin-analytics-tabs">
              {[
                { id: '7', label: 'Last 7 Days' },
                { id: '30', label: 'Last 30 Days' },
                { id: '90', label: 'Last 90 Days' },
                { id: '365', label: 'Last 1 Year' },
              ].map(p => (
                <button
                  key={p.id}
                  className={`admin-analytics-tab ${period === p.id ? 'active' : ''}`}
                  onClick={() => setPeriod(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading-container">
            <div className="admin-spinner"></div>
            <div className="admin-loading-text">Loading platform metrics...</div>
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="admin-stat-cards-dark" style={{ marginBottom: '1.5rem' }}>
              {statCards.map((stat, i) => (
                <div key={i} className="admin-stat-card-dark">
                  <div className="admin-stat-card-dark-top">
                    <div className="admin-stat-card-dark-icon" style={{ background: stat.bg, color: stat.color }}>
                      <i className={`fa-solid ${stat.icon}`}></i>
                    </div>
                    <span className="admin-stat-change up" style={{ fontSize: '0.68rem' }}>
                      {stat.badge}
                    </span>
                  </div>
                  <div className="admin-stat-card-dark-value">{stat.value}</div>
                  <div className="admin-stat-card-dark-label">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Charts Row */}
            <div className="admin-grid-2">
              {/* Monthly Revenue Bar Chart */}
              <div className="admin-card-dark">
                <div className="admin-card-dark-header">
                  <h3>
                    <i className="fa-solid fa-chart-column" style={{ color: '#818cf8', marginRight: '0.5rem', fontSize: '0.9rem' }}></i>
                    Monthly Revenue Trend
                  </h3>
                </div>
                <div style={{ padding: '1.5rem' }}>
                  {charts?.monthlyRevenue?.length > 0 ? (
                    (() => {
                      const maxRev = Math.max(...charts.monthlyRevenue.map(m => m.revenue || 0), 1);
                      return (
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', height: 180, paddingTop: '1.5rem' }}>
                          {charts.monthlyRevenue.map((m, i) => {
                            const pct = Math.max(8, Math.round(((m.revenue || 0) / maxRev) * 100));
                            return (
                              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                                <div style={{ fontSize: '0.65rem', color: '#818cf8', fontWeight: 600, marginBottom: '0.3rem' }}>
                                  ₹{m.revenue ? (m.revenue >= 1000 ? `${(m.revenue / 1000).toFixed(0)}k` : m.revenue) : '0'}
                                </div>
                                <div
                                  style={{
                                    width: '100%',
                                    background: 'linear-gradient(180deg, #818cf8 0%, rgba(99, 102, 241, 0.4) 100%)',
                                    borderRadius: '6px 6px 0 0',
                                    height: `${pct}%`,
                                    transition: 'height 0.4s ease',
                                  }}
                                  title={`${m.name || 'Month ' + m.month}: ₹${(m.revenue || 0).toLocaleString('en-IN')}`}
                                />
                                <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.5rem', fontWeight: 600 }}>
                                  {m.name || `M${m.month}`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()
                  ) : (
                    <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94a3b8' }}>
                      <i className="fa-solid fa-chart-line" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block' }}></i>
                      No revenue data recorded for this duration
                    </div>
                  )}
                </div>
              </div>

              {/* Bookings by Status */}
              <div className="admin-card-dark">
                <div className="admin-card-dark-header">
                  <h3>
                    <i className="fa-solid fa-pie-chart" style={{ color: '#059669', marginRight: '0.5rem', fontSize: '0.9rem' }}></i>
                    Bookings Breakdown by Status
                  </h3>
                </div>
                <div style={{ padding: '1.5rem' }}>
                  {Object.keys(charts?.bookingsByStatus || {}).length > 0 ? (
                    Object.entries(charts?.bookingsByStatus || {}).map(([status, count], i) => {
                      const totalB = overview?.totalBookings || 1;
                      const pct = Math.round((count / totalB) * 100);
                      const color = status === 'confirmed' ? '#059669' : status === 'pending' ? '#d97706' : '#dc2626';
                      return (
                        <div key={status} style={{ marginBottom: '1.2rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }}></span>
                              <span style={{ textTransform: 'capitalize', fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>
                                {status.replace('_', ' ')}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                              <strong style={{ color: '#0f172a', marginRight: '0.3rem' }}>{count}</strong> ({pct}%)
                            </span>
                          </div>
                          <div style={{ width: '100%', height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.4s' }}></div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94a3b8' }}>
                      No booking status metrics available
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tables Row: Top Locations + Top Listings */}
            <div className="admin-grid-2">
              <div className="admin-card-dark">
                <div className="admin-card-dark-header">
                  <h3>
                    <i className="fa-solid fa-map-pin" style={{ color: '#ec4899', marginRight: '0.5rem', fontSize: '0.9rem' }}></i>
                    Top Property Locations
                  </h3>
                </div>
                <div className="admin-table-container">
                  <table className="admin-table-dark admin-table-compact">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Location</th>
                        <th style={{ textAlign: 'right' }}>Listings Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(charts?.topLocations || []).length === 0 ? (
                        <tr><td colSpan={3} className="admin-td-muted" style={{ textAlign: 'center', padding: '1.5rem' }}>No location data</td></tr>
                      ) : (
                        (charts?.topLocations || []).map((l, i) => (
                          <tr key={l.location || i}>
                            <td style={{ fontWeight: 600, color: '#94a3b8', width: '40px' }}>{i + 1}</td>
                            <td style={{ fontWeight: 600, color: '#0f172a' }}>
                              <i className="fa-solid fa-location-dot" style={{ fontSize: '0.7rem', color: '#0066ff', marginRight: '0.4rem' }}></i>
                              {l.location || l._id || '-'}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <span className="admin-badge admin-badge-neutral">{l.count} properties</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="admin-card-dark">
                <div className="admin-card-dark-header">
                  <h3>
                    <i className="fa-solid fa-trophy" style={{ color: '#d97706', marginRight: '0.5rem', fontSize: '0.9rem' }}></i>
                    Most Popular Listings
                  </h3>
                </div>
                <div className="admin-table-container">
                  <table className="admin-table-dark admin-table-compact">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Title</th>
                        <th>Location</th>
                        <th>Host</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(charts?.topListings || []).length === 0 ? (
                        <tr><td colSpan={4} className="admin-td-muted" style={{ textAlign: 'center', padding: '1.5rem' }}>No top listings data</td></tr>
                      ) : (
                        (charts?.topListings || []).map((l, i) => (
                          <tr key={l._id || i}>
                            <td style={{ fontWeight: 600, color: '#94a3b8', width: '40px' }}>{i + 1}</td>
                            <td style={{ fontWeight: 600, color: '#0f172a', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.title}>
                              {l.title || 'Untitled'}
                            </td>
                            <td className="admin-td-muted">{l.location || 'N/A'}</td>
                            <td style={{ color: '#0066ff', fontSize: '0.82rem', fontWeight: 600 }}>@{l.owner || 'Unknown'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
