import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import FlashMessage from '../../components/FlashMessage';

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    API.get('/admin/bookings')
      .then(res => setBookings(res.data.bookings || []))
      .catch(err => setError(err.response?.data?.error || 'Failed to load bookings'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this booking?')) return;
    try {
      await API.delete(`/admin/bookings/${id}`);
      setBookings(prev => prev.filter(b => b._id !== id));
      setSuccess('Booking deleted');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete booking');
    }
  };

  const filtered = bookings.filter(b =>
    b.listing?.title?.toLowerCase().includes(search.toLowerCase()) ||
    b.user?.username?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading-spinner" />;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link to="/admin">Dashboard</Link>
        <Link to="/admin/users">Users</Link>
        <Link to="/admin/listings">Listings</Link>
        <Link to="/admin/bookings" className="active">Bookings</Link>
        <Link to="/admin/reviews">Reviews</Link>
      </aside>
      <div className="admin-content">
        {error && <FlashMessage message={error} type="error" />}
        {success && <FlashMessage message={success} type="success" />}
        <div className="page-header">
          <h1>Manage Bookings</h1>
          <input type="text" className="form-control" placeholder="Search bookings..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Listing</th><th>Guest</th><th>Check-in</th><th>Check-out</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b._id}>
                  <td>{b.listing?.title || 'N/A'}</td>
                  <td>@{b.user?.username || 'N/A'}</td>
                  <td>{new Date(b.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td>{new Date(b.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td>₹{b.totalPrice?.toLocaleString('en-IN')}</td>
                  <td><span className={`badge status-${b.status}`}>{b.status}</span></td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => handleDelete(b._id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
