import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import FlashMessage from '../../components/FlashMessage';
import AdminSidebar from './AdminSidebar';

let usersCache = null;

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState(usersCache || []);
  const [loading, setLoading] = useState(!usersCache);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editRole, setEditRole] = useState('');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageUser, setMessageUser] = useState(null);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    API.get('/admin/users')
      .then(res => {
        const data = res.data.users || [];
        usersCache = data;
        setUsers(data);
      })
      .catch(err => {
        if (!usersCache) {
          setError(err.response?.data?.error || 'Failed to load users');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleEdit = async (id) => {
    try {
      await API.put(`/admin/users/${id}`, { role: editRole });
      setUsers(prev => {
        const next = prev.map(u => u._id === id ? { ...u, role: editRole } : u);
        usersCache = next;
        return next;
      });
      setEditingId(null);
      setSuccess('User updated successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user and all associated data?')) return;
    try {
      await API.delete(`/admin/users/${id}`);
      setUsers(prev => {
        const next = prev.filter(u => u._id !== id);
        usersCache = next;
        return next;
      });
      setSuccess('User deleted successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleBlock = async (id, reason) => {
    try {
      await API.post(`/admin/users/${id}/block`, { reason });
      setUsers(prev => {
        const next = prev.map(u => u._id === id ? { ...u, blocked: true } : u);
        usersCache = next;
        return next;
      });
      setSuccess('User blocked successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to block user');
    }
  };

  const handleUnblock = async (id) => {
    try {
      await API.post(`/admin/users/${id}/unblock`);
      setUsers(prev => {
        const next = prev.map(u => u._id === id ? { ...u, blocked: false } : u);
        usersCache = next;
        return next;
      });
      setSuccess('User unblocked successfully');
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

  const avatarColors = ['#818cf8', '#f472b6', '#34d399', '#fbbf24', '#60a5fa', '#f97316'];
  const getAvatarColor = (name) => avatarColors[(name || '').charCodeAt(0) % avatarColors.length];
  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';

  const formatJoined = (dStr) => {
    if (!dStr) return <span className="admin-td-muted">N/A</span>;
    const d = new Date(dStr);
    return (
      <div className="admin-joined-cell">
        <div className="admin-joined-date">{d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
        <div className="admin-joined-time">{d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</div>
      </div>
    );
  };

  const filtered = users.filter(u => {
    const matchSearch = u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u._id?.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;
    if (roleFilter === 'all') return true;
    if (roleFilter === 'blocked') return u.blocked;
    return (u.role || 'guest') === roleFilter;
  });

  if (loading) {
    return (
      <div className="admin-layout admin-dark">
        <AdminSidebar />
        <div className="admin-content">
          <div className="admin-page-header-dark">
            <div>
              <h1>
                <i className="fa-solid fa-users" style={{ color: '#818cf8', marginRight: '0.6rem', fontSize: '1.4rem' }}></i>
                Manage Users
              </h1>
              <p>View registered users, edit privileges, manage account status and direct communications.</p>
            </div>
          </div>
          <div className="admin-loading-container">
            <div className="admin-spinner"></div>
            <div className="admin-loading-text">Loading users directory...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout admin-dark">
      <AdminSidebar />

      <div className="admin-content">
        {error && <FlashMessage message={error} type="error" />}
        {success && <FlashMessage message={success} type="success" />}

        {/* Page Header */}
        <div className="admin-page-header-dark">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.4rem' }}>
              <button
                type="button"
                className="admin-back-btn admin-back-btn-sm"
                onClick={() => {
                  if (window.history.state?.idx > 0) {
                    navigate(-1);
                  } else {
                    navigate('/admin');
                  }
                }}
                title="Go back"
              >
                <i className="fa-solid fa-arrow-left"></i>
                <span>Back</span>
              </button>
              <h1 style={{ margin: 0 }}>
                <i className="fa-solid fa-users" style={{ color: '#818cf8', marginRight: '0.6rem', fontSize: '1.4rem' }}></i>
                Manage Users
              </h1>
            </div>
            <p>View registered users, edit privileges, manage account status and direct communications.</p>
          </div>
          <div className="admin-header-actions-dark">
            <div style={{ position: 'relative' }}>
              <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}></i>
              <input
                type="text"
                className="admin-input-dark"
                placeholder="Search username or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: '2.4rem', width: '260px' }}
              />
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Users', count: users.length },
            { id: 'guest', label: 'Guests', count: users.filter(u => (u.role || 'guest') === 'guest').length },
            { id: 'host', label: 'Hosts', count: users.filter(u => u.role === 'host').length },
            { id: 'admin', label: 'Admins', count: users.filter(u => u.role === 'admin').length },
            { id: 'blocked', label: 'Blocked', count: users.filter(u => u.blocked).length },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setRoleFilter(f.id)}
              className={`admin-btn ${roleFilter === f.id ? 'admin-btn-primary' : 'admin-btn-outline'}`}
              style={{ fontSize: '0.78rem' }}
            >
              {f.label} <span style={{ opacity: 0.75, marginLeft: '0.3rem' }}>({f.count})</span>
            </button>
          ))}
        </div>

        {/* Users Table Card */}
        <div className="admin-card-dark">
          <div className="admin-card-dark-header">
            <h3>
              User Directory
              <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginLeft: '0.5rem', fontWeight: 400 }}>
                ({filtered.length} {filtered.length === 1 ? 'user' : 'users'})
              </span>
            </h3>
          </div>

          <div className="admin-table-container">
            <table className="admin-table-dark">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.4)' }}>
                      <i className="fa-solid fa-user-slash" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block' }}></i>
                      No users match your criteria
                    </td>
                  </tr>
                ) : filtered.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div className="admin-user-cell">
                        <div className="admin-avatar-circle" style={{ background: getAvatarColor(u.username) }}>
                          {getInitial(u.username)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#fff' }}>{u.username}</div>
                          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>ID: {u._id.slice(-6)}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="admin-td-muted" title={u.email}>{u.email}</span>
                    </td>
                    <td>
                      {editingId === u._id ? (
                        <select
                          value={editRole}
                          onChange={e => setEditRole(e.target.value)}
                          className="admin-input-dark"
                          style={{ padding: '0.25rem 0.5rem', minWidth: '90px', fontSize: '0.75rem' }}
                        >
                          <option value="guest">Guest</option>
                          <option value="host">Host</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className={`admin-role-badge ${u.role === 'admin' ? 'role-admin' : u.role === 'host' ? 'role-host' : 'role-guest'}`}>
                          {u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : 'Guest'}
                        </span>
                      )}
                    </td>
                    <td>
                      {formatJoined(u.createdAt)}
                    </td>
                    <td>
                      {u.blocked ? (
                        <span className="admin-badge admin-badge-inactive">
                          <i className="fa-solid fa-ban" style={{ fontSize: '0.65rem' }}></i> Blocked
                        </span>
                      ) : (
                        <span className="admin-badge admin-badge-active">
                          <i className="fa-solid fa-circle-check" style={{ fontSize: '0.65rem' }}></i> Active
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {editingId === u._id ? (
                          <>
                            <button className="admin-btn admin-btn-success admin-btn-sm" onClick={() => handleEdit(u._id)}>
                              <i className="fa-solid fa-check"></i> Save
                            </button>
                            <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => setEditingId(null)}>
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="admin-btn admin-btn-outline admin-btn-sm"
                              title="Edit Role"
                              onClick={() => { setEditingId(u._id); setEditRole(u.role || 'guest'); }}
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button
                              className="admin-btn admin-btn-info admin-btn-sm"
                              title="Send Message"
                              onClick={() => { setMessageUser(u); setShowMessageModal(true); }}
                            >
                              <i className="fa-solid fa-envelope"></i> Message
                            </button>
                            {u.role !== 'admin' && (
                              u.blocked ? (
                                <button
                                  className="admin-btn admin-btn-success admin-btn-sm"
                                  onClick={() => handleUnblock(u._id)}
                                  title="Unblock User"
                                >
                                  Unblock
                                </button>
                              ) : (
                                <button
                                  className="admin-btn admin-btn-warning admin-btn-sm"
                                  onClick={() => handleBlock(u._id, 'Violation of terms')}
                                  title="Block User"
                                >
                                  Block
                                </button>
                              )
                            )}
                            <button
                              className="admin-btn admin-btn-danger admin-btn-sm"
                              title="Delete User"
                              onClick={() => handleDelete(u._id)}
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dark Message Modal */}
      {showMessageModal && (
        <div className="admin-modal-overlay" onClick={() => { setShowMessageModal(false); setMessageUser(null); }}>
          <div className="admin-modal-dark" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>
                <i className="fa-solid fa-envelope" style={{ color: '#818cf8', marginRight: '0.5rem' }}></i>
                Message @{messageUser?.username}
              </h3>
              <button
                className="admin-modal-close"
                onClick={() => { setShowMessageModal(false); setMessageUser(null); }}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSendMessage}>
              <div className="admin-form-group-dark">
                <label>Subject</label>
                <input
                  type="text"
                  className="admin-input-dark"
                  value={messageSubject}
                  onChange={e => setMessageSubject(e.target.value)}
                  placeholder="e.g. Account notification or inquiry"
                  required
                />
              </div>
              <div className="admin-form-group-dark">
                <label>Message Content</label>
                <textarea
                  className="admin-input-dark"
                  rows={4}
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  placeholder="Type your message to this user..."
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => { setShowMessageModal(false); setMessageUser(null); }}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  <i className="fa-solid fa-paper-plane"></i> Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
