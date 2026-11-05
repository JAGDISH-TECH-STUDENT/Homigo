import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';

function timeAgo(date) {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diffSec = Math.max(0, Math.floor((now - d) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function AdminNotifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('admin_read_notifs') || '[]');
    } catch {
      return [];
    }
  });

  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/notifications');
      if (res.data?.notifications) {
        setNotifications(res.data.notifications);
      }
    } catch (err) {
      console.error('Failed to load admin notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Optional refresh every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const markAsRead = (id) => {
    setReadIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      try {
        localStorage.setItem('admin_read_notifs', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    const updated = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(updated);
    try {
      localStorage.setItem('admin_read_notifs', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleItemClick = (notif) => {
    markAsRead(notif.id);
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;

  const filteredNotifs = notifications.filter((n) => {
    if (activeTab === 'all') return true;
    return n.type === activeTab;
  });

  const counts = {
    all: notifications.length,
    user: notifications.filter((n) => n.type === 'user').length,
    listing: notifications.filter((n) => n.type === 'listing').length,
    review: notifications.filter((n) => n.type === 'review').length,
    complaint: notifications.filter((n) => n.type === 'complaint').length
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'user':
        return { icon: 'fa-user-plus', color: '#0066ff', bg: '#e0f0fe', label: 'User' };
      case 'listing':
        return { icon: 'fa-house-circle-check', color: '#059669', bg: '#d1fae5', label: 'Listing' };
      case 'review':
        return { icon: 'fa-star', color: '#d97706', bg: '#fef3c7', label: 'Review' };
      case 'complaint':
        return { icon: 'fa-triangle-exclamation', color: '#dc2626', bg: '#fee2e2', label: 'Complaint' };
      default:
        return { icon: 'fa-bell', color: '#0066ff', bg: '#e0f0fe', label: 'Alert' };
    }
  };

  return (
    <div className="admin-notif-container" ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell Trigger */}
      <button
        type="button"
        className={`admin-topbar-icon ${isOpen ? 'active' : ''}`}
        title="Admin Notifications"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          border: 'none',
          cursor: 'pointer',
          outline: 'none',
          position: 'relative'
        }}
      >
        <i className="fa-solid fa-bell" style={{ fontSize: '1rem', color: isOpen ? '#0066ff' : '#64748b' }}></i>
        {unreadCount > 0 && (
          <span className="admin-notif-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="admin-notif-dropdown">
          {/* Header */}
          <div className="admin-notif-header">
            <div className="admin-notif-title-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-bell" style={{ color: '#0066ff', fontSize: '0.9rem' }}></i>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                  Notifications
                </h4>
                {unreadCount > 0 && (
                  <span className="admin-notif-pill">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="admin-notif-action-btn"
                  onClick={fetchNotifications}
                  title="Refresh activity"
                  disabled={loading}
                >
                  <i className={`fa-solid fa-arrows-rotate ${loading ? 'fa-spin' : ''}`}></i>
                </button>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="admin-notif-mark-read"
                    onClick={markAllAsRead}
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="admin-notif-tabs">
              {[
                { id: 'all', label: 'All', count: counts.all },
                { id: 'user', label: 'Users', icon: 'fa-user-plus', count: counts.user },
                { id: 'listing', label: 'Listings', icon: 'fa-house-chimney', count: counts.listing },
                { id: 'review', label: 'Reviews', icon: 'fa-star', count: counts.review },
                { id: 'complaint', label: 'Complaints', icon: 'fa-triangle-exclamation', count: counts.complaint }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`admin-notif-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.icon && <i className={`fa-solid ${tab.icon}`} style={{ marginRight: 4, fontSize: '0.75rem' }}></i>}
                  {tab.label}
                  <span className="tab-count">{tab.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Body / Notification List */}
          <div className="admin-notif-list">
            {loading && notifications.length === 0 ? (
              <div className="admin-notif-empty">
                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: '#6366f1' }}></i>
                <p>Loading activity...</p>
              </div>
            ) : filteredNotifs.length === 0 ? (
              <div className="admin-notif-empty">
                <i className="fa-regular fa-bell-slash" style={{ fontSize: '1.8rem', color: '#475569', marginBottom: '0.5rem' }}></i>
                <p style={{ margin: 0, fontWeight: 500, color: '#94a3b8' }}>No notifications found</p>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {activeTab === 'all' ? 'All caught up!' : `No ${activeTab} activity recorded yet.`}
                </span>
              </div>
            ) : (
              filteredNotifs.map((notif) => {
                const isRead = readIds.includes(notif.id);
                const info = getTypeIcon(notif.type);
                return (
                  <div
                    key={notif.id}
                    className={`admin-notif-item ${isRead ? 'read' : 'unread'}`}
                    onClick={() => handleItemClick(notif)}
                  >
                    {/* Unread indicator */}
                    {!isRead && <div className="admin-notif-unread-dot" />}

                    {/* Type Icon */}
                    <div
                      className="admin-notif-icon-circle"
                      style={{ background: info.bg, color: info.color }}
                    >
                      <i className={`fa-solid ${info.icon}`}></i>
                    </div>

                    {/* Content */}
                    <div className="admin-notif-content">
                      <div className="admin-notif-row">
                        <span className="admin-notif-item-title">{notif.title}</span>
                        <span className="admin-notif-time">{timeAgo(notif.createdAt)}</span>
                      </div>
                      <p className="admin-notif-desc">{notif.message}</p>
                      
                      {/* Meta badges if applicable */}
                      <div className="admin-notif-meta-row">
                        <span
                          className="admin-notif-tag"
                          style={{
                            background: info.bg,
                            color: info.color,
                          }}
                        >
                          {info.label}
                        </span>
                        {notif.meta?.priority && (
                          <span
                            className="admin-notif-tag"
                            style={{
                              background: notif.meta.priority === 'urgent' ? '#fee2e2' : '#fef3c7',
                              color: notif.meta.priority === 'urgent' ? '#dc2626' : '#d97706',
                            }}
                          >
                            {notif.meta.priority}
                          </span>
                        )}
                        {notif.meta?.rating && (
                          <span
                            className="admin-notif-tag"
                            style={{ background: '#fef3c7', color: '#d97706' }}
                          >
                            ★ {notif.meta.rating}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="admin-notif-footer">
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Real-time platform activity
            </span>
            <button
              type="button"
              className="admin-notif-quicklink"
              onClick={() => {
                setIsOpen(false);
                navigate('/admin/complaints');
              }}
            >
              Complaints Hub <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.65rem' }}></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

