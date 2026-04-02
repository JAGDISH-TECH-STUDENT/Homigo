import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import FlashMessage from '../../components/FlashMessage';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editRole, setEditRole] = useState('');

  useEffect(() => {
    API.get('/admin/users')
      .then(res => setUsers(res.data.users || []))
      .catch(err => setError(err.response?.data?.error || 'Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  const handleEdit = async (id) => {
    try {
      await API.put(`/admin/users/${id}`, { role: editRole });
      setUsers(prev => prev.map(u => u._id === id ? { ...u, role: editRole } : u));
      setEditingId(null);
      setSuccess('User updated');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user and all associated data?')) return;
    try {
      await API.delete(`/admin/users/${id}`);
      setUsers(prev => prev.filter(u => u._id !== id));
      setSuccess('User deleted');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const filtered = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading-spinner" />;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link to="/admin">Dashboard</Link>
        <Link to="/admin/users" className="active">Users</Link>
        <Link to="/admin/listings">Listings</Link>
        <Link to="/admin/bookings">Bookings</Link>
        <Link to="/admin/reviews">Reviews</Link>
      </aside>
      <div className="admin-content">
        {error && <FlashMessage message={error} type="error" />}
        {success && <FlashMessage message={success} type="success" />}

        <div className="page-header">
          <h1>Manage Users</h1>
          <input
            type="text"
            className="form-control"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 300 }}
          />
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u._id}>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>
                    {editingId === u._id ? (
                      <select value={editRole} onChange={e => setEditRole(e.target.value)} className="form-control" style={{ width: 'auto', padding: '0.25rem 0.5rem' }}>
                        <option value="guest">Guest</option>
                        <option value="host">Host</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className="badge badge-active">{u.role}</span>
                    )}
                  </td>
                  <td>
                    {editingId === u._id ? (
                      <div className="flex gap-1">
                        <button className="btn btn-success btn-sm" onClick={() => handleEdit(u._id)}>Save</button>
                        <button className="btn btn-outline btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <button className="btn btn-outline btn-sm" onClick={() => { setEditingId(u._id); setEditRole(u.role); }}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u._id)}>Delete</button>
                      </div>
                    )}
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
