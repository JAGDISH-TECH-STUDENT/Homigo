import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (category && category !== 'All') params.set('category', category);
    navigate(`/listings/search?${params.toString()}`);
    setMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">Homigo</Link>

        <form className="navbar-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search destinations..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <select value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary">Search</button>
        </form>

        <button
          className="navbar-toggler"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          &#9776;
        </button>

        <div className={`navbar-links${menuOpen ? ' open' : ''}`}>
          {user ? (
            <>
              <Link to="/favorites" onClick={() => setMenuOpen(false)}>Favorites</Link>
              <Link to="/bookings" onClick={() => setMenuOpen(false)}>My Bookings</Link>
              {user.role === 'host' && (
                <>
                  <Link to="/host/listings" onClick={() => setMenuOpen(false)}>My Listings</Link>
                  <Link to="/host/dashboard" onClick={() => setMenuOpen(false)}>Host Dashboard</Link>
                </>
              )}
              {user.role === 'admin' && (
                <Link to="/admin" onClick={() => setMenuOpen(false)}>Admin Dashboard</Link>
              )}
              <span className="navbar-user">{user.username}</span>
              <button className="btn btn-secondary btn-sm" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/signup" onClick={() => setMenuOpen(false)}>Signup</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
