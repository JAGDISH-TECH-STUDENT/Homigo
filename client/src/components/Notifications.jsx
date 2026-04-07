import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await API.get('/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {}
  };

  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      loadNotifications();
    } catch (err) {}
  };

  const markAllAsRead = async () => {
    try {
      await API.put('/notifications/readAll');
      loadNotifications();
    } catch (err) {}
  };

  const getIcon = (type) => {
    switch (type) {
      case 'booking': return 'fa-calendar-check';
      case 'payment': return 'fa-credit-card';
      case 'review': return 'fa-star';
      case 'message': return 'fa-message';
      case 'complaint': return 'fa-headset';
      case 'listing': return 'fa-building';
      case 'approval': return 'fa-check-circle';
      case 'system': return 'fa-circle-info';
      default: return 'fa-bell';
    }
  };

  if (!notifications.length) return null;

  return (
    <div style={{ position: 'relative' }}>
      <button 
        onClick={() => setOpen(!open)} 
        style={{ 
          background: 'none', border: 'none', cursor: 'pointer', 
          position: 'relative', fontSize: '1.1rem', color: '#666', padding: '0.5rem'
        }}
      >
        <i className="fa-regular fa-bell"></i>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            background: '#ef4444', color: '#fff',
            borderRadius: '50%', width: 16, height: 16,
            fontSize: '0.65rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0,
          width: 360, maxHeight: 400, overflow: 'auto',
          background: '#fff', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          zIndex: 1000, marginTop: '0.5rem'
        }}>
          <div style={{ 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '1rem', borderBottom: '1px solid #e2e8f0'
          }}>
            <h4 style={{ margin: 0, fontSize: '1rem' }}>Notifications</h4>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead} 
                style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Mark all read
              </button>
            )}
          </div>
          
          {notifications.slice(0, 10).map(n => (
            <Link 
              key={n._id} 
              to={n.link || '#'}
              onClick={() => { setOpen(false); if (!n.isRead) markAsRead(n._id); }}
              style={{ 
                display: 'block', padding: '0.75rem 1rem', 
                borderBottom: '1px solid #f1f5f9',
                textDecoration: 'none', color: 'inherit',
                background: n.isRead ? '#fff' : '#f0f9ff'
              }}
            >
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ 
                  width: 36, height: 36, borderRadius: '50%', 
                  background: n.isRead ? '#f1f5f9' : '#dbeafe',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: n.isRead ? '#64748b' : '#3b82f6', flexShrink: 0
                }}>
                  <i className={`fa-solid ${getIcon(n.type)}`} style={{ fontSize: '0.9rem' }}></i>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 500, fontSize: '0.9rem', margin: '0 0 0.25rem 0', lineHeight: 1.3 }}>{n.title}</p>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, lineHeight: 1.3 }}>{n.message}</p>
                  <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
                    {new Date(n.createdAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: 'numeric' })}
                  </p>
                </div>
                {!n.isRead && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', flexShrink: 0, marginTop: 4 }}></div>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}