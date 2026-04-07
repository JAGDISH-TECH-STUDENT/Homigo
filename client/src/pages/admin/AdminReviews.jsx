import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import FlashMessage from '../../components/FlashMessage';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    API.get('/admin/reviews')
      .then(res => {
        setReviews(res.data.reviews || []);
      })
      .catch(err => {
        setError(err.response?.data?.error || 'Failed to load reviews');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await API.delete(`/admin/reviews/${id}`);
      setReviews(prev => prev.filter(r => r._id !== id));
      setSuccess('Review deleted');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete review');
    }
  };

  const filtered = reviews.filter(r =>
    r.author?.username?.toLowerCase().includes(search.toLowerCase()) ||
    r.comment?.toLowerCase().includes(search.toLowerCase()) ||
    r.listing?.title?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading-spinner" />;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">Homigo<span>Admin</span></div>
        <Link to="/admin"><i className="fa-solid fa-gauge-high"></i> Dashboard</Link>
        <Link to="/admin/users"><i className="fa-solid fa-users"></i> Users</Link>
        <Link to="/admin/listings"><i className="fa-solid fa-building"></i> Listings</Link>
        <Link to="/admin/bookings"><i className="fa-solid fa-calendar-check"></i> Bookings</Link>
        <Link to="/admin/reviews" className="active"><i className="fa-solid fa-star"></i> Reviews</Link>
        <Link to="/admin/analytics"><i className="fa-solid fa-chart-line"></i> Analytics</Link>
        <Link to="/admin/complaints"><i className="fa-solid fa-headset"></i> Complaints</Link>
      </aside>
      <div className="admin-content">
        {error && <FlashMessage message={error} type="error" />}
        {success && <FlashMessage message={success} type="success" />}
        <div className="admin-header">
          <h1>Manage Reviews</h1>
          <input type="text" className="form-control" placeholder="Search reviews..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
        </div>
        <div className="admin-table-card">
          <table className="table" style={{ margin: 0 }}>
            <thead><tr><th>ID</th><th>Author</th><th>Listing</th><th>Rating</th><th>Comment</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-light">No reviews found</td></tr>
              ) : filtered.map(r => (
                <tr key={r._id}>
                  <td style={{ fontSize: '0.7rem', color: '#888' }}>{r._id?.slice(-8)}</td>
                  <td style={{ fontWeight: 500 }}>@{r.author?.username || 'N/A'}</td>
                  <td style={{ fontSize: '0.85rem', color: '#666' }}>{r.listing?.title || '-'}</td>
                  <td>
                    <span style={{ display: 'flex', gap: '2px' }}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <span key={s} style={{ color: s <= r.rating ? '#6D67C9' : '#ddd', fontSize: '0.9rem' }}>★</span>
                      ))}
                    </span>
                  </td>
                  <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.comment}</td>
                  <td>{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => handleDelete(r._id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
