import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import FlashMessage from '../../components/FlashMessage';
import AdminSidebar from './AdminSidebar';

let listingsCache = null;

export default function AdminListings() {
  const navigate = useNavigate();
  const [listings, setListings] = useState(listingsCache || []);
  const [loading, setLoading] = useState(!listingsCache);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageUser, setMessageUser] = useState(null);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageText, setMessageText] = useState('');

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

  useEffect(() => {
    API.get('/admin/listings')
      .then(res => {
        const data = res.data.listings || [];
        listingsCache = data;
        setListings(data);
      })
      .catch(err => {
        if (!listingsCache) {
          setError(err.response?.data?.error || 'Failed to load listings');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this listing and all associated data?')) return;
    try {
      await API.delete(`/admin/listings/${id}`);
      setListings(prev => {
        const next = prev.filter(l => l._id !== id);
        listingsCache = next;
        return next;
      });
      setSuccess('Listing deleted successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete listing');
    }
  };

  const handleToggleActive = async (id, currentActive) => {
    try {
      const endpoint = currentActive ? `/admin/listings/${id}/deactivate` : `/admin/listings/${id}/activate`;
      await API.put(endpoint);
      setListings(prev => {
        const next = prev.map(l => l._id === id ? { ...l, active: !currentActive } : l);
        listingsCache = next;
        return next;
      });
      setSuccess(currentActive ? 'Listing deactivated' : 'Listing activated');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update listing');
    }
  };

  const filtered = listings.filter(l => {
    const matchSearch = l.title?.toLowerCase().includes(search.toLowerCase()) ||
      l.location?.toLowerCase().includes(search.toLowerCase()) ||
      l.country?.toLowerCase().includes(search.toLowerCase()) ||
      l.owner?.username?.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;
    if (statusFilter === 'active') return l.active !== false;
    if (statusFilter === 'inactive') return l.active === false;
    return true;
  });

  if (loading) {
    return (
      <div className="admin-layout admin-dark">
        <AdminSidebar />
        <div className="admin-content">
          <div className="admin-page-header-dark">
            <div>
              <h1>
                <i className="fa-solid fa-building" style={{ color: '#34d399', marginRight: '0.6rem', fontSize: '1.4rem' }}></i>
                Manage Listings
              </h1>
              <p>Monitor properties, review pricing, verify details, and toggle listing visibility.</p>
            </div>
          </div>
          <div className="admin-loading-container">
            <div className="admin-spinner"></div>
            <div className="admin-loading-text">Loading listings...</div>
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
                <i className="fa-solid fa-building" style={{ color: '#34d399', marginRight: '0.6rem', fontSize: '1.4rem' }}></i>
                Manage Listings
              </h1>
            </div>
            <p>Monitor properties, review pricing, verify details, and toggle listing visibility.</p>
          </div>
          <div className="admin-header-actions-dark">
            <div style={{ position: 'relative' }}>
              <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}></i>
              <input
                type="text"
                className="admin-input-dark"
                placeholder="Search title, location, owner..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: '2.4rem', width: '280px' }}
              />
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Listings', count: listings.length },
            { id: 'active', label: 'Active', count: listings.filter(l => l.active !== false).length },
            { id: 'inactive', label: 'Inactive', count: listings.filter(l => l.active === false).length },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`admin-btn ${statusFilter === f.id ? 'admin-btn-primary' : 'admin-btn-outline'}`}
              style={{ fontSize: '0.78rem' }}
            >
              {f.label} <span style={{ opacity: 0.75, marginLeft: '0.3rem' }}>({f.count})</span>
            </button>
          ))}
        </div>

        {/* Listings Table Card */}
        <div className="admin-card-dark">
          <div className="admin-card-dark-header">
            <h3>
              Listings Directory
              <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginLeft: '0.5rem', fontWeight: 400 }}>
                ({filtered.length} {filtered.length === 1 ? 'property' : 'properties'})
              </span>
            </h3>
          </div>

          <div className="admin-table-container">
            <table className="admin-table-dark">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Preview</th>
                  <th>Title</th>
                  <th>Location</th>
                  <th>Price / Night</th>
                  <th>Status</th>
                  <th>Host / Owner</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.4)' }}>
                      <i className="fa-solid fa-hotel" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block' }}></i>
                      No listings match your search
                    </td>
                  </tr>
                ) : filtered.map(l => {
                  const imgUrl = l.images?.[0]?.url || l.image?.url || '';
                  return (
                    <tr key={l._id}>
                      <td>
                        <div style={{ width: 64, height: 44, borderRadius: 8, overflow: 'hidden', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }}>
                          {imgUrl ? (
                            <img src={imgUrl} alt={l.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)' }}>
                              <i className="fa-solid fa-image"></i>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#fff', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.title}>
                          {l.title}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>ID: {l._id.slice(-6)}</div>
                      </td>
                      <td>
                        <div className="admin-td-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <i className="fa-solid fa-location-dot" style={{ fontSize: '0.7rem', color: '#818cf8' }}></i>
                          <span>{l.location}{l.country ? `, ${l.country}` : ''}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#fff' }}>₹{l.price?.toLocaleString('en-IN')}</span>
                      </td>
                      <td>
                        {l.active !== false ? (
                          <span className="admin-badge admin-badge-active">
                            <i className="fa-solid fa-circle" style={{ fontSize: '0.45rem' }}></i> Active
                          </span>
                        ) : (
                          <span className="admin-badge admin-badge-inactive">
                            <i className="fa-solid fa-circle" style={{ fontSize: '0.45rem' }}></i> Inactive
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#fff' }}>
                            {(l.owner?.username || 'O')[0].toUpperCase()}
                          </div>
                          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem' }}>{l.owner?.username || 'N/A'}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <Link to={`/listings/${l._id}`} className="admin-btn admin-btn-outline admin-btn-sm" title="View Property">
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </Link>
                          {l.owner && (
                            <button
                              className="admin-btn admin-btn-info admin-btn-sm"
                              title={`Message Host @${l.owner.username}`}
                              onClick={() => {
                                setMessageUser(l.owner);
                                setMessageSubject(`Regarding listing: ${l.title}`);
                                setShowMessageModal(true);
                              }}
                            >
                              <i className="fa-solid fa-envelope"></i> Message
                            </button>
                          )}
                          <button
                            className={`admin-btn admin-btn-sm ${l.active !== false ? 'admin-btn-warning' : 'admin-btn-success'}`}
                            onClick={() => handleToggleActive(l._id, l.active !== false)}
                            title={l.active !== false ? 'Deactivate Listing' : 'Activate Listing'}
                          >
                            {l.active !== false ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            className="admin-btn admin-btn-danger admin-btn-sm"
                            onClick={() => handleDelete(l._id)}
                            title="Delete Listing"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dark Message Host Modal */}
      {showMessageModal && (
        <div className="admin-modal-overlay" onClick={() => { setShowMessageModal(false); setMessageUser(null); }}>
          <div className="admin-modal-dark" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>
                <i className="fa-solid fa-envelope" style={{ color: '#818cf8', marginRight: '0.5rem' }}></i>
                Message Host @{messageUser?.username}
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
                  placeholder="e.g. Inquiry regarding property status"
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
                  placeholder="Type your message to this host..."
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
