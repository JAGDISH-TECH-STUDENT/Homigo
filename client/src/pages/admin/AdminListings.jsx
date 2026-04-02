import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import FlashMessage from '../../components/FlashMessage';

export default function AdminListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    API.get('/admin/listings')
      .then(res => setListings(res.data.listings || []))
      .catch(err => setError(err.response?.data?.error || 'Failed to load listings'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this listing and all associated data?')) return;
    try {
      await API.delete(`/admin/listings/${id}`);
      setListings(prev => prev.filter(l => l._id !== id));
      setSuccess('Listing deleted');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete listing');
    }
  };

  const filtered = listings.filter(l =>
    l.title?.toLowerCase().includes(search.toLowerCase()) ||
    l.location?.toLowerCase().includes(search.toLowerCase()) ||
    l.owner?.username?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading-spinner" />;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link to="/admin">Dashboard</Link>
        <Link to="/admin/users">Users</Link>
        <Link to="/admin/listings" className="active">Listings</Link>
        <Link to="/admin/bookings">Bookings</Link>
        <Link to="/admin/reviews">Reviews</Link>
      </aside>
      <div className="admin-content">
        {error && <FlashMessage message={error} type="error" />}
        {success && <FlashMessage message={success} type="success" />}
        <div className="page-header">
          <h1>Manage Listings</h1>
          <input type="text" className="form-control" placeholder="Search listings..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Image</th><th>Title</th><th>Location</th><th>Price</th><th>Owner</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l._id}>
                  <td><img src={l.images?.[0]?.url || ''} alt="" style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 6 }} /></td>
                  <td>{l.title}</td>
                  <td>{l.location}, {l.country}</td>
                  <td>₹{l.price?.toLocaleString('en-IN')}</td>
                  <td>{l.owner?.username || 'N/A'}</td>
                  <td>
                    <div className="flex gap-1">
                      <Link to={`/listings/${l._id}`} className="btn btn-outline btn-sm">View</Link>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(l._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
