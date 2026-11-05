import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import API from '../../api/axios';

const navItems = [
  { path: '/admin', icon: 'fa-gauge-high', label: 'Dashboard', exact: true },
  { path: '/admin/users', icon: 'fa-users', label: 'Users' },
  { path: '/admin/listings', icon: 'fa-building', label: 'Listings' },
  { path: '/admin/bookings', icon: 'fa-calendar-check', label: 'Bookings' },
  { path: '/admin/reviews', icon: 'fa-star', label: 'Reviews' },
  { path: '/admin/analytics', icon: 'fa-chart-line', label: 'Analytics' },
  { path: '/admin/complaints', icon: 'fa-headset', label: 'Complaints' },
];

let globalStatsCache = null;
let statsFetchPromise = null;

export default function AdminSidebar({ stats: propStats }) {
  const location = useLocation();
  const { user } = useAuth();
  const [stats, setStats] = useState(propStats || globalStatsCache || null);

  useEffect(() => {
    if (propStats) {
      globalStatsCache = propStats;
      setStats(propStats);
      return;
    }
    if (globalStatsCache) {
      setStats(globalStatsCache);
      return;
    }
    if (!statsFetchPromise) {
      statsFetchPromise = API.get('/admin/dashboard')
        .then(res => {
          globalStatsCache = res.data;
          setStats(res.data);
          return res.data;
        })
        .catch(() => {})
        .finally(() => {
          statsFetchPromise = null;
        });
    }
  }, [propStats]);

  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : 'A';

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  return (
    <aside className="admin-sidebar">
      <Link to="/admin" className="admin-sidebar-brand">
        <i className="fa-solid fa-house-chimney"></i>
        <span className="brand-text">Homigo<span className="brand-accent">Admin</span></span>
      </Link>

      <nav className="admin-nav">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`admin-nav-item ${isActive(item) ? 'active' : ''}`}
          >
            <i className={`fa-solid ${item.icon}`}></i> {item.label}
          </Link>
        ))}
      </nav>

      {/* Quick stats section */}
      <div className="admin-sidebar-quickstats">
        <div className="admin-sidebar-section">Quick Stats</div>
        <div className="admin-quickstat-row">
          <span>
            <i className="fa-solid fa-circle" style={{ color: '#fbbf24', fontSize: '0.45rem', marginRight: '0.5rem' }}></i>
            Active Listings
          </span>
          <strong style={{ color: '#fbbf24' }}>{stats?.activeListings ?? 3}</strong>
        </div>
        <div className="admin-quickstat-row">
          <span>
            <i className="fa-solid fa-circle" style={{ color: '#34d399', fontSize: '0.45rem', marginRight: '0.5rem' }}></i>
            Confirmed Bookings
          </span>
          <strong style={{ color: '#34d399' }}>{stats?.confirmedBookings ?? 0}</strong>
        </div>
        <div className="admin-quickstat-row">
          <span>
            <i className="fa-solid fa-circle" style={{ color: '#60a5fa', fontSize: '0.45rem', marginRight: '0.5rem' }}></i>
            Total Revenue
          </span>
          <strong style={{ color: '#60a5fa' }}>₹{(stats?.totalRevenue ?? 0).toLocaleString('en-IN')}</strong>
        </div>
      </div>

      {/* Grow your business CTA */}
      <div className="admin-sidebar-cta">
        <div className="admin-cta-content">
          <div className="admin-cta-icon">🚀</div>
          <strong>Grow Your Business</strong>
          <p>Manage bookings &amp; monitor growth easily.</p>
          <Link to="/admin/analytics" className="admin-cta-btn">
            View Reports <i className="fa-solid fa-arrow-right"></i>
          </Link>
        </div>
      </div>

      {/* User profile at bottom */}
      <div className="admin-sidebar-user">
        <div className="admin-user-avatar">{getInitial(user?.username)}</div>
        <div className="admin-user-info">
          <span>Welcome back,</span>
          <strong>{user?.username || 'Admin'}</strong>
        </div>
        <i className="fa-solid fa-chevron-down" style={{ color: '#94a3b8', fontSize: '0.7rem' }}></i>
      </div>
    </aside>
  );
}
