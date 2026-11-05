import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import Notifications from './Notifications';

const CATEGORIES = [
  'All',
  'Trending',
  'Rooms',
  'Iconic cities',
  'Mountains',
  'Castles',
  'Amazing pools',
  'Camping',
  'Farms',
  'Arctic',
  'Domes',
  'Boats',
];

export default function Navbar() {
  const { user, logout, upgradeToHost } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdown(false);
      }
    };
    if (userDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userDropdown]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (category && category !== 'All') params.set('category', category);
    if (minPrice) params.set('minPrice', minPrice);
    navigate(`/listings/search?${params.toString()}`);
    setMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setUserDropdown(false);
    navigate('/');
    setMenuOpen(false);
  };

  const handleBecomeHost = async () => {
    try {
      await upgradeToHost();
      navigate('/host/dashboard');
    } finally {
      setUserDropdown(false);
      setMenuOpen(false);
    }
  };

  const userInitial = user?.username ? user.username.charAt(0).toUpperCase() : 'U';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand Logo */}
        <Link to="/" className="navbar-brand">
          <i className="fa-solid fa-house-chimney"></i>
          Homigo<span>.</span>
        </Link>

        {/* Center Pill Search Bar */}
        <form className="navbar-search-pill" onSubmit={handleSearch}>
          <i className="fa-solid fa-magnifying-glass search-icon-left"></i>
          <input
            type="text"
            placeholder="Search destinations..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <div className="pill-divider" />
          <select value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="pill-divider" />
          <input
            type="number"
            placeholder="Min ₹"
            value={minPrice}
            onChange={e => setMinPrice(e.target.value)}
            className="min-price-input"
          />
          <button type="submit" className="pill-search-btn" title="Search">
            <i className="fa-solid fa-magnifying-glass"></i>
          </button>
        </form>

        {/* Mobile menu toggle */}
        <button
          className="navbar-toggler"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          &#9776;
        </button>

        {/* Right Navigation Actions */}
        <div className={`navbar-links${menuOpen ? ' open' : ''}`}>
          {user ? (
            <>
              {/* Host CTA for guests */}
              {(user.role === 'guest' || !user.role) && (
                <button type="button" className="navbar-host-link" onClick={handleBecomeHost}>
                  Become a Host
                </button>
              )}

              {/* Notifications Component */}
              <Notifications />

              {/* User Avatar & Name Dropdown */}
              <div className="navbar-dropdown-wrapper" ref={dropdownRef}>
                <div
                  className="navbar-user-pill"
                  onClick={() => setUserDropdown(prev => !prev)}
                  title="Account menu"
                  role="button"
                  tabIndex={0}
                >
                  <div className="navbar-user-avatar">{userInitial}</div>
                  <span className="navbar-user-name">
                    {user.username}
                  </span>
                  <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.65rem', color: '#64748b' }}></i>
                </div>

                {userDropdown && (
                  <div className="navbar-dropdown-menu">
                    {/* User profile header */}
                    <div className="dropdown-user-header">
                      <div className="dropdown-user-avatar">{userInitial}</div>
                      <div className="dropdown-user-info">
                        <strong className="dropdown-user-name">{user.username}</strong>
                        <span className={`dropdown-role-badge role-${user.role || 'guest'}`}>
                          {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Guest'}
                        </span>
                      </div>
                    </div>

                    <div className="dropdown-divider"></div>

                    {/* Guest Options */}
                    {(user.role === 'guest' || !user.role) && (
                      <>
                        <Link
                          to="/favorites"
                          className="dropdown-menu-item"
                          onClick={() => { setUserDropdown(false); setMenuOpen(false); }}
                        >
                          <i className="fa-regular fa-heart"></i>
                          <span>Favorites</span>
                        </Link>
                        <Link
                          to="/bookings"
                          className="dropdown-menu-item"
                          onClick={() => { setUserDropdown(false); setMenuOpen(false); }}
                        >
                          <i className="fa-solid fa-calendar-check"></i>
                          <span>My Bookings</span>
                        </Link>
                        <button
                          type="button"
                          className="dropdown-menu-item"
                          onClick={handleBecomeHost}
                        >
                          <i className="fa-solid fa-house-chimney-medical"></i>
                          <span>Become a Host</span>
                        </button>
                      </>
                    )}

                    {/* Host Options */}
                    {user.role === 'host' && (
                      <>
                        <Link
                          to="/host/dashboard"
                          className="dropdown-menu-item"
                          onClick={() => { setUserDropdown(false); setMenuOpen(false); }}
                        >
                          <i className="fa-solid fa-chart-pie"></i>
                          <span>Host Hub</span>
                        </Link>
                        <Link
                          to="/host/listings"
                          className="dropdown-menu-item"
                          onClick={() => { setUserDropdown(false); setMenuOpen(false); }}
                        >
                          <i className="fa-solid fa-house"></i>
                          <span>My Listings</span>
                        </Link>
                      </>
                    )}

                    {/* Admin Options */}
                    {user.role === 'admin' && (
                      <>
                        <Link
                          to="/admin"
                          className="dropdown-menu-item"
                          onClick={() => { setUserDropdown(false); setMenuOpen(false); }}
                        >
                          <i className="fa-solid fa-gauge-high"></i>
                          <span>Admin Dashboard</span>
                        </Link>
                        <Link
                          to="/admin/listings"
                          className="dropdown-menu-item"
                          onClick={() => { setUserDropdown(false); setMenuOpen(false); }}
                        >
                          <i className="fa-solid fa-hotel"></i>
                          <span>Manage Listings</span>
                        </Link>
                        <Link
                          to="/admin/users"
                          className="dropdown-menu-item"
                          onClick={() => { setUserDropdown(false); setMenuOpen(false); }}
                        >
                          <i className="fa-solid fa-users"></i>
                          <span>Manage Users</span>
                        </Link>
                        <Link
                          to="/admin/bookings"
                          className="dropdown-menu-item"
                          onClick={() => { setUserDropdown(false); setMenuOpen(false); }}
                        >
                          <i className="fa-solid fa-calendar-check"></i>
                          <span>All Bookings</span>
                        </Link>
                      </>
                    )}

                    <div className="dropdown-divider"></div>

                    {/* Logout Option */}
                    <button
                      type="button"
                      className="dropdown-menu-item logout"
                      onClick={handleLogout}
                    >
                      <i className="fa-solid fa-arrow-right-from-bracket"></i>
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button type="button" className="navbar-host-link" onClick={() => navigate('/login')}>
                Become a Host
              </button>
              <Link to="/login" className="navbar-login-link" onClick={() => setMenuOpen(false)}>
                Login
              </Link>
              <Link to="/signup" className="btn btn-primary btn-sm" onClick={() => setMenuOpen(false)} style={{ borderRadius: 9999, padding: '0.5rem 1.25rem' }}>
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
