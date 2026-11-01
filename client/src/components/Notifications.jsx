import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [selectedAdminMessage, setSelectedAdminMessage] = useState(null);

  async function loadNotifications() {
    try {
      const res = await API.get('/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {
      return;
    }
  }

  useEffect(() => {
    const initialLoad = setTimeout(loadNotifications, 0);
    const interval = setInterval(loadNotifications, 30 * 1000);
    return () => {
      clearTimeout(initialLoad);
      clearInterval(interval);
    };
  }, []);

  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      loadNotifications();
    } catch {
      return;
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.put('/notifications/readAll');
      loadNotifications();
    } catch {
      return;
    }
  };

  const clearRead = async () => {
    try {
      await API.delete('/notifications/read');
      loadNotifications();
    } catch {
      return;
    }
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

  const getUserInitial = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  if (!notifications.length) return null;

  return (
    <div style={{ position: 'relative' }}>
      <button 
        onClick={() => setOpen(!open)} 
        style={{ 
          background: 'none', border: 'none', cursor: 'pointer', 
          position: 'relative', fontSize: '1.1rem', color: 'rgba(255,255,255,0.75)', padding: '0.5rem',
          transition: 'color 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.75)'}
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
          background: '#111827', borderRadius: 12, 
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6)',
          zIndex: 1000, marginTop: '0.5rem'
        }}>
          <div style={{ 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <h4 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>Notifications</h4>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead} 
                style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500 }}
              >
                Mark all read
              </button>
            )}
              <button onClick={clearRead} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', cursor: 'pointer' }}>
                Clear read
              </button>
            </div>
          </div>
          
          {notifications.slice(0, 10).map(n => {
            const isMsg = n.type === 'message';
            const contentInner = (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {isMsg ? (
                  <div style={{ 
                    width: 36, height: 36, borderRadius: '50%', 
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', flexShrink: 0, fontWeight: 600, fontSize: '0.9rem'
                  }}>
                    <i className="fa-solid fa-shield-halved" style={{ fontSize: '0.85rem' }}></i>
                  </div>
                ) : (
                  <div style={{ 
                    width: 36, height: 36, borderRadius: '50%', 
                    background: n.isRead ? 'rgba(255,255,255,0.06)' : 'rgba(99, 102, 241, 0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: n.isRead ? 'rgba(255,255,255,0.6)' : '#818cf8', flexShrink: 0
                  }}>
                    <i className={`fa-solid ${getIcon(n.type)}`} style={{ fontSize: '0.9rem' }}></i>
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {isMsg ? (
                    <p style={{ fontWeight: 500, fontSize: '0.9rem', margin: '0 0 0.25rem 0', lineHeight: 1.3, color: '#fff' }}>
                      <span style={{ color: '#818cf8' }}>Admin Message</span>
                      {n.data?.subject ? `: ${n.data.subject}` : ''}
                    </p>
                  ) : (
                    <p style={{ fontWeight: 500, fontSize: '0.9rem', margin: '0 0 0.25rem 0', lineHeight: 1.3, color: '#fff' }}>{n.title}</p>
                  )}
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)', margin: 0, lineHeight: 1.3 }}>{n.message}</p>
                  {isMsg && (
                    <p style={{ fontSize: '0.75rem', color: '#818cf8', margin: '0.35rem 0 0', fontWeight: 600 }}>
                      View Admin Message →
                    </p>
                  )}
                  <p style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.4)', margin: '0.25rem 0 0 0' }}>
                    {new Date(n.createdAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: 'numeric' })}
                  </p>
                </div>
                {!n.isRead && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#818cf8', flexShrink: 0, marginTop: 4 }}></div>}
              </div>
            );

            if (isMsg) {
              return (
                <div
                  key={n._id}
                  onClick={() => {
                    setOpen(false);
                    if (!n.isRead) markAsRead(n._id);
                    setSelectedAdminMessage(n);
                  }}
                  style={{
                    display: 'block', padding: '0.75rem 1rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    cursor: 'pointer',
                    background: n.isRead ? 'transparent' : 'rgba(99, 102, 241, 0.08)',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(99, 102, 241, 0.08)'}
                >
                  {contentInner}
                </div>
              );
            }

            return (
              <Link 
                key={n._id} 
                to={n.link || '#'}
                onClick={() => { setOpen(false); if (!n.isRead) markAsRead(n._id); }}
                style={{ 
                  display: 'block', padding: '0.75rem 1rem', 
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  textDecoration: 'none', color: '#fff',
                  background: n.isRead ? 'transparent' : 'rgba(99, 102, 241, 0.08)',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(99, 102, 241, 0.08)'}
              >
                {contentInner}
              </Link>
            );
          })}
        </div>
      )}

      {/* Admin Message Modal */}
      {selectedAdminMessage && (
        <div 
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 9999, padding: '1rem'
          }}
          onClick={() => setSelectedAdminMessage(null)}
        >
          <div 
            style={{
              background: '#111827', border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px', maxWidth: '500px', width: '100%',
              padding: '1.5rem', boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: 34, height: 34, borderRadius: '8px', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                  <i className="fa-solid fa-shield-halved"></i>
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#f8fafc', fontWeight: 600 }}>Message from Homigo Admin</h4>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Official Platform Notice</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedAdminMessage(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {selectedAdminMessage.data?.subject && (
              <div style={{ marginBottom: '0.85rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#818cf8', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Subject</span>
                <p style={{ margin: '0.2rem 0 0', fontSize: '1rem', fontWeight: 600, color: '#f1f5f9' }}>
                  {selectedAdminMessage.data.subject}
                </p>
              </div>
            )}

            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Message</span>
              <div style={{
                marginTop: '0.35rem', padding: '0.85rem 1rem', background: '#0b0f1a',
                borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)',
                color: '#e2e8f0', fontSize: '0.88rem', lineHeight: '1.5', whiteSpace: 'pre-wrap'
              }}>
                {selectedAdminMessage.message}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Received {new Date(selectedAdminMessage.createdAt).toLocaleString()}
              </span>
              <button
                type="button"
                onClick={() => setSelectedAdminMessage(null)}
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  color: '#fff', border: 'none', padding: '0.5rem 1.25rem',
                  borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}