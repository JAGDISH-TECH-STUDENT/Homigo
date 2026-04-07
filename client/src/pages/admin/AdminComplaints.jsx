import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import FlashMessage from '../../components/FlashMessage';

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [resolution, setResolution] = useState('');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageUser, setMessageUser] = useState(null);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    loadComplaints();
  }, [filter]);

  const loadComplaints = async () => {
    try {
      const res = await API.get(`/admin/complaints${filter ? `?status=${filter}` : ''}`);
      setComplaints(res.data.complaints || []);
      setStats(res.data.stats || {});
    } catch (err) {
      setError('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id, status) => {
    try {
      await API.put(`/admin/complaints/${id}/status`, { status, message: resolution });
      setSuccess(`Complaint ${status}`);
      setResolution('');
      loadComplaints();
    } catch (err) {
      setError('Failed to update complaint');
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
      setSuccess('Message sent to host');
      setShowMessageModal(false);
      setMessageUser(null);
      setMessageSubject('');
      setMessageText('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message');
    }
  };

  if (loading) return <div className="loading-spinner" />;

  const statusColors = {
    open: { bg: '#fee2e2', color: '#dc2626' },
    in_progress: { bg: '#fef3c7', color: '#d97706' },
    resolved: { bg: '#d1fae5', color: '#059669' },
    closed: { bg: '#f1f5f9', color: '#64748b' }
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">Homigo<span>Admin</span></div>
        <Link to="/admin"><i className="fa-solid fa-gauge-high"></i> Dashboard</Link>
        <Link to="/admin/users"><i className="fa-solid fa-users"></i> Users</Link>
        <Link to="/admin/listings"><i className="fa-solid fa-building"></i> Listings</Link>
        <Link to="/admin/bookings"><i className="fa-solid fa-calendar-check"></i> Bookings</Link>
        <Link to="/admin/reviews"><i className="fa-solid fa-star"></i> Reviews</Link>
        <Link to="/admin/analytics"><i className="fa-solid fa-chart-line"></i> Analytics</Link>
        <Link to="/admin/complaints" className="active"><i className="fa-solid fa-headset"></i> Complaints</Link>
      </aside>
      
      <div className="admin-content">
        {error && <FlashMessage message={error} type="error" />}
        {success && <FlashMessage message={success} type="success" />}

        <div className="admin-header">
          <h1>Complaints & Support</h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className={`btn ${!filter ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('')}>All ({complaints.length})</button>
            <button className={`btn ${filter === 'open' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('open')}>Open ({stats.open || 0})</button>
            <button className={`btn ${filter === 'in_progress' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('in_progress')}>In Progress ({stats.in_progress || 0})</button>
            <button className={`btn ${filter === 'resolved' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('resolved')}>Resolved ({stats.resolved || 0})</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 350px' : '1fr', gap: '1.5rem' }}>
          <div className="admin-table-card">
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Subject</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-light">No complaints found</td></tr>
                ) : complaints.map(c => (
                  <tr key={c._id}>
                    <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{c._id.slice(-6)}</td>
                    <td style={{ fontWeight: 500 }}>{c.subject}</td>
                    <td style={{ textTransform: 'capitalize' }}>{c.category}</td>
                    <td>
                      <span style={{ 
                        fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: 4,
                        background: c.priority === 'urgent' ? '#fee2e2' : c.priority === 'high' ? '#fef3c7' : '#f1f5f9',
                        color: c.priority === 'urgent' ? '#dc2626' : c.priority === 'high' ? '#d97706' : '#64748b'
                      }}>{c.priority}</span>
                    </td>
                    <td>
                      <span style={{ 
                        fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.5rem', borderRadius: 20,
                        background: statusColors[c.status]?.bg, color: statusColors[c.status]?.color, textTransform: 'capitalize'
                      }}>{c.status.replace('_', ' ')}</span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{new Date(c.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => setSelected(c)}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selected && (
            <div className="admin-table-card" style={{ height: 'fit-content' }}>
              <div className="admin-table-header">
                <div className="admin-table-title">Complaint Details</div>
                <button className="btn btn-outline btn-sm" onClick={() => setSelected(null)}>X</button>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{selected.subject}</h3>
                <p className="text-light" style={{ marginBottom: '1rem' }}>{selected.description}</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div><span className="text-light">Category:</span> <strong>{selected.category}</strong></div>
                  <div><span className="text-light">Priority:</span> <strong>{selected.priority}</strong></div>
                </div>
                
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '1rem' }}>
                  <p className="text-light" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Reporter: {selected.createdBy?.username} ({selected.createdBy?.email})</p>
                  {selected.againstUser && (
                    <p className="text-light" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                      Against: <strong>{selected.againstUser?.username}</strong> ({selected.againstUser?.email})
                      <button 
                        className="btn btn-info btn-sm" 
                        style={{ marginLeft: '0.5rem' }}
                        onClick={() => { setMessageUser(selected.againstUser); setShowMessageModal(true); setMessageSubject(`Regarding Complaint: ${selected.subject}`); }}
                      >
                        Send Message
                      </button>
                    </p>
                  )}
                  <p className="text-light" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>Created: {new Date(selected.createdAt).toLocaleString('en-IN')}</p>
                </div>

                {selected.responses?.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Responses ({selected.responses.length})</h4>
                    {selected.responses.map((r, i) => (
                      <div key={i} style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: 8, marginBottom: '0.5rem' }}>
                        <p style={{ marginBottom: '0.25rem' }}>{r.message}</p>
                        <p className="text-light" style={{ fontSize: '0.75rem' }}>{r.respondedBy?.username} - {new Date(r.createdAt).toLocaleDateString('en-IN')}</p>
                      </div>
                    ))}
                  </div>
                )}

                {selected.status !== 'resolved' && selected.status !== 'closed' && (
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                    <textarea 
                      className="form-control" 
                      placeholder="Resolution message..." 
                      value={resolution}
                      onChange={e => setResolution(e.target.value)}
                      rows={3}
                      style={{ marginBottom: '0.5rem' }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-success" onClick={() => handleResolve(selected._id, 'resolved')}>Resolve</button>
                      <button className="btn btn-warning" onClick={() => handleResolve(selected._id, 'in_progress')}>In Progress</button>
                      <button className="btn btn-outline" onClick={() => handleResolve(selected._id, 'closed')}>Close</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
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
                  placeholder="Enter your message..."
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