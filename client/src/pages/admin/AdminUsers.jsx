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
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageUser, setMessageUser] = useState(null);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageText, setMessageText] = useState('');

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

  const handleBlock = async (id, reason) => {
    try {
      await API.post(`/admin/users/${id}/block`, { reason });
      setUsers(prev => prev.map(u => u._id === id ? { ...u, blocked: true } : u));
      setSuccess('User blocked');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to block user');
    }
  };

  const handleUnblock = async (id) => {
    try {
      await API.post(`/admin/users/${id}/unblock`);
      setUsers(prev => prev.map(u => u._id === id ? { ...u, blocked: false } : u));
      setSuccess('User unblocked');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to unblock user');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !messageSubject.trim()) return;
    try {
      await API.post(`/admin/users/${messageUser._id}/message`, {
        subject: messageSubject,
        message: messageText
      });
      setSuccess('Message sent to user');
      setShowMessageModal(false);
      setMessageUser(null);
      setMessageSubject('');
      setMessageText('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message');
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
        <div className="admin-sidebar-brand">Homigo<span>Admin</span></div>
        <Link to="/admin"><i className="fa-solid fa-gauge-high"></i> Dashboard</Link>
        <Link to="/admin/users" className="active"><i className="fa-solid fa-users"></i> Users</Link>
        <Link to="/admin/listings"><i className="fa-solid fa-building"></i> Listings</Link>
        <Link to="/admin/bookings"><i className="fa-solid fa-calendar-check"></i> Bookings</Link>
        <Link to="/admin/reviews"><i className="fa-solid fa-star"></i> Reviews</Link>
        <Link to="/admin/analytics"><i className="fa-solid fa-chart-line"></i> Analytics</Link>
        <Link to="/admin/complaints"><i className="fa-solid fa-headset"></i> Complaints</Link>
      </aside>
      <div className="admin-content">
        {error && <FlashMessage message={error} type="error" />}
        {success && <FlashMessage message={success} type="success" />}

        <div className="admin-header">
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

        <div className="admin-table-card">
          <table className="table" style={{ margin: 0 }}>
            <thead><tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u._id}>
                  <td style={{ fontSize: '0.75rem', color: '#888' }}>{u._id}</td>
                  <td style={{ fontWeight: 500 }}>{u.username}</td>
                  <td style={{ color: '#64748b' }}>{u.email}</td>
                  <td>
                    {editingId === u._id ? (
                      <select value={editRole} onChange={e => setEditRole(e.target.value)} className="form-control" style={{ width: 'auto', padding: '0.25rem 0.5rem' }}>
                        <option value="guest">Guest</option>
                        <option value="host">Host</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className={`badge ${u.role === 'admin' ? 'badge-danger' : u.role === 'host' ? 'badge-success' : ''}`} style={{ background: u.role === 'admin' ? '#fef2f2' : u.role === 'host' ? '#f0fdf4' : '#f8fafc', color: u.role === 'admin' ? '#dc2626' : u.role === 'host' ? '#16a34a' : '#64748b' }}>{u.role || 'guest'}</span>
                    )}
                  </td>
                  <td style={{ color: '#64748b', fontSize: '0.85rem' }}>
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                  </td>
                  <td>
                    {u.blocked ? (
                      <span style={{ background: '#fee2e2', color: '#dc2626', padding: '0.25rem 0.5rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>Blocked</span>
                    ) : (
                      <span style={{ background: '#d1fae5', color: '#059669', padding: '0.25rem 0.5rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>Active</span>
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
                        <button className="btn btn-info btn-sm" onClick={() => { setMessageUser(u); setShowMessageModal(true); }}>Message</button>
                        {u.role !== 'admin' && (
                          u.blocked ? (
                            <button className="btn btn-success btn-sm" onClick={() => handleUnblock(u._id)}>Unblock</button>
                          ) : (
                            <button className="btn btn-warning btn-sm" onClick={() => handleBlock(u._id, 'Violation of terms')}>Block</button>
                          )
                        )}
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

      {showMessageModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 12, maxWidth: 450, width: '90%', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Send Message to {messageUser?.username}</h3>
              <button 
                onClick={() => { setShowMessageModal(false); setMessageUser(null); }} 
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', padding: 0, lineHeight: 1 }}
              >×</button>
            </div>
            <form onSubmit={handleSendMessage}>
              <div className="form-group">
                <label style={{ fontWeight: 500, fontSize: '0.9rem' }}>Subject</label>
                <input
                  type="text"
                  className="form-control"
                  value={messageSubject}
                  onChange={e => setMessageSubject(e.target.value)}
                  placeholder="Enter subject"
                  required
                />
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 500, fontSize: '0.9rem' }}>Message</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  placeholder="Enter your message to the user..."
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Send</button>
                <button type="button" className="btn btn-outline" onClick={() => { setShowMessageModal(false); setMessageUser(null); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
