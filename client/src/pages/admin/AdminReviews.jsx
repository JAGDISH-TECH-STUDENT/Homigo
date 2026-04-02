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
      .then(res => setReviews(res.data.reviews || []))
      .catch(err => setError(err.response?.data?.error || 'Failed to load reviews'))
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
    r.comment?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading-spinner" />;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link to="/admin">Dashboard</Link>
        <Link to="/admin/users">Users</Link>
        <Link to="/admin/listings">Listings</Link>
        <Link to="/admin/bookings">Bookings</Link>
        <Link to="/admin/reviews" className="active">Reviews</Link>
      </aside>
      <div className="admin-content">
        {error && <FlashMessage message={error} type="error" />}
        {success && <FlashMessage message={success} type="success" />}
        <div className="page-header">
          <h1>Manage Reviews</h1>
          <input type="text" className="form-control" placeholder="Search reviews..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Author</th><th>Rating</th><th>Comment</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r._id}>
                  <td>@{r.author?.username || 'N/A'}</td>
                  <td>
                    <span className="star-rating">
                      {[1, 2, 3, 4, 5].map(s => (
                        <i key={s} className={`fa-solid fa-star ${s <= r.rating ? 'star-filled' : 'star-empty'}`}></i>
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
