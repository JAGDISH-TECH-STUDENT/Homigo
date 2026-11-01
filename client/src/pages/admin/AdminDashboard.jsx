import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/useAuth';
import AdminSidebar from './AdminSidebar';
import AdminNotifications from './AdminNotifications';

let dashboardCache = null;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(dashboardCache);
  const [loading, setLoading] = useState(!dashboardCache);
  const [analyticsRange, setAnalyticsRange] = useState('7D');
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const { user } = useAuth();
  const canvasRef = useRef(null);
  const chartCanvasRef = useRef(null);

  useEffect(() => {
    API.get('/admin/dashboard')
      .then(res => {
        dashboardCache = res.data;
        setData(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Draw the donut chart for User Type
  useEffect(() => {
    if (!data || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const size = 120;
    canvas.width = size * 2;
    canvas.height = size * 2;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(2, 2);

    const total = (data.guests || 0) + (data.hosts || 0) + (data.admins || 0);
    const segments = [
      { value: data.guests || 0, color: '#818cf8' },
      { value: data.hosts || 0, color: '#34d399' },
      { value: data.admins || 0, color: '#fbbf24' },
    ];

    const cx = size / 2, cy = size / 2, r = 44, lineWidth = 12;
    let startAngle = -Math.PI / 2;

    // Background circle
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    segments.forEach(seg => {
      if (seg.value === 0) return;
      const sliceAngle = (seg.value / (total || 1)) * 2 * Math.PI;
      ctx.beginPath();
      ctx.arc(cx, cy, r, startAngle, startAngle + sliceAngle);
      ctx.strokeStyle = seg.color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.stroke();
      startAngle += sliceAngle;
    });

    // Center text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Plus Jakarta Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(total, cx, cy - 6);
    ctx.font = '10px Plus Jakarta Sans, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('Total', cx, cy + 10);
  }, [data]);

  const currentRangeData = data?.platformAnalytics?.[analyticsRange] || {
    revenue: data?.totalRevenue ?? 0,
    change: '+0%',
    isUp: true,
    points: []
  };

  const points = (currentRangeData.points && currentRangeData.points.length > 0)
    ? currentRangeData.points
    : Array.from({ length: 7 }, (_, i) => {
        const d = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
        return {
          label: d.toLocaleDateString('en-US', { weekday: 'short' }),
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          value: 0
        };
      });

  const currentRevenue = currentRangeData.revenue ?? (data?.totalRevenue ?? 0);

  const activeIdx = hoveredIndex !== null && hoveredIndex >= 0 && hoveredIndex < points.length
    ? hoveredIndex
    : (points.length > 0 ? points.reduce((maxIdx, p, idx, arr) => p.value > arr[maxIdx].value ? idx : maxIdx, 0) : null);

  const activePoint = activeIdx !== null ? points[activeIdx] : null;

  const handleChartMouseMove = (e) => {
    if (!chartCanvasRef.current || points.length === 0) return;
    const rect = chartCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const w = rect.width;
    const stepX = w / (points.length - 1);
    const idx = Math.min(Math.max(0, Math.round(x / stepX)), points.length - 1);
    setHoveredIndex(idx);
  };

  const activeTooltipPos = (() => {
    if (activeIdx === null || points.length === 0) return { x: 0, y: 0 };
    const containerWidth = chartCanvasRef.current?.clientWidth || 280;
    const w = Math.max(containerWidth, 240);
    const h = 85;
    const values = points.map(p => p.value);
    const maxVal = Math.max(...values, 100);
    const stepX = w / (points.length - 1);
    const padding = 10;
    const x = activeIdx * stepX;
    const y = h - padding - ((points[activeIdx].value / maxVal) * (h - padding * 2));
    return { x: Math.min(Math.max(x, 55), w - 55), y: Math.max(y - 6, 18) };
  })();

  // Draw sparkline / area chart for revenue
  useEffect(() => {
    if (!chartCanvasRef.current || points.length === 0) return;
    const canvas = chartCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const containerWidth = canvas.parentElement?.clientWidth || 280;
    const w = Math.max(containerWidth, 240);
    const h = 85;
    canvas.width = w * 2;
    canvas.height = h * 2;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(2, 2);

    const values = points.map(p => p.value);
    const maxVal = Math.max(...values, 100);
    const stepX = w / (points.length - 1);
    const padding = 10;

    // Draw gradient area
    ctx.beginPath();
    ctx.moveTo(0, h);
    points.forEach((p, i) => {
      const x = i * stepX;
      const y = h - padding - ((p.value / maxVal) * (h - padding * 2));
      if (i === 0) ctx.lineTo(x, y);
      else {
        const prevX = (i - 1) * stepX;
        const prevY = h - padding - ((points[i - 1].value / maxVal) * (h - padding * 2));
        const cpX = (prevX + x) / 2;
        ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
      }
    });
    ctx.lineTo(w, h);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(99, 102, 241, 0.35)');
    grad.addColorStop(1, 'rgba(99, 102, 241, 0.02)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    points.forEach((p, i) => {
      const x = i * stepX;
      const y = h - padding - ((p.value / maxVal) * (h - padding * 2));
      if (i === 0) ctx.moveTo(x, y);
      else {
        const prevX = (i - 1) * stepX;
        const prevY = h - padding - ((points[i - 1].value / maxVal) * (h - padding * 2));
        const cpX = (prevX + x) / 2;
        ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
      }
    });
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Draw active point with glow
    if (activeIdx !== null && activeIdx >= 0 && activeIdx < points.length) {
      const curX = activeIdx * stepX;
      const curY = h - padding - ((points[activeIdx].value / maxVal) * (h - padding * 2));

      ctx.beginPath();
      ctx.arc(curX, curY, 8, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(129, 140, 248, 0.35)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(curX, curY, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [points, activeIdx, analyticsRange]);

  if (loading) {
    return (
      <div className="admin-layout admin-dark">
        <AdminSidebar />
        <div className="admin-content">
          <div className="admin-loading-container">
            <div className="admin-spinner"></div>
            <div className="admin-loading-text">Loading dashboard metrics...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="admin-layout admin-dark">
        <AdminSidebar />
        <div className="admin-content">
          <div className="admin-loading-container">
            <h2 style={{ color: '#fff' }}>Access denied</h2>
          </div>
        </div>
      </div>
    );
  }

  const totalUsers = (data.guests || 0) + (data.hosts || 0) + (data.admins || 0) || data.totalUsers || 1;
  const guestPct = totalUsers > 0 ? Math.round(((data.guests || 0) / totalUsers) * 100) : 0;
  const hostPct = totalUsers > 0 ? Math.round(((data.hosts || 0) / totalUsers) * 100) : 0;
  const adminPct = totalUsers > 0 ? Math.max(0, 100 - guestPct - hostPct) : 0;

  const statCards = [
    { label: 'Total Users', value: data.totalUsers, icon: 'fa-users', color: '#818cf8', bg: 'linear-gradient(135deg, rgba(129,140,248,0.2), rgba(129,140,248,0.05))', change: '+12%', up: true },
    { label: 'Total Listings', value: data.totalListings, icon: 'fa-building', color: '#34d399', bg: 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(52,211,153,0.05))', change: '+0%', up: true },
    { label: 'Total Bookings', value: data.totalBookings, icon: 'fa-calendar-check', color: '#f472b6', bg: 'linear-gradient(135deg, rgba(244,114,182,0.2), rgba(244,114,182,0.05))', change: '-50%', up: false },
    { label: 'Total Reviews', value: data.totalReviews, icon: 'fa-star', color: '#fbbf24', bg: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(251,191,36,0.05))', change: '+50%', up: true },
    { label: 'Avg. Price/Night', value: '₹' + (data.avgListingPrice || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 }), icon: 'fa-rupee-sign', color: '#60a5fa', bg: 'linear-gradient(135deg, rgba(96,165,250,0.2), rgba(96,165,250,0.05))', change: '+8%', up: true },
  ];

  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';
  const avatarColors = ['#818cf8', '#f472b6', '#34d399', '#fbbf24', '#60a5fa', '#f97316'];
  const getAvatarColor = (name) => avatarColors[(name || '').charCodeAt(0) % avatarColors.length];

  const formatJoined = (dStr) => {
    if (!dStr) return <span className="admin-td-muted">N/A</span>;
    const d = new Date(dStr);
    const datePart = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const yearPart = d.getFullYear();
    const timePart = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    return (
      <div className="admin-joined-cell">
        <div className="admin-joined-date">{datePart}</div>
        <div className="admin-joined-time">{yearPart}, {timePart}</div>
      </div>
    );
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="admin-layout admin-dark">
      <AdminSidebar stats={data} />

      {/* Main Content */}
      <div className="admin-content">
        {/* Top Bar */}
        <div className="admin-topbar">
          <div>
            <button
              type="button"
              className="admin-back-btn"
              onClick={() => {
                navigate('/');
              }}
              title="Go back to website"
            >
              <i className="fa-solid fa-arrow-left"></i>
              <span>Back</span>
            </button>
          </div>
          <div className="admin-topbar-right">
            <AdminNotifications />
            <div className="admin-topbar-user">
              <div className="admin-user-avatar-sm">{getInitial(user?.username)}</div>
              <span>{user?.username || 'Admin'}</span>
              <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.65rem' }}></i>
            </div>
          </div>
        </div>

        {/* Welcome Banner */}
        <div className="admin-welcome">
          <div>
            <h1>👋 Welcome back, <span className="admin-welcome-name">{user?.username || 'Admin'}</span>!</h1>
            <p>Here's what's happening with Homigo today.</p>
          </div>
          <div className="admin-welcome-date">
            <i className="fa-regular fa-calendar"></i> {dateStr}
          </div>
        </div>

        {/* Stat Cards */}
        <div className="admin-stat-cards-dark">
          {statCards.map((stat, i) => (
            <div key={i} className="admin-stat-card-dark">
              <div className="admin-stat-card-dark-top">
                <div className="admin-stat-card-dark-icon" style={{ background: stat.bg, color: stat.color }}>
                  <i className={`fa-solid ${stat.icon}`}></i>
                </div>
                <span className={`admin-stat-change ${stat.up ? 'up' : 'down'}`}>
                  <i className={`fa-solid ${stat.up ? 'fa-arrow-up' : 'fa-arrow-down'}`}></i> {stat.change}
                </span>
              </div>
              <div className="admin-stat-card-dark-value">{stat.value}</div>
              <div className="admin-stat-card-dark-label">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tables Row: Recent Users + Recent Listings */}
        <div className="admin-grid-2">
          {/* Recent Users */}
          <div className="admin-card-dark">
            <div className="admin-card-dark-header">
              <h3>
                <i className="fa-solid fa-users" style={{ color: '#818cf8', marginRight: '0.5rem', fontSize: '0.9rem' }}></i>
                Recent Users
              </h3>
              <Link to="/admin/users" className="admin-view-all">View All <i className="fa-solid fa-arrow-right"></i></Link>
            </div>
            <div className="admin-table-container">
              <table className="admin-table-dark">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th style={{ minWidth: '110px' }}>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.recentUsers || []).map(u => (
                    <tr key={u._id}>
                      <td>
                        <div className="admin-user-cell">
                          <div className="admin-avatar-circle" style={{ background: getAvatarColor(u.username) }}>
                            {getInitial(u.username)}
                          </div>
                          <span style={{ fontWeight: 500 }}>{u.username}</span>
                        </div>
                      </td>
                      <td>
                        <div className="admin-td-muted admin-cell-truncate" title={u.email}>{u.email}</div>
                      </td>
                      <td>
                        <span className={`admin-role-badge ${u.role === 'admin' ? 'role-admin' : u.role === 'host' ? 'role-host' : 'role-guest'}`}>
                          {u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : 'Guest'}
                        </span>
                      </td>
                      <td>
                        {formatJoined(u.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Listings */}
          <div className="admin-card-dark">
            <div className="admin-card-dark-header">
              <h3>
                <i className="fa-solid fa-house" style={{ color: '#60a5fa', marginRight: '0.5rem', fontSize: '0.9rem' }}></i>
                Recent Listings
              </h3>
              <Link to="/admin/listings" className="admin-view-all">View All <i className="fa-solid fa-arrow-right"></i></Link>
            </div>
            <div className="admin-listings-list">
              {(data.recentListings || []).map(l => (
                <div key={l._id} className="admin-listing-row">
                  <div className="admin-listing-thumb">
                    {l.image?.url ? (
                      <img src={l.image.url} alt={l.title} />
                    ) : (
                      <div className="admin-listing-thumb-placeholder">
                        <i className="fa-solid fa-image"></i>
                      </div>
                    )}
                  </div>
                  <div className="admin-listing-info">
                    <strong>{l.title}</strong>
                    <span>
                      <i className="fa-solid fa-location-dot" style={{ fontSize: '0.65rem', marginRight: '0.3rem', opacity: 0.7 }}></i>
                      {l.location}{l.country ? ', ' + l.country : ''}
                    </span>
                  </div>
                  <div className="admin-listing-price">₹{l.price?.toLocaleString('en-IN')}</div>
                  <div className="admin-listing-rating">
                    <i className="fa-solid fa-star"></i> {l.avgRating ? l.avgRating.toFixed(1) : 'N/A'}
                    <span>({l.reviewsCount || 0})</span>
                  </div>
                  <span className="admin-active-badge">Active</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Row: Top Rated + Platform Analytics */}
        <div className="admin-grid-2">
          {/* Top Rated Listings */}
          <div className="admin-card-dark">
            <div className="admin-card-dark-header">
              <h3>
                <i className="fa-solid fa-trophy" style={{ color: '#fbbf24', marginRight: '0.5rem', fontSize: '0.9rem' }}></i>
                Top Rated Listings
              </h3>
              <Link to="/admin/listings" className="admin-view-all">View All <i className="fa-solid fa-arrow-right"></i></Link>
            </div>
            <div className="admin-table-container">
              <table className="admin-table-dark admin-table-compact">
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
                      <td style={{ fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>{i + 1}</td>
                      <td style={{ fontWeight: 500 }}>{l.title}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <i className="fa-solid fa-star" style={{ color: '#fbbf24', fontSize: '0.7rem' }}></i>
                          {l.avgRating ? l.avgRating.toFixed(1) : 'N/A'}
                        </div>
                      </td>
                      <td className="admin-td-muted">{l.reviewsCount || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Platform Analytics */}
          <div className="admin-card-dark">
            <div className="admin-card-dark-header">
              <h3>
                <i className="fa-solid fa-chart-simple" style={{ color: '#34d399', marginRight: '0.5rem', fontSize: '0.9rem' }}></i>
                Platform Analytics
              </h3>
              <div className="admin-analytics-tabs">
                {['7D', '30D', '3M', '1Y'].map(range => (
                  <button
                    key={range}
                    className={`admin-analytics-tab ${analyticsRange === range ? 'active' : ''}`}
                    onClick={() => {
                      setAnalyticsRange(range);
                      setHoveredIndex(null);
                    }}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            <div className="admin-analytics-content">
              <div className="admin-analytics-revenue">
                <span className="admin-analytics-label">Total Revenue ({analyticsRange})</span>
                <div className="admin-analytics-value">₹{currentRevenue.toLocaleString('en-IN')}</div>
                <span className={`admin-stat-change ${currentRangeData?.isUp !== false ? 'up' : 'down'}`} style={{ fontSize: '0.75rem' }}>
                  <i className={`fa-solid ${currentRangeData?.isUp !== false ? 'fa-arrow-up' : 'fa-arrow-down'}`}></i> {currentRangeData?.change || '+8.5%'} vs last period
                </span>
                
                <div className="admin-chart-wrapper" style={{ position: 'relative', marginTop: '0.75rem' }}>
                  <canvas 
                    ref={chartCanvasRef} 
                    className="admin-revenue-chart"
                    onMouseMove={handleChartMouseMove}
                    onMouseLeave={() => setHoveredIndex(null)}
                    style={{ cursor: 'crosshair', width: '100%' }}
                  ></canvas>
                  {activePoint && (
                    <div 
                      className="admin-chart-tooltip"
                      style={{ 
                        left: `${activeTooltipPos.x}px`, 
                        top: `${activeTooltipPos.y}px` 
                      }}
                    >
                      <strong>₹{(activePoint.value || 0).toLocaleString('en-IN')}</strong>
                      <span>{activePoint.date}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="admin-analytics-users">
                <span className="admin-analytics-label" style={{ marginBottom: '0.75rem', display: 'block' }}>User Type</span>
                <canvas ref={canvasRef} className="admin-donut-chart"></canvas>
                <div className="admin-donut-legend">
                  <div>
                    <span className="admin-legend-dot" style={{ background: '#818cf8' }}></span>
                    Guests <strong>{guestPct}% ({data.guests || 0})</strong>
                  </div>
                  <div>
                    <span className="admin-legend-dot" style={{ background: '#34d399' }}></span>
                    Hosts <strong>{hostPct}% ({data.hosts || 0})</strong>
                  </div>
                  {(data.admins || 0) > 0 && (
                    <div>
                      <span className="admin-legend-dot" style={{ background: '#fbbf24' }}></span>
                      Admins <strong>{adminPct}% ({data.admins || 0})</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
