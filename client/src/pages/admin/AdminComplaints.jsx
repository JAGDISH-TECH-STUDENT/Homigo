import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import FlashMessage from '../../components/FlashMessage';
import AdminSidebar from './AdminSidebar';

let complaintsCache = null;
let complaintsStatsCache = null;

export default function AdminComplaints() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState(complaintsCache || []);
  const [stats, setStats] = useState(complaintsStatsCache || {});
  const [loading, setLoading] = useState(!complaintsCache);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [resolution, setResolution] = useState('');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageUser, setMessageUser] = useState(null);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageText, setMessageText] = useState('');

  const loadComplaints = useCallback(async () => {
    try {
      const res = await API.get(`/admin/complaints${filter ? `?status=${filter}` : ''}`);
      const compList = res.data.complaints || [];
      const st = res.data.stats || {};
      if (!filter) {
        complaintsCache = compList;
        complaintsStatsCache = st;
      }
      setComplaints(compList);
      setStats(st);
    } catch {
      setError('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  const handleResolve = async (id, status) => {
    try {
      await API.put(`/admin/complaints/${id}/status`, { status, message: resolution });
      setSuccess(`Complaint marked as ${status}`);
      setResolution('');
      loadComplaints();
      if (selected && selected._id === id) {
        setSelected(prev => ({ ...prev, status }));
      }
    } catch {
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
      setSuccess('Message sent to user');
      setShowMessageModal(false);
      setMessageUser(null);
      setMessageSubject('');
      setMessageText('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message');
    }
  };

  if (loading) {
    return (
      <div className="admin-layout admin-dark">
        <AdminSidebar />
        <div className="admin-content">
          <div className="admin-page-header-dark">
            <div>
              <h1>
                <i className="fa-solid fa-headset" style={{ color: '#60a5fa', marginRight: '0.6rem', fontSize: '1.4rem' }}></i>
                Complaints & Support Tickets
              </h1>
              <p>Manage customer issues, resolve dispute inquiries, and message parties directly.</p>
            </div>
          </div>
          <div className="admin-loading-container">
            <div className="admin-spinner"></div>
            <div className="admin-loading-text">Loading support tickets...</div>
          </div>
        </div>
      </div>
    );
  }

  const getPriorityBadge = (p) => {
    if (p === 'urgent') {
      return (
        <span className="admin-badge" style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '0.65rem' }}></i> Urgent
        </span>
      );
    }
    if (p === 'high') {
      return (
        <span className="admin-badge" style={{ background: 'rgba(251,191,36,0.2)', color: '#fbbf24' }}>
          <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '0.65rem' }}></i> High
        </span>
      );
    }
    return (
      <span className="admin-badge admin-badge-neutral">
        Normal
      </span>
    );
  };

  const getStatusBadge = (s) => {
    switch (s) {
      case 'resolved':
        return (
          <span className="admin-badge admin-badge-active">
            <i className="fa-solid fa-check-double" style={{ fontSize: '0.65rem' }}></i> Resolved
          </span>
        );
      case 'in_progress':
        return (
          <span className="admin-badge admin-badge-pending">
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '0.65rem' }}></i> In Progress
          </span>
        );
      case 'open':
        return (
          <span className="admin-badge admin-badge-inactive">
            <i className="fa-solid fa-envelope-open" style={{ fontSize: '0.65rem' }}></i> Open
          </span>
        );
      case 'closed':
      default:
        return (
          <span className="admin-badge admin-badge-neutral">
            Closed
          </span>
        );
    }
  };

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
                <i className="fa-solid fa-headset" style={{ color: '#60a5fa', marginRight: '0.6rem', fontSize: '1.4rem' }}></i>
                Complaints & Support Tickets
              </h1>
            </div>
            <p>Manage customer issues, resolve dispute inquiries, and message parties directly.</p>
          </div>
          <div className="admin-header-actions-dark">
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <button
                className={`admin-btn ${!filter ? 'admin-btn-primary' : 'admin-btn-outline'}`}
                onClick={() => setFilter('')}
                style={{ fontSize: '0.78rem' }}
              >
                All ({complaints.length})
              </button>
              <button
                className={`admin-btn ${filter === 'open' ? 'admin-btn-primary' : 'admin-btn-outline'}`}
                onClick={() => setFilter('open')}
                style={{ fontSize: '0.78rem' }}
              >
                Open ({stats.open || 0})
              </button>
              <button
                className={`admin-btn ${filter === 'in_progress' ? 'admin-btn-primary' : 'admin-btn-outline'}`}
                onClick={() => setFilter('in_progress')}
                style={{ fontSize: '0.78rem' }}
              >
                In Progress ({stats.in_progress || 0})
              </button>
              <button
                className={`admin-btn ${filter === 'resolved' ? 'admin-btn-primary' : 'admin-btn-outline'}`}
                onClick={() => setFilter('resolved')}
                style={{ fontSize: '0.78rem' }}
              >
                Resolved ({stats.resolved || 0})
              </button>
            </div>
          </div>
        </div>

        {/* Grid: Tickets table + Details side card */}
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: '1.25rem', alignItems: 'flex-start' }}>
          <div className="admin-card-dark">
            <div className="admin-card-dark-header">
              <h3>Support Inquiries</h3>
            </div>
            <div className="admin-table-container">
              <table className="admin-table-dark">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Subject</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.4)' }}>
                        <i className="fa-solid fa-circle-check" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block', color: '#34d399' }}></i>
                        No complaints matching this view
                      </td>
                    </tr>
                  ) : (
                    complaints.map(c => (
                      <tr
                        key={c._id}
                        style={{
                          background: selected?._id === c._id ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                          transition: 'background 0.2s',
                        }}
                      >
                        <td>
                          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                            #{c._id.slice(-6).toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#fff', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.subject}>
                            {c.subject}
                          </div>
                        </td>
                        <td>
                          <span className="admin-badge admin-badge-neutral" style={{ textTransform: 'capitalize' }}>
                            {c.category}
                          </span>
                        </td>
                        <td>
                          {getPriorityBadge(c.priority)}
                        </td>
                        <td>
                          {getStatusBadge(c.status)}
                        </td>
                        <td>
                          <span className="admin-td-muted" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                            {new Date(c.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                              className={`admin-btn admin-btn-sm ${selected?._id === c._id ? 'admin-btn-primary' : 'admin-btn-outline'}`}
                              onClick={() => setSelected(selected?._id === c._id ? null : c)}
                            >
                              <i className="fa-solid fa-eye"></i> {selected?._id === c._id ? 'Close' : 'View'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Details Side Panel */}
          {selected && (
            <div className="admin-card-dark" style={{ border: '1px solid rgba(129, 140, 248, 0.3)' }}>
              <div className="admin-card-dark-header">
                <h3>Ticket Details</h3>
                <button
                  className="admin-modal-close"
                  onClick={() => setSelected(null)}
                  style={{ fontSize: '1rem' }}
                >
                  &times;
                </button>
              </div>
              <div style={{ padding: '1.25rem' }}>
                <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>
                  {selected.subject}
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 8, margin: '0 0 1rem 0' }}>
                  {selected.description}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: 6 }}>
                    <div className="admin-td-muted" style={{ fontSize: '0.7rem' }}>Category</div>
                    <strong style={{ color: '#fff', textTransform: 'capitalize' }}>{selected.category}</strong>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: 6 }}>
                    <div className="admin-td-muted" style={{ fontSize: '0.7rem' }}>Priority</div>
                    {getPriorityBadge(selected.priority)}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.85rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
                  <div style={{ marginBottom: '0.4rem' }}>
                    <span className="admin-td-muted">Filed by:</span>{' '}
                    <strong style={{ color: '#818cf8' }}>{selected.createdBy?.username}</strong>{' '}
                    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>({selected.createdBy?.email})</span>
                  </div>

                  {selected.againstUser && (
                    <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(239,68,68,0.1)', borderRadius: 8 }}>
                      <span className="admin-td-muted">Reported User:</span>{' '}
                      <strong style={{ color: '#f87171' }}>{selected.againstUser?.username}</strong>
                      <div style={{ marginTop: '0.35rem' }}>
                        <button
                          className="admin-btn admin-btn-info admin-btn-sm"
                          onClick={() => {
                            setMessageUser(selected.againstUser);
                            setShowMessageModal(true);
                            setMessageSubject(`Regarding Complaint: ${selected.subject}`);
                          }}
                        >
                          <i className="fa-solid fa-envelope"></i> Message Reported User
                        </button>
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>
                    Created on {new Date(selected.createdAt).toLocaleString('en-IN')}
                  </div>
                </div>

                {selected.responses?.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <h5 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                      Updates ({selected.responses.length})
                    </h5>
                    {selected.responses.map((r, i) => (
                      <div key={i} style={{ background: 'rgba(255,255,255,0.04)', padding: '0.6rem', borderRadius: 8, marginBottom: '0.4rem' }}>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#fff' }}>{r.message}</p>
                        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.3rem' }}>
                          {r.respondedBy?.username} &bull; {new Date(r.createdAt).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selected.status !== 'resolved' && selected.status !== 'closed' && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.85rem' }}>
                    <label style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '0.4rem' }}>
                      Resolution Note / Reply
                    </label>
                    <textarea
                      className="admin-input-dark"
                      placeholder="Add an internal note or action taken..."
                      value={resolution}
                      onChange={e => setResolution(e.target.value)}
                      rows={3}
                      style={{ width: '100%', marginBottom: '0.75rem' }}
                    />
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <button
                        className="admin-btn admin-btn-success admin-btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => handleResolve(selected._id, 'resolved')}
                      >
                        <i className="fa-solid fa-check"></i> Resolve
                      </button>
                      <button
                        className="admin-btn admin-btn-warning admin-btn-sm"
                        onClick={() => handleResolve(selected._id, 'in_progress')}
                      >
                        In Progress
                      </button>
                      <button
                        className="admin-btn admin-btn-outline admin-btn-sm"
                        onClick={() => handleResolve(selected._id, 'closed')}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Message Modal */}
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
                  placeholder="Subject line"
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
                  placeholder="Type your message regarding this ticket..."
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
