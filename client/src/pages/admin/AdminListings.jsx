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

  const handleToggleActive = async (id, currentActive) => {
    try {
      const endpoint = currentActive ? `/admin/listings/${id}/deactivate` : `/admin/listings/${id}/activate`;
      await API.put(endpoint);
      setListings(prev => prev.map(l => l._id === id ? { ...l, active: !currentActive } : l));
      setSuccess(currentActive ? 'Listing deactivated' : 'Listing activated');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update listing');
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
        <div className="admin-sidebar-brand">Homigo<span>Admin</span></div>
        <Link to="/admin"><i className="fa-solid fa-gauge-high"></i> Dashboard</Link>
        <Link to="/admin/users"><i className="fa-solid fa-users"></i> Users</Link>
        <Link to="/admin/listings" className="active"><i className="fa-solid fa-building"></i> Listings</Link>
        <Link to="/admin/bookings"><i className="fa-solid fa-calendar-check"></i> Bookings</Link>
        <Link to="/admin/reviews"><i className="fa-solid fa-star"></i> Reviews</Link>
        <Link to="/admin/analytics"><i className="fa-solid fa-chart-line"></i> Analytics</Link>
        <Link to="/admin/complaints"><i className="fa-solid fa-headset"></i> Complaints</Link>
      </aside>
      <div className="admin-content">
        {error && <FlashMessage message={error} type="error" />}
        {success && <FlashMessage message={success} type="success" />}
        <div className="admin-header">
          <h1>Manage Listings</h1>
          <input type="text" className="form-control" placeholder="Search listings..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
        </div>
        <div className="admin-table-card">
          <table className="table" style={{ margin: 0 }}>
            <thead><tr><th>Image</th><th>Title</th><th>Location</th><th>Price</th><th>Status</th><th>Owner</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l._id}>
                  <td><img src={l.images?.[0]?.url || ''} alt="" style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 6 }} /></td>
                  <td style={{ fontWeight: 500 }}>{l.title}</td>
                  <td style={{ color: '#64748b' }}>{l.location}, {l.country}</td>
                  <td>₹{l.price?.toLocaleString('en-IN')}</td>
                  <td>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600,
                      background: l.active ? '#d1fae5' : '#fee2e2',
                      color: l.active ? '#059669' : '#dc2626'
                    }}>
                      {l.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ color: '#64748b' }}>{l.owner?.username || 'N/A'}</td>
                  <td>
                    <div className="flex gap-1">
                      <Link to={`/listings/${l._id}`} className="btn btn-outline btn-sm">View</Link>
                      <button 
                        className={`btn btn-sm ${l.active ? 'btn-warning' : 'btn-success'}`}
                        onClick={() => handleToggleActive(l._id, l.active)}
                      >
                        {l.active ? 'Deactivate' : 'Activate'}
                      </button>
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
