import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import API from '../api/axios';

export default function Chat() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadConversations = useCallback(async () => {
    try {
      const [messageResponse, notificationResponse] = await Promise.all([
        API.get('/messages'),
        API.get('/notifications')
      ]);
      const existingConversations = messageResponse.data.conversations || [];
      const notificationConversations = (notificationResponse.data.notifications || [])
        .filter(notification => notification.type === 'message' && notification.data?.senderId)
        .map(notification => ({
          userId: notification.data.senderId,
          username: notification.data.senderRole === 'admin' ? 'Admin' : (notification.data.senderName || 'User'),
          lastMessage: {
            content: notification.data.subject
              ? `${notification.data.subject}\n\n${notification.message}`
              : notification.message,
            createdAt: notification.createdAt,
            from: {
              _id: notification.data.senderId,
              username: notification.data.senderRole === 'admin' ? 'Admin' : (notification.data.senderName || 'User'),
              role: notification.data.senderRole
            }
          },
          unread: notification.isRead ? 0 : 1
        }));
      const merged = [...existingConversations];
      notificationConversations.forEach(notificationConversation => {
        if (!merged.some(conversation => conversation.userId === notificationConversation.userId)) {
          merged.push(notificationConversation);
        }
      });
      setConversations(merged);
      if (!userId && user?.role === 'guest' && merged.length > 0) {
        navigate(`/chat/${merged[0].userId}`, { replace: true });
      }
    } catch {
      return;
    } finally {
      setLoading(false);
    }
  }, [navigate, user, userId]);

  const loadMessages = useCallback(async (uid) => {
    try {
      const res = await API.get(`/messages/${uid}`);
      setMessages(res.data.messages || []);
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (userId) {
      loadMessages(userId);
    }
  }, [userId, loadMessages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId) return;
    setSending(true);
    try {
      const res = await API.post('/messages', { to: userId, content: newMessage });
      setMessages([...messages, res.data.message]);
      setNewMessage('');
    } catch {
      return;
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="loading-spinner" />;

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Messages</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: userId ? '300px 1fr' : '1fr', gap: '1.5rem' }}>
        <div className="card" style={{ padding: '1rem', maxHeight: '70vh', overflow: 'auto' }}>
          {conversations.length === 0 ? (
            <p style={{ color: '#888', textAlign: 'center', padding: '2rem' }}>No conversations yet</p>
          ) : (
            <div>
              {conversations.map(conv => (
                <Link
                  key={conv.userId}
                  to={`/chat/${conv.userId}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '1rem',
                    borderRadius: 'var(--radius-sm)',
                    textDecoration: 'none',
                    color: 'inherit',
                    background: userId === conv.userId ? 'var(--bg-secondary)' : 'transparent',
                    borderBottom: '1px solid var(--border)'
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'var(--primary)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 600, marginRight: '0.75rem'
                  }}>
                    {conv.username?.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: 600 }}>{conv.username}</div>
                    <div style={{ fontSize: '0.85rem', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {conv.lastMessage?.content}
                    </div>
                  </div>
                  {conv.unread > 0 && (
                    <span style={{
                      background: 'var(--primary)', color: '#fff',
                      borderRadius: '50%', width: 20, height: 20,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem'
                    }}>{conv.unread}</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {userId ? (
          <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', height: '70vh' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}>
              {messages[0]?.listing?._id ? (
                <Link to={`/listings/${messages[0].listing._id}`} style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>
                  Re: {messages[0].listing.title || 'Listing'}
                </Link>
              ) : (
                <span style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>
                  Chat
                </span>
              )}
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
              {messages.map((msg, i) => {
                const isMe = msg.from?._id === user._id || msg.from === user._id;
                const senderName = msg.from?.role === 'admin'
                  ? 'Admin'
                  : (msg.from?.username || (isMe ? user.username : 'User'));
                return (
                  <div key={i} style={{
                    display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      maxWidth: '70%',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      background: isMe ? 'var(--primary)' : 'var(--bg-secondary)',
                      color: isMe ? '#fff' : 'inherit',
                      whiteSpace: 'pre-wrap'
                    }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, marginBottom: '0.25rem', opacity: 0.8 }}>
                        {senderName}
                      </div>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
            </div>
            {user.role === 'guest' ? (
              <p style={{ marginTop: '1rem', padding: '0.75rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: 'var(--radius-sm)' }}>
                Guests can view messages but cannot send messages.
              </p>
            ) : (
              <form onSubmit={sendMessage} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <input
                  type="text"
                  className="form-control"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-primary" disabled={sending}>
                  {sending ? '...' : 'Send'}
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
}